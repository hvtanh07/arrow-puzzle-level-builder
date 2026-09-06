# Arrow Puzzle Level Builder & Playtest Studio

A modern, responsive, and robust web application for building, validating, and playtesting levels for **Arrow Puzzle** (also known as *Arrows Escape* or *Tap Away Arrows*).

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and the **Web Audio API**.

---

## Table of Contents
1. [Core Game Mechanics & Rules](#1-core-game-mechanics--rules)
2. [Project Architecture & Design Patterns](#2-project-architecture--design-patterns)
3. [Directory Tree & File Dictionary](#3-directory-tree--file-dictionary)
4. [Data Models & Types (`src/types.ts`)](#4-data-models--types)
5. [Color System (`src/constants/colors.ts`)](#5-color-system)
6. [Geometry & Ray-Casting Engine (`src/utils/geometry.ts`)](#6-geometry--ray-casting-engine)
7. [Live Solvability & Deadlock Solver (`src/utils/solver.ts`)](#7-live-solvability--deadlock-solver)
8. [Minimal JSON Export & Import (`src/utils/jsonHandler.ts`)](#8-minimal-json-export--import)
9. [Canvas Coordinate System, Centering, Zoom & Pan](#9-canvas-coordinate-system-centering-zoom--pan)
10. [Play Test Mode & Boosters (`src/components/PlayTestView.tsx`)](#10-play-test-mode--boosters)
11. [Developer & AI Extension Guide](#11-developer--ai-extension-guide)
12. [Premade Level Progression & Intentional Design Decisions](#12-premade-level-progression--intentional-design-decisions)

---

## 1. Core Game Mechanics & Rules

- **Arrow Geometry**: Every arrow is an orthogonal polyline defined by discrete integer grid vertices `points: [{ x, y }, ...]`.
  - `points[0]` is the tail.
  - `points[points.length - 1]` is the tip/head where the arrowhead is rendered.
  - Segments are strictly horizontal or vertical (90° turns).
- **Head Direction**: The direction the arrow points is determined by the vector from the second-to-last point to the head:
  $$\vec{D} = \text{sign}(P_{\text{head}} - P_{\text{head}-1})$$
  Possible directions: `'UP' (0, -1)`, `'DOWN' (0, 1)`, `'LEFT' (-1, 0)`, `'RIGHT' (1, 0)`.
- **Exit Trajectory**:
  When tapped or simulated, an arrow attempts to escape by moving forward in direction $\vec{D}$.
  As a polyline moving forward along its own track, the points it sweeps are:
  1. Its own existing occupied cells (which it already occupies peacefully without collision).
  2. The forward straight ray $R(t) = P_{\text{head}} + t \cdot \vec{D}$ for $t = 1, 2, 3, \dots$ until exiting the grid boundary.
- **Collision Rule**:
  An arrow $A$ is **blocked** if any other arrow $B$ occupies at least one grid point along its forward exit ray $R(t)$.
  If unobstructed all the way off the board, the arrow is **free to escape**.
- **Monotonic Relaxation**:
  Removing an arrow from the board strictly removes obstacles and *never* blocks any other arrow. Therefore, the puzzle satisfies the Church-Rosser / confluence property: any unblocked arrow can be safely removed without preventing a valid solution.

---

## 2. Project Architecture & Design Patterns

### State Management Pattern (Single Source of Truth)
All persistent level state and shared editor state lives in `src/App.tsx`:
- `levels: Level[]`: All levels stored in `localStorage` (`arrow_puzzle_levels_v2`) with fallback to `PREMADE_LEVELS`.
- `currentLevelId: string`: ID of currently active level (defaults to `'level-9'`, the screenshot stage).
- `mode: 'builder' | 'playtest'`: Active screen mode.
- `tool: 'draw' | 'select'`: Active editing tool on the canvas.
- `selectedArrowId: string | null`: Currently selected arrow for property inspection.
- `activeColorId: number`: Color index `0..7` used for drawing and quick color application.
- `solvability`: Computed via `useMemo(() => solveLevel(currentLevel.arrows, currentLevel.gridSize), [...])`.

### 3-Column Studio Layout
```
+-------------------------------------------------------------------------------------------------+
| Top Header: Brand Title | Mode Switcher (Builder / Play Test) | Live Solvability Pill | Audio   |
+--------------------------+---------------------------------------------+------------------------+
| LEFT PANEL (Persistent)  | CENTER CANVAS                               | RIGHT PANEL (Inspector)|
| `LeftLevelPanel.tsx`     | `CanvasEditor.tsx` / `PlayTestView.tsx`     | `RightToolPanel.tsx`   |
| - Always visible         | - Symmetrically centered SVG board          | - Always visible       |
| - Level List management  | - Mouse wheel zoom & right-click pan        | - Tool: Draw / Select  |
| - New Level creation     | - Orthogonal polyline stroke drawing        | - 8 Colors Palette     |
| - Search & Filters       | - Vertex dragging & whole-arrow moving      | - Arrow Actions:       |
| - Export / Import JSON   | - Ray tracing collision visualization       |   Flip, Dup, Delete    |
| - Level cards with stats | - (Switches to Play Test view in play mode) | - Width (X) & Height(Y)|
|   & solvability badges   |                                             | - View & History tools |
+--------------------------+---------------------------------------------+------------------------+
```

---

## 3. Directory Tree & File Dictionary

```
arrow puzzle level builder/
├── index.html                   # HTML entry point with Fredoka & Inter fonts
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration with React plugin
├── tailwind.config.js           # Tailwind CSS theme & animation extensions
├── postcss.config.js            # PostCSS plugins (Tailwind, Autoprefixer)
├── scripts/
│   ├── test-all.ts              # Complete automated test suite (28 assertions)
│   └── test-levels.ts           # Solver & overlap verification script
└── src/
    ├── main.tsx                 # React application root mount
    ├── App.tsx                  # Core state coordinator & 3-column layout orchestrator
    ├── types.ts                 # TypeScript interfaces and domain types
    ├── index.css                # Global CSS & Tailwind directives
    ├── constants/
    │   └── colors.ts            # The 8 strict color definitions (0..7) and lookup utilities
    ├── data/
    │   └── premadeLevels.ts     # 10 hand-crafted, verified solvable premade levels
    ├── utils/
    │   ├── geometry.ts          # Direction vectors, discrete point rasterization, ray checks
    │   ├── solver.ts            # Real-time greedy clearance solver & deadlock detector
    │   ├── jsonHandler.ts       # Strict minimal JSON export/import & validator
    │   └── sound.ts             # Web Audio API procedural sound synthesizer
    └── components/
        ├── ArrowRenderer.tsx    # Vector SVG polyline & arrowhead renderer with 3D shadows
        ├── CanvasEditor.tsx     # Center interactive canvas with zoom, pan, and orthogonal drawing
        ├── LeftLevelPanel.tsx   # Persistent left sidebar for level list management
        ├── RightToolPanel.tsx   # Persistent right sidebar for tools, 8 colors, and grid inputs
        ├── LiveSolvabilityBadge.tsx # Top bar badge showing solvability & auto-solve preview
        └── PlayTestView.tsx     # Mobile casual playtest simulator with 3 boosters
```

---

## 4. Data Models & Types (`src/types.ts`)

```typescript
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Point {
  x: number; // discrete grid column (0 <= x < gridSize.width)
  y: number; // discrete grid row (0 <= y < gridSize.height)
}

export interface Arrow {
  id: string;             // unique identifier e.g. "arrow_a1"
  points: Point[];        // vertices from tail (points[0]) to tip (points[length-1])
  color: number | string; // color ID 0..7 or hex code
}

export interface GridSize {
  width: number;  // X / columns count (default 8)
  height: number; // Y / rows count (default 9)
}

export interface Level {
  id: string;
  name: string;
  gridSize: GridSize;
  arrows: Arrow[];
}

export interface SolvabilityResult {
  isSolvable: boolean;
  hasOverlaps: boolean;
  overlaps: { arrow1Id: string; arrow2Id: string; point: Point }[];
  stepOrder: string[];                   // array of arrow IDs in clearance order
  deadlockedArrowIds: string[];          // IDs of arrows stuck in circular blocks
  blockingGraph: Record<string, string[]>; // arrowId -> blocker arrow IDs
  message: string;
}
```

---

## 5. Color System (`src/constants/colors.ts`)

Strictly restricted to **8 color types (indexed 0 through 7)**:

| ID | Name   | Hex Code   | Border Code | Purpose |
|----|--------|------------|-------------|---------|
| 0  | Red    | `#ef4444`  | `#dc2626`   | Barrier arrows, warning accents |
| 1  | Blue   | `#3b82f6`  | `#2563eb`   | Primary straight/bent arrows (Level 9) |
| 2  | Green  | `#22c55e`  | `#16a34a`   | Mid-layer turning arrows (Level 9) |
| 3  | Yellow | `#eab308`  | `#ca8a04`   | Highlight / interior arrows |
| 4  | Pink   | `#ec4899`  | `#db2777`   | Outer perimeter arrows (Level 9 outer) |
| 5  | Orange | `#f97316`  | `#ea580c`   | Transversal / crossing arrows |
| 6  | Brown  | `#854d0e`  | `#713f12`   | Earthy obstacle arrows |
| 7  | Cyan   | `#06b6d4`  | `#0891b2`   | High-contrast horizontal arrows |

### Color Helper Functions
- `getColorHex(color: number | string): string`: Returns standard hex code from index `0..7` or hex string.
- `getColorId(color: number | string): number`: Returns integer `0..7` from any color value.

---

## 6. Geometry & Ray-Casting Engine (`src/utils/geometry.ts`)

- `getHeadDirection(arrow)`: Calculates dominant orientation of the final segment.
- `getDirectionVector(dir)`: Returns normalized unit vector `{ x, y }`.
- `getArrowOccupiedPoints(arrow)`: Discrete Bresenham rasterization converting segment coordinates into an array of discrete points `{ x, y }` occupied on the grid.
- `analyzeArrowExit(arrow, allArrows, gridSize)`:
  1. Casts a ray from `P_head` along `dir` step-by-step: `checkPoint = P_head + step * v`.
  2. If `checkPoint` exits board bounds, ray has cleared with no obstacles (`isBlocked = false`).
  3. If `checkPoint` matches any cell occupied by another arrow, records `blockedByArrowIds` and `firstObstacle` coordinate.
- `checkArrowOverlaps(arrows)`: Detects if any two arrows illegally intersect at rest before any moves are made.

---

## 7. Live Solvability & Deadlock Solver (`src/utils/solver.ts`)

Algorithm:
1. Check for resting overlaps.
2. Initialize `remaining = [...arrows]`, `stepOrder = []`.
3. Loop while `remaining.length > 0`:
   - Filter `free = remaining.filter(a => !analyzeArrowExit(a, remaining, gridSize).isBlocked)`.
   - If `free.length === 0`:
     - **Deadlock detected!** Remaining arrows mutually block each other.
     - Build `blockingGraph` for diagnostics and return `isSolvable: false`.
   - Pop chosen arrow from `free`, append to `stepOrder`, remove from `remaining`.
4. If loop completes, return `isSolvable: true` with complete solution clearance order.
- Time Complexity: $\mathcal{O}(N^2 \cdot \max(W, H))$ where $N \le 30$ arrows. Runs in $<2\text{ms}$.

---

## 8. Minimal JSON Export & Import (`src/utils/jsonHandler.ts`)

Exports clean, minimal JSON containing **only** required parameters:
```json
{
  "id": "level_9",
  "name": "Level 9: Screenshot Stage",
  "gridSize": {
    "width": 8,
    "height": 9
  },
  "arrows": [
    {
      "id": "purple_outer",
      "color": 4,
      "points": [
        { "x": 1, "y": 8 },
        { "x": 7, "y": 8 },
        { "x": 7, "y": 1 }
      ]
    }
  ]
}
```
Validation ensures:
- `gridSize.width` and `height` are integers between 3 and 30.
- `arrows` is an array of objects with `id`, `color` (0..7 or hex), and `points` (at least 2 points).

---

## 9. Canvas Coordinate System, Centering, Zoom & Pan

### Symmetric Centering Formulas
In `src/components/CanvasEditor.tsx`:
```typescript
const cellSize = 54;
const gridWidth = (gridSize.width - 1) * cellSize;
const gridHeight = (gridSize.height - 1) * cellSize;

const boardMargin = 45; // Equal margin around dots on all 4 sides
const padding = 65;     // Outer SVG padding for labels

// Symmetrical rounded card:
const cardX = padding - boardMargin;
const cardY = padding - boardMargin;
const cardWidth = gridWidth + boardMargin * 2;
const cardHeight = gridHeight + boardMargin * 2;
```
- First dot (col 0): at `x = padding`. Distance from card left edge = `boardMargin` (45px).
- Last dot (col width - 1): at `x = padding + gridWidth`. Distance to card right edge = `boardMargin` (45px).
- Top dot (row 0): at `y = padding`. Distance from card top edge = `boardMargin` (45px).
- Bottom dot (row height - 1): at `y = padding + gridHeight`. Distance to card bottom edge = `boardMargin` (45px).

### Zoom & Pan Implementation
- **Zoom**: Wheel event updates `zoom` state between `0.3x` and `3.0x`.
- **Pan**: Right-click mouse down (when not drawing) starts drag, updating `pan: { x, y }`.
- **Transformation**: Board card container applies `transform: translate(${pan.x}px, ${pan.y}px) scale(${zoom})` with `transformOrigin: 'center center'`.
- **Screen-to-Grid Math**:
  ```typescript
  const rect = svgRef.current.getBoundingClientRect();
  const localX = (e.clientX - rect.left) / zoom;
  const localY = (e.clientY - rect.top) / zoom;
  const gx = Math.max(0, Math.min(gridSize.width - 1, Math.round((localX - padding) / cellSize)));
  const gy = Math.max(0, Math.min(gridSize.height - 1, Math.round((localY - padding) / cellSize)));
  ```

### Tool Modes & Arrow Controls
1. **Draw Mode (`tool === 'draw'`)**:
   - **Head-First Drawing**: The starting left-click places the **Arrow Head**!
   - **Adding Turn Points**: Subsequent left-clicks place body corners and turns.
   - **Ending the Arrow**: **Right-click** immediately commits and ends the arrow.
   - **Live Preview**: Displays an arrow head pointing outwards away from the incoming body segment with a pulsing head badge at the starting point.
   - **Strict Separation**: Existing arrows have `pointer-events: none` in Draw mode so clicking to draw never accidentally selects or moves existing arrows.
2. **Select Mode (`tool === 'select'`)**:
   - **Single Click**: Selects the target arrow and highlights it. Clicking empty canvas deselects.
   - **Drag-to-Move**: Left-click and drag any arrow to move it smoothly across the grid; release mouse to drop and place it in position.
   - **Vertex Handles**: Drag individual corner handles to adjust arrow turns.
   - **Drawing Disabled**: Drawing new arrows is blocked in Select mode.

---

## 10. Play Test Mode & Boosters (`src/components/PlayTestView.tsx`)

Authentic casual mobile game UI featuring:
- **Polyline Slither Exit Animation**:
  - When an unblocked arrow is tapped, it performs a real-time, polyline-following exit animation (`requestAnimationFrame`).
  - The **arrow head** moves straight ahead in its exit direction.
  - The **arrow body** follows along the exact original arrow path, smoothly turning through all intermediate corners (like a train on tracks) before straightening out onto the exit trajectory off the board.
  - Handled via geometry functions in `src/utils/geometry.ts`:
    - `getExtendedTrack(points, exitDistance)`: Extends the polyline in the head's escape direction.
    - `computePolylineLengths(track)`: Computes cumulative arc lengths along the polyline.
    - `slicePolyline(track, cumLengths, sStart, sEnd)`: Slices the moving window $[s, s + L]$ of the arrow, preserving all intermediate corner vertices between tail and head.
  - Overflows smoothly outside the game board (`style={{ overflow: 'visible' }}`).
- **Exactly 3 Boosters**:
  1. 💡 **Hint**: Locates a currently free arrow and pulses it in gold/emerald.
  2. ✂️ **Remove Any Arrow**: Activates target removal mode. Tapping any arrow removes it directly from the board.
  3. 🛣️ **Highlight Path**: Toggles visual escape trajectory rays for every arrow on the board in that arrow's specific color.
- **Lives System**: 3 Hearts (❤️❤️❤️). Blocked arrows wobble, play bump sound, and deduct 1 life.
- **Sound Engine (`sound.ts`)**: Procedural audio using `AudioContext` oscillators (whoosh, bump, pop, click, victory fanfare).

---

## 11. Developer & AI Extension Guide

### How to Add a New Booster to Play Test Mode
1. Open `src/components/PlayTestView.tsx`.
2. Add a booster state (e.g. `const [isFreezeMode, setIsFreezeMode] = useState(false)`).
3. Add a handler function and button in the bottom power-ups bar.
4. Hook the effect into `handleArrowTap`.

### How to Add a New Level Mechanic (e.g. Obstacle Walls or Portals)
1. In `src/types.ts`, add an optional field to `Level` (e.g. `walls?: Point[]`).
2. In `src/utils/geometry.ts`, update `analyzeArrowExit` to treat wall points as collision blockers.
3. In `src/components/CanvasEditor.tsx`, render wall tiles using SVG `<rect>`.
4. In `src/utils/jsonHandler.ts`, update export/import to serialize the new field.

### How to Run Verification Tests
```bash
npx tsx scripts/test-all.ts
```

### How to Build for Production
```bash
npm run build
```

---

## 12. Premade Level Progression & Intentional Design Decisions

Every premade level in `src/data/premadeLevels.ts` is crafted with an explicit pedagogical goal and puzzle dynamic according to the game's progression roadmap. No arrows are placed randomly. All levels are 100% verified solvable with zero resting overlaps.

| Level | Name | Grid | Arrows | Difficulty | Branching Profile | Core Design Decision & Progression Concept |
|---|---|---|---|---|---|---|
| **1** | **The First Chain** | 6×6 | 3 | Tutorial | `[1, 1, 1]` | **Sequential Removal**: 3 arrows locked in a strict linear chain (`blue_hook -> red_pillar -> green_runner`). Blue L-hook exits right; Red vertical pillar unblocks up; Green horizontal runner unblocks right. Teaches that arrows are locked together and must be removed one by one. |
| **2** | **The Winding Hook** | 7×7 | 4 | Easy | `[1, 1, 1, 1]` | **Long Hook Lock**: Features a long 2-turn hook arrow wrapping around a center dart and base dart. |
| **3** | **The Serpentine Knot** | 7×7 | 5 | Easy+ | `[1, 1, 2, 2, 1]` | **Multi-Turn S-Serpent**: Long 3-turn serpentine arrow weaves across rows 1, 3 and cols 2, 4, caging peripheral pins. |
| **4** | **The Double Winding** | 8×8 | 5 | Medium | `[1, 1, 2, 1, 1]` | **Interlocking Multi-Turn Bends**: An outer 2-turn hook and an inner 2-turn S-bend weave around each other. |
| **5** | **The Coiled Labyrinth** | 8×8 | 6 | Medium | `[1, 1, 1, 1, 1, 1]` | **Double Serpentine Clasp**: Two large 3-turn serpents wrap around each other in a double labyrinth with 4 interlocked pins. |
| **6** | **Tangled Noise** | 8×8 | 6 | Med-Hard | `[1, 1, 2, 2, 1, 1]` | **Winding Visual & Structural Noise**: 6 serpentine arrows (S-hooks, U-turns, zigzags, meanders) intertwined in a dense maze. |
| **7** | **The Domino Spiral** | 8×8 | 7 | Satisfying | `[1, 1, 1, 1, 1, 1, 1]` | **Nested Hook Cascade**: An interlocking puzzle-box spiral of nested L-hooks and elbows where each arrow unblocks the next in a rhythmic chain reaction. |
| **8** | **The Interwoven Comb** | 8×8 | 14 | Satisfying | `[1, 2, 3, 3, 3, 3, 3, 4, 4, 3, 2, 2, 1, 1]` | **Dual Vertical Spines & Teeth**: Evenly fills 78% of the 8×8 grid across all 8 rows and 8 columns with zero holes. Solves cleanly in 14 steps once the top key unlocks the spines. |
| **9** | **The Gentle Breeze** | 6×6 | 8 | Easy (Breather) | `[4, 4, 3, 3, 2, 2, 1, 1]` | **Evenly Filled Breather**: 78% density across 6×6 with perimeter borders and filled center columns (2 & 3). Retains relaxing, straightforward escapes without large empty voids. |
| **10** | **The Master Labyrinth** | 10×14 | 20 | Expert (Grand Finale) | `[8, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6, 5, 5, 4, 3, 2, 2, 1, 1]` | **The Masterpiece Finale**: Achieving 77% density (108/140 cells) across 10×14. Densely packed with 20 interlocking multi-turn arrows across all 8 colors with zero dead zones, zero resting overlaps, and a thrilling 20-step clearance cascade. |

### Level 10 ("The Master Labyrinth") Deep Dive:
- **Grid Size**: `10 × 14` (140 grid cells, evenly filled at 77% density with zero empty quadrants).
- **Arrow Count**: 20 multi-turn serpentine arrows spanning all 8 colors (`0: Red`, `1: Blue`, `2: Green`, `3: Yellow`, `4: Pink`, `5: Orange`, `6: Brown`, `7: Cyan`).
- **Arrow Geometry**: Every arrow features 2 to 4 turns (S-bends, U-turns, stair-steps, meanders, core snakes, and bridge hooks) that physically cup and interlock with adjacent curves.
- **Solvability & Overlaps**: 100% verified solvable across 20 clearance steps with **0 resting overlaps**.




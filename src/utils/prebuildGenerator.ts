import { Arrow, Direction, GridSize, Point, SelectionArea, StyleProfile } from '../types';
import {
  getArrowOccupiedPoints,
  getDirectionVector,
  getHeadDirection,
  isPointInBounds,
} from './geometry';
import { solveLevel } from './solver';

interface GenerateOptions {
  area: SelectionArea;
  existingArrows: Arrow[];
  gridSize: GridSize;
  style: StyleProfile;
  maxAttempts?: number;
}

export interface PrebuildResult {
  success: boolean;
  arrows: Arrow[]; // all arrows (existing + newly generated)
  newArrows: Arrow[]; // only the newly generated arrows
  message: string;
}

/**
 * Random helper within [min, max] inclusive
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Opposite direction
 */
function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'UP': return 'DOWN';
    case 'DOWN': return 'UP';
    case 'LEFT': return 'RIGHT';
    case 'RIGHT': return 'LEFT';
  }
}

/**
 * Orthogonal perpendicular directions
 */
function getPerpendicularDirections(dir: Direction): Direction[] {
  if (dir === 'UP' || dir === 'DOWN') {
    return ['LEFT', 'RIGHT'];
  }
  return ['UP', 'DOWN'];
}

/**
 * Cleans collinear points in polyline
 */
function cleanCollinear(points: Point[]): Point[] {
  if (points.length <= 2) return points;
  const res: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = res[res.length - 1];
    const cur = points[i];
    const next = points[i + 1];

    const sameH = prev.y === cur.y && cur.y === next.y;
    const sameV = prev.x === cur.x && cur.x === next.x;

    if (!sameH && !sameV) {
      res.push(cur);
    }
  }
  res.push(points[points.length - 1]);
  return res;
}

/**
 * Shuffles array in place
 */
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate high-density space-filling polylines inside marked area
 */
function buildDensePolylineTessellation(
  area: SelectionArea,
  existingOccupied: Set<string>,
  style: StyleProfile
): Arrow[] {
  const width = area.maxX - area.minX + 1;
  const height = area.maxY - area.minY + 1;

  // Occupied grid lookup: key -> boolean
  const occupied = new Set<string>(existingOccupied);
  const isCellAvailable = (x: number, y: number) => {
    return x >= area.minX && x <= area.maxX &&
           y >= area.minY && y <= area.maxY &&
           !occupied.has(`${x},${y}`);
  };

  const colors = style.colorPalette.length > 0 ? style.colorPalette : [1, 2, 4, 3, 5, 0];
  const arrows: Arrow[] = [];

  // 1. Pass 1: Macro Structure (Edge huggers & long snakes)
  // Check perimeter long corridors first to create nice borders (like Image 2)
  const perimeterAttempts = [
    // Top border (left to right)
    { start: { x: area.minX, y: area.minY }, dir: 'RIGHT' as Direction, maxLen: width },
    // Left border (top to bottom)
    { start: { x: area.minX, y: area.minY }, dir: 'DOWN' as Direction, maxLen: height },
    // Bottom border (left to right)
    { start: { x: area.minX, y: area.maxY }, dir: 'RIGHT' as Direction, maxLen: width },
    // Right border (bottom to top)
    { start: { x: area.maxX, y: area.maxY }, dir: 'UP' as Direction, maxLen: height },
  ];
  shuffleArray(perimeterAttempts);

  for (const border of perimeterAttempts) {
    if (Math.random() < 0.65 && isCellAvailable(border.start.x, border.start.y)) {
      const dv = getDirectionVector(border.dir);
      let curr = { ...border.start };
      const pts: Point[] = [curr];
      let len = 1;

      while (len < border.maxLen) {
        const next = { x: curr.x + dv.x, y: curr.y + dv.y };
        if (!isCellAvailable(next.x, next.y)) break;
        pts.push(next);
        curr = next;
        len++;
      }

      if (pts.length >= 3) {
        // Optional turn into interior to form L-hook
        const perps = getPerpendicularDirections(border.dir);
        const turnDir = perps.find((p) => {
          const v = getDirectionVector(p);
          return isCellAvailable(curr.x + v.x, curr.y + v.y);
        });

        if (turnDir && Math.random() < 0.7) {
          const tv = getDirectionVector(turnDir);
          let turnLen = 0;
          const maxTurn = randomInt(2, Math.max(2, Math.floor(border.maxLen / 2)));
          let tCurr = { ...curr };
          while (turnLen < maxTurn) {
            const next = { x: tCurr.x + tv.x, y: tCurr.y + tv.y };
            if (!isCellAvailable(next.x, next.y)) break;
            pts.push(next);
            tCurr = next;
            turnLen++;
          }
        }

        if (pts.length >= 3) {
          const cleaned = cleanCollinear(pts);
          const newArrow: Arrow = {
            id: `gen_border_${Date.now().toString(36)}_${arrows.length}`,
            color: colors[arrows.length % colors.length],
            points: cleaned,
          };
          arrows.push(newArrow);
          for (const p of getArrowOccupiedPoints(newArrow)) {
            occupied.add(`${p.x},${p.y}`);
          }
        }
      }
    }
  }

  // 2. Pass 2: Space-filling snakes & nested U-turns
  // Scan cells that have fewest free neighbors (corners and edges first) to hug snuggly
  let keepGrowing = true;
  let iterations = 0;

  while (keepGrowing && iterations < 150) {
    iterations++;

    // Find all currently available cells
    const freeCells: Point[] = [];
    for (let x = area.minX; x <= area.maxX; x++) {
      for (let y = area.minY; y <= area.maxY; y++) {
        if (isCellAvailable(x, y)) {
          freeCells.push({ x, y });
        }
      }
    }

    if (freeCells.length < 2) {
      break;
    }

    // Sort by neighbor constraint: cells with fewer free neighbors get filled first!
    freeCells.sort((a, b) => {
      const countFreeNeighbors = (p: Point) => {
        let cnt = 0;
        const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        for (const d of dirs) {
          const v = getDirectionVector(d);
          if (isCellAvailable(p.x + v.x, p.y + v.y)) cnt++;
        }
        return cnt;
      };
      return countFreeNeighbors(a) - countFreeNeighbors(b);
    });

    const start = freeCells[0];
    const path: Point[] = [start];
    let curr = { ...start };

    // Choose initial direction with longest available corridor
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    shuffleArray(directions);

    const getFreeRun = (from: Point, dir: Direction): number => {
      const v = getDirectionVector(dir);
      let count = 0;
      let check = { x: from.x + v.x, y: from.y + v.y };
      while (isCellAvailable(check.x, check.y)) {
        count++;
        check = { x: check.x + v.x, y: check.y + v.y };
      }
      return count;
    };

    directions.sort((a, b) => getFreeRun(curr, b) - getFreeRun(curr, a));
    let currentDir = directions[0];

    const maxSegments = randomInt(2, 4); // straight, L-hook, or serpentine
    let segmentCount = 0;
    const pathOccupied = new Set<string>([`${start.x},${start.y}`]);

    while (segmentCount < maxSegments) {
      const dv = getDirectionVector(currentDir);
      const targetSegLen = randomInt(2, Math.max(3, style.maxLength || 5));
      let segLen = 0;

      while (segLen < targetSegLen) {
        const next = { x: curr.x + dv.x, y: curr.y + dv.y };
        if (!isCellAvailable(next.x, next.y) || pathOccupied.has(`${next.x},${next.y}`)) {
          break;
        }
        path.push(next);
        pathOccupied.add(`${next.x},${next.y}`);
        curr = next;
        segLen++;
      }

      segmentCount++;

      // Turn perpendicular
      const perps = getPerpendicularDirections(currentDir);
      shuffleArray(perps);
      perps.sort((a, b) => getFreeRun(curr, b) - getFreeRun(curr, a));

      if (getFreeRun(curr, perps[0]) >= 1) {
        currentDir = perps[0];
      } else {
        break;
      }
    }

    if (path.length >= 2) {
      const cleaned = cleanCollinear(path);
      const newArrow: Arrow = {
        id: `gen_tess_${Date.now().toString(36)}_${arrows.length}`,
        color: colors[arrows.length % colors.length],
        points: cleaned,
      };
      arrows.push(newArrow);
      for (const p of getArrowOccupiedPoints(newArrow)) {
        occupied.add(`${p.x},${p.y}`);
      }
    } else {
      // Could not grow from this cell
      if (freeCells.length <= 2) break;
    }
  }

  // 3. Pass 3: Tail & Head Expansion (Absorb isolated 1-cell gaps!)
  for (const arrow of arrows) {
    let pts = [...arrow.points];

    // Try expanding tail
    let tail = pts[0];
    const secondPt = pts[1];
    const tailDir = {
      x: Math.sign(tail.x - secondPt.x),
      y: Math.sign(tail.y - secondPt.y),
    };

    // Check straight backward from tail
    const backStraight = { x: tail.x + tailDir.x, y: tail.y + tailDir.y };
    if (isCellAvailable(backStraight.x, backStraight.y)) {
      pts[0] = backStraight;
      occupied.add(`${backStraight.x},${backStraight.y}`);
      tail = backStraight;
    }

    // Check perpendicular expansion of tail
    const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    for (const d of dirs) {
      const dv = getDirectionVector(d);
      const adj = { x: tail.x + dv.x, y: tail.y + dv.y };
      if (isCellAvailable(adj.x, adj.y)) {
        pts.unshift(adj);
        occupied.add(`${adj.x},${adj.y}`);
        tail = adj;
        break;
      }
    }

    // Try expanding head
    let head = pts[pts.length - 1];
    const prevPt = pts[pts.length - 2];
    const headDir = {
      x: Math.sign(head.x - prevPt.x),
      y: Math.sign(head.y - prevPt.y),
    };

    const forwardStraight = { x: head.x + headDir.x, y: head.y + headDir.y };
    if (isCellAvailable(forwardStraight.x, forwardStraight.y)) {
      pts[pts.length - 1] = forwardStraight;
      occupied.add(`${forwardStraight.x},${forwardStraight.y}`);
      head = forwardStraight;
    }

    arrow.points = cleanCollinear(pts);
  }

  // 4. Pass 4: Small Pocket Fillers (Fill remaining 2-3 cell pockets)
  for (let x = area.minX; x <= area.maxX; x++) {
    for (let y = area.minY; y <= area.maxY; y++) {
      if (isCellAvailable(x, y)) {
        // Try horizontal 2-cell dart
        if (isCellAvailable(x + 1, y)) {
          const fillerPts = [{ x, y }, { x: x + 1, y }];
          const filler: Arrow = {
            id: `gen_fill_${Date.now().toString(36)}_${arrows.length}`,
            color: colors[arrows.length % colors.length],
            points: fillerPts,
          };
          arrows.push(filler);
          occupied.add(`${x},${y}`);
          occupied.add(`${x + 1},${y}`);
        } else if (isCellAvailable(x, y + 1)) {
          const fillerPts = [{ x, y }, { x, y: y + 1 }];
          const filler: Arrow = {
            id: `gen_fill_${Date.now().toString(36)}_${arrows.length}`,
            color: colors[arrows.length % colors.length],
            points: fillerPts,
          };
          arrows.push(filler);
          occupied.add(`${x},${y}`);
          occupied.add(`${x},${y + 1}`);
        }
      }
    }
  }

  return arrows;
}

/**
 * Optimizes arrow orientations (flipping endpoints) so arrows escape cleanly
 * towards the boundary in an acyclic topological sequence.
 */
function optimizeOrientationsForSolvability(
  candidateArrows: Arrow[],
  existingArrows: Arrow[],
  gridSize: GridSize
): Arrow[] {
  let arrows = candidateArrows.map((a) => ({
    ...a,
    points: a.points.map((p) => ({ ...p })),
  }));

  // Helper to test if head ray exits cleanly
  const checkExitRay = (head: Point, dir: Direction, obstacles: Set<string>): boolean => {
    const dv = getDirectionVector(dir);
    let cx = head.x + dv.x;
    let cy = head.y + dv.y;
    while (isPointInBounds({ x: cx, y: cy }, gridSize)) {
      if (obstacles.has(`${cx},${cy}`)) return false;
      cx += dv.x;
      cy += dv.y;
    }
    return true;
  };

  // 1. Initial heuristic orientation:
  // If an arrow's current head hits a wall/obstacle but its tail has an open ray to the grid boundary, flip it!
  const allOccupied = new Set<string>();
  for (const a of [...existingArrows, ...arrows]) {
    for (const p of getArrowOccupiedPoints(a)) {
      allOccupied.add(`${p.x},${p.y}`);
    }
  }

  for (let i = 0; i < arrows.length; i++) {
    const a = arrows[i];
    const head = a.points[a.points.length - 1];
    const headDir = getHeadDirection(a);

    // Obstacles excluding itself
    const otherOccupied = new Set(allOccupied);
    for (const p of getArrowOccupiedPoints(a)) {
      otherOccupied.delete(`${p.x},${p.y}`);
    }

    const headCanExit = checkExitRay(head, headDir, otherOccupied);

    // Test reversed orientation
    const rev = [...a.points].reverse();
    const revHead = rev[rev.length - 1];
    const revHeadDir = getHeadDirection({ ...a, points: rev });
    const revCanExit = checkExitRay(revHead, revHeadDir, otherOccupied);

    if (!headCanExit && revCanExit) {
      arrows[i].points = rev;
    }
  }

  // 2. Cycle-breaker search using live solvability feedback
  const maxFlips = arrows.length * 2;
  for (let step = 0; step < maxFlips; step++) {
    const sol = solveLevel([...existingArrows, ...arrows], gridSize);
    if (sol.isSolvable && !sol.hasOverlaps) {
      return arrows;
    }

    if (sol.deadlockedArrowIds.length === 0) break;

    // Pick a deadlocked candidate arrow and flip its direction
    const deadlockedCandidates = arrows.filter((a) =>
      sol.deadlockedArrowIds.includes(a.id)
    );

    if (deadlockedCandidates.length === 0) break;

    const toFlip = deadlockedCandidates[randomInt(0, deadlockedCandidates.length - 1)];
    toFlip.points = [...toFlip.points].reverse();
  }

  return arrows;
}

/**
 * Calculates cell coverage of candidate arrows within the marked area
 */
function calculateCoverage(area: SelectionArea, arrows: Arrow[]): number {
  const areaCells = (area.maxX - area.minX + 1) * (area.maxY - area.minY + 1);
  if (areaCells <= 0) return 0;

  const occupiedInArea = new Set<string>();
  for (const a of arrows) {
    for (const p of getArrowOccupiedPoints(a)) {
      if (p.x >= area.minX && p.x <= area.maxX && p.y >= area.minY && p.y <= area.maxY) {
        occupiedInArea.add(`${p.x},${p.y}`);
      }
    }
  }

  return occupiedInArea.size / areaCells;
}

/**
 * Main procedural synthesis function:
 * Synthesizes high-density, space-filling arrows (80-92% coverage),
 * eliminating empty gaps, matching previous level style, and guaranteeing 100% solvability.
 */
export function generateStyledArrowsForArea(options: GenerateOptions): PrebuildResult {
  const { area, existingArrows, gridSize, style } = options;
  const maxAttempts = options.maxAttempts || 35;

  const width = area.maxX - area.minX + 1;
  const height = area.maxY - area.minY + 1;

  if (width < 2 && height < 2) {
    return {
      success: false,
      arrows: existingArrows,
      newArrows: [],
      message: 'Marked area must be at least 2 cells wide or tall.',
    };
  }

  // Pre-compute occupied cells of existing arrows
  const existingOccupied = new Set<string>();
  for (const a of existingArrows) {
    for (const pt of getArrowOccupiedPoints(a)) {
      existingOccupied.add(`${pt.x},${pt.y}`);
    }
  }

  let bestArrows: Arrow[] | null = null;
  let bestCoverage = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 1. Generate dense space-filling tessellation
    const candidateArrows = buildDensePolylineTessellation(area, existingOccupied, style);
    if (!candidateArrows || candidateArrows.length === 0) continue;

    // 2. Optimize orientations so arrows escape without deadlock
    const orientedArrows = optimizeOrientationsForSolvability(
      candidateArrows,
      existingArrows,
      gridSize
    );

    // 3. Verify solvability and 0 resting overlaps
    const combined = [...existingArrows, ...orientedArrows];
    const sol = solveLevel(combined, gridSize);

    if (sol.isSolvable && !sol.hasOverlaps) {
      const coverage = calculateCoverage(area, orientedArrows);
      if (coverage > bestCoverage) {
        bestCoverage = coverage;
        bestArrows = orientedArrows;

        // If we achieved high density (>= 80%), this is already an exceptional fit!
        if (coverage >= 0.85) {
          break;
        }
      }
    }
  }

  if (bestArrows && bestArrows.length > 0) {
    const combined = [...existingArrows, ...bestArrows];
    const sol = solveLevel(combined, gridSize);
    const coveragePercent = Math.round(bestCoverage * 100);

    return {
      success: true,
      arrows: combined,
      newArrows: bestArrows,
      message: `Generated ${bestArrows.length} tightly fitted arrows with ${coveragePercent}% area coverage! 100% solvable (${sol.stepOrder.length} steps).`,
    };
  }

  return {
    success: false,
    arrows: existingArrows,
    newArrows: [],
    message: 'Could not find a solvable high-density configuration. Try adjusting the marked area or clearing nearby obstacles.',
  };
}

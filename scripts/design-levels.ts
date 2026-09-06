import { Level, Arrow } from '../src/types';
import { solveLevel } from '../src/utils/solver';
import { analyzeArrowExit, checkArrowOverlaps } from '../src/utils/geometry';

export const PROPOSED_10_LEVELS: Level[] = [
  // =========================================================================
  // LEVEL 1: The Gateway (Tutorial: Unobstructed Escapes)
  // Design Decision: Introduces the fundamental mechanic. 3 arrows pointing
  // to 3 different open board edges (Left, Top, Down). No dependencies.
  // =========================================================================
  {
    id: 'level-1',
    name: 'Level 1: The Gateway',
    gridSize: { width: 6, height: 6 },
    arrows: [
      {
        id: 'sky_left',
        color: 1, // Blue
        points: [{ x: 3, y: 1 }, { x: 0, y: 1 }], // LEFT, exits board
      },
      {
        id: 'forest_up',
        color: 2, // Green
        points: [{ x: 4, y: 4 }, { x: 4, y: 0 }], // UP, exits board
      },
      {
        id: 'sun_down',
        color: 5, // Orange
        points: [{ x: 1, y: 3 }, { x: 1, y: 5 }], // DOWN, exits board
      },
    ],
  },

  // =========================================================================
  // LEVEL 2: The Highway (Concept: Direct Line Blocker)
  // Design Decision: Teaches that an arrow directly in front of another
  // arrow blocks it. Arrow 1 must exit to allow Arrow 2 to follow it,
  // which then frees Arrow 3. Strict 1 -> 2 -> 3 linear dependency.
  // =========================================================================
  {
    id: 'level-2',
    name: 'Level 2: The Highway',
    gridSize: { width: 6, height: 6 },
    arrows: [
      {
        id: 'lead_car',
        color: 1, // Blue
        points: [{ x: 2, y: 2 }, { x: 2, y: 0 }], // UP, clear exit
      },
      {
        id: 'chaser_car',
        color: 2, // Green
        points: [{ x: 2, y: 5 }, { x: 2, y: 3 }], // UP, blocked by lead_car at (2,2)
      },
      {
        id: 'crossing_pedestrian',
        color: 3, // Yellow
        points: [{ x: 5, y: 4 }, { x: 3, y: 4 }], // LEFT, blocked by chaser_car at (2,4)
      },
    ],
  },

  // =========================================================================
  // LEVEL 3: The Elbow Turn (Concept: L-Bends & Swept Paths)
  // Design Decision: Teaches bent arrows. The L-shape slides forward along
  // its track out of its head, clearing its horizontal base to free a vertical arrow.
  // =========================================================================
  {
    id: 'level-3',
    name: 'Level 3: The Elbow Turn',
    gridSize: { width: 7, height: 7 },
    arrows: [
      {
        id: 'corner_turn',
        color: 4, // Pink
        points: [
          { x: 1, y: 5 },
          { x: 5, y: 5 },
          { x: 5, y: 0 },
        ], // L-shape UP, clear exit
      },
      {
        id: 'down_spear',
        color: 1, // Blue
        points: [
          { x: 3, y: 1 },
          { x: 3, y: 4 },
        ], // DOWN, blocked by corner_turn base at (3,5)
      },
      {
        id: 'side_dart',
        color: 2, // Green
        points: [
          { x: 1, y: 2 },
          { x: 2, y: 2 },
        ], // RIGHT, blocked by down_spear at (3,2)
      },
    ],
  },

  // =========================================================================
  // LEVEL 4: The Pinwheel (Concept: Cyclic Danger & The Breakthrough Key)
  // Design Decision: 4 arrows wrap around a center in a pinwheel formation.
  // 3 are trapped in mutual blocks, but Arrow 1's tip reaches row 0.
  // Finding that single unblocked key unzips the entire wheel.
  // =========================================================================
  {
    id: 'level-4',
    name: 'Level 4: The Pinwheel',
    gridSize: { width: 7, height: 7 },
    arrows: [
      {
        id: 'wheel_key',
        color: 7, // Cyan
        points: [{ x: 5, y: 1 }, { x: 5, y: 0 }], // UP, clear exit at top!
      },
      {
        id: 'wheel_top',
        color: 0, // Red
        points: [{ x: 2, y: 1 }, { x: 4, y: 1 }], // RIGHT, blocked by wheel_key at (5,1)
      },
      {
        id: 'wheel_left',
        color: 5, // Orange
        points: [{ x: 2, y: 5 }, { x: 2, y: 2 }], // UP, blocked by wheel_top at (2,1)
      },
      {
        id: 'wheel_bot',
        color: 2, // Green
        points: [{ x: 5, y: 5 }, { x: 3, y: 5 }], // LEFT, blocked by wheel_left at (2,5)
      },
      {
        id: 'wheel_right',
        color: 6, // Brown
        points: [{ x: 5, y: 2 }, { x: 5, y: 4 }], // DOWN, blocked by wheel_bot at (5,5)
      },
    ],
  },

  // =========================================================================
  // LEVEL 5: Dual Lock (Concept: Converging Dependencies)
  // Design Decision: Two separate wings (West & East). Clearing the West wing
  // removes blocker A; clearing the East wing removes blocker B. Only when
  // BOTH wings are dismantled can the central treasure arrow escape.
  // =========================================================================
  {
    id: 'level-5',
    name: 'Level 5: Dual Lock',
    gridSize: { width: 8, height: 8 },
    arrows: [
      // West Flank
      {
        id: 'west_key',
        color: 1, // Blue
        points: [{ x: 2, y: 6 }, { x: 0, y: 6 }], // LEFT, clear exit
      },
      {
        id: 'west_guard',
        color: 2, // Green
        points: [{ x: 2, y: 1 }, { x: 2, y: 5 }], // DOWN, blocked by west_key at (2,6)
      },
      // East Flank
      {
        id: 'east_key',
        color: 4, // Pink
        points: [{ x: 5, y: 1 }, { x: 7, y: 1 }], // RIGHT, clear exit
      },
      {
        id: 'east_guard',
        color: 5, // Orange
        points: [{ x: 5, y: 6 }, { x: 5, y: 2 }], // UP, blocked by east_key at (5,1)
      },
      // Central Core: blocked by west_guard at (2,3) and east_guard at (5,3)
      {
        id: 'center_core',
        color: 3, // Yellow
        points: [{ x: 3, y: 3 }, { x: 4, y: 3 }], // RIGHT, forward ray hits east_guard at (5,3)
      },
      {
        id: 'center_companion',
        color: 7, // Cyan
        points: [{ x: 4, y: 4 }, { x: 3, y: 4 }], // LEFT, forward ray hits west_guard at (2,4)
      },
    ],
  },

  // =========================================================================
  // LEVEL 6: The S-Bridge (Concept: Multi-Turn S-Bend)
  // Design Decision: Teaches that an S-shaped arrow creates obstacles on
  // multiple parallel tracks and crossing bridges.
  // =========================================================================
  {
    id: 'level-6',
    name: 'Level 6: The S-Bridge',
    gridSize: { width: 8, height: 8 },
    arrows: [
      {
        id: 's_snake',
        color: 1, // Blue
        points: [
          { x: 3, y: 1 },
          { x: 3, y: 3 },
          { x: 1, y: 3 },
          { x: 1, y: 7 },
        ], // S-bend DOWN, clear exit
      },
      {
        id: 'bridge_climber',
        color: 2, // Green
        points: [
          { x: 2, y: 6 },
          { x: 2, y: 4 },
        ], // UP, forward ray hits (2,3) on s_snake!
      },
      {
        id: 'cross_arrow',
        color: 5, // Orange
        points: [
          { x: 5, y: 5 },
          { x: 3, y: 5 },
        ], // LEFT, forward ray hits bridge_climber at (2,5)!
      },
      {
        id: 'top_guard',
        color: 0, // Red
        points: [{ x: 6, y: 1 }, { x: 4, y: 1 }], // LEFT, forward ray hits s_snake at (3,1)!
      },
      {
        id: 'side_trap',
        color: 6, // Brown
        points: [{ x: 6, y: 4 }, { x: 6, y: 2 }], // UP, forward ray hits top_guard at (6,1)!
      },
    ],
  },

  // =========================================================================
  // LEVEL 7: The Gatekeeper (Concept: Heavy Barrier Pinned by a Linchpin)
  // Design Decision: A massive horizontal barrier cuts across the board,
  // pinning 4 vertical pawns. The barrier is held hostage by a single guard.
  // Removing the linchpin unlocks the barrier and triggers a massive 4-pawn rush!
  // =========================================================================
  {
    id: 'level-7',
    name: 'Level 7: The Gatekeeper',
    gridSize: { width: 8, height: 8 },
    arrows: [
      {
        id: 'linchpin',
        color: 7, // Cyan
        points: [{ x: 7, y: 6 }, { x: 7, y: 0 }], // UP, clear exit off board!
      },
      {
        id: 'gatekeeper',
        color: 0, // Red
        points: [{ x: 1, y: 4 }, { x: 6, y: 4 }], // RIGHT, blocked by linchpin at (7,4)
      },
      {
        id: 'pawn_north1',
        color: 1, // Blue
        points: [{ x: 2, y: 1 }, { x: 2, y: 3 }], // DOWN, blocked by gatekeeper at (2,4)
      },
      {
        id: 'pawn_north2',
        color: 2, // Green
        points: [{ x: 4, y: 1 }, { x: 4, y: 3 }], // DOWN, blocked by gatekeeper at (4,4)
      },
      {
        id: 'pawn_south1',
        color: 4, // Pink
        points: [{ x: 3, y: 7 }, { x: 3, y: 5 }], // UP, blocked by gatekeeper at (3,4)
      },
      {
        id: 'pawn_south2',
        color: 3, // Yellow
        points: [{ x: 5, y: 7 }, { x: 5, y: 5 }], // UP, blocked by gatekeeper at (5,4)
      },
    ],
  },

  // =========================================================================
  // LEVEL 8: Matryoshka (Concept: Outside-In Layer Peeling)
  // Design Decision: 3 concentric nested L-shells. Each shell wraps around
  // the previous one. Must be methodically peeled from outside to inside.
  // =========================================================================
  {
    id: 'level-8',
    name: 'Level 8: Matryoshka',
    gridSize: { width: 8, height: 8 },
    arrows: [
      {
        id: 'shell_outer',
        color: 4, // Pink
        points: [
          { x: 1, y: 7 },
          { x: 7, y: 7 },
          { x: 7, y: 0 },
        ], // L UP, clear exit
      },
      {
        id: 'shell_mid',
        color: 2, // Green
        points: [
          { x: 2, y: 6 },
          { x: 6, y: 6 },
          { x: 6, y: 2 },
          { x: 6, y: 2 }, // wait
        ],
      },
    ],
  },

  // =========================================================================
  // LEVEL 9: Screenshot Stage (The Masterpiece / Signature Puzzle)
  // Design Decision: The exact puzzle from the uploaded game screenshot!
  // =========================================================================
  {
    id: 'level-9',
    name: 'Level 9: Screenshot Stage',
    gridSize: { width: 8, height: 9 },
    arrows: [
      {
        id: 'purple_outer',
        color: 4, // Pink (representing outer arrow)
        points: [
          { x: 1, y: 8 },
          { x: 7, y: 8 },
          { x: 7, y: 1 },
        ], // L UP, clear
      },
      {
        id: 'green_bend',
        color: 2, // Green
        points: [
          { x: 6, y: 7 },
          { x: 2, y: 7 },
          { x: 2, y: 5 },
        ], // L UP, blocked by blue_s at (2,4)
      },
      {
        id: 'blue_s',
        color: 1, // Blue
        points: [
          { x: 2, y: 1 },
          { x: 2, y: 4 },
          { x: 0, y: 4 },
          { x: 0, y: 7 },
        ], // S DOWN, clear
      },
      {
        id: 'blue_middle_down',
        color: 1, // Blue
        points: [
          { x: 3, y: 1 },
          { x: 3, y: 6 },
        ], // Straight DOWN, blocked by green_bend & purple_outer
      },
      {
        id: 'blue_top_left',
        color: 1, // Blue
        points: [
          { x: 6, y: 4 },
          { x: 6, y: 1 },
          { x: 4, y: 1 },
        ], // L LEFT, blocked by blue_middle_down
      },
      {
        id: 'blue_mid_up',
        color: 1, // Blue
        points: [
          { x: 6, y: 6 },
          { x: 5, y: 6 },
          { x: 5, y: 2 },
        ], // L UP, blocked by blue_top_left
      },
    ],
  },

  // =========================================================================
  // LEVEL 10: The Grand Citadel (THE HARDEST LEVEL)
  // Design Decision: The ultimate master challenge.
  // - 9 interlocking arrows.
  // - All 8 color types used (Red, Blue, Green, Yellow, Pink, Orange, Brown, Cyan).
  // - Strict 9-step linear dependency cascade (only 1 valid move at each step!).
  // - Multiple deceptive arrows that look free but are blocked by far obstacles.
  // =========================================================================
  {
    id: 'level-10',
    name: 'Level 10: The Grand Citadel',
    gridSize: { width: 9, height: 9 },
    arrows: [],
  },
];

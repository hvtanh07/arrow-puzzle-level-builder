import { Level } from '../src/types';
import { solveLevel } from '../src/utils/solver';
import { checkArrowOverlaps, analyzeArrowExit } from '../src/utils/geometry';

export const THE_10_DESIGNED_LEVELS: Level[] = [
  // =========================================================================
  // LEVEL 1: The Gateway (Tutorial: Unobstructed Escapes)
  // Design Decision: Teaches the core rule: arrows fly in the direction
  // of their tip and only escape if the path off-board is clear.
  // 3 arrows pointing to 3 open edges.
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
  // Design Decision: Teaches that an arrow directly ahead blocks the path.
  // Arrow 1 must exit to unblock Arrow 2, which then unblocks Arrow 3.
  // Strict 1 -> 2 -> 3 linear order of operations.
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
  // Design Decision: Teaches bent arrows. The L-shape slides forward out
  // of its head, vacating its entire base track and unblocking trapped spears.
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
  // LEVEL 4: The Pinwheel (Concept: Cyclic Danger & Breakthrough Key)
  // Design Decision: 4 arrows wrap in a pinwheel. Spotting the single arrow
  // whose tip reaches the perimeter unlocks the entire wheel.
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
  // LEVEL 5: Dual Lock (Concept: Independent Flanks & Convergence)
  // Design Decision: Two separate wings (West & East). Dismantling the West
  // wing clears Blocker A; dismantling the East wing clears Blocker B.
  // Both must be solved to free the central core arrows.
  // =========================================================================
  {
    id: 'level-5',
    name: 'Level 5: Dual Lock',
    gridSize: { width: 8, height: 8 },
    arrows: [
      // West Wing
      {
        id: 'west_key',
        color: 1, // Blue
        points: [{ x: 2, y: 6 }, { x: 0, y: 6 }], // LEFT, clear
      },
      {
        id: 'west_guard',
        color: 2, // Green
        points: [{ x: 2, y: 1 }, { x: 2, y: 5 }], // DOWN, blocked by west_key at (2,6)
      },
      // East Wing
      {
        id: 'east_key',
        color: 4, // Pink
        points: [{ x: 5, y: 1 }, { x: 7, y: 1 }], // RIGHT, clear
      },
      {
        id: 'east_guard',
        color: 5, // Orange
        points: [{ x: 5, y: 6 }, { x: 5, y: 2 }], // UP, blocked by east_key at (5,1)
      },
      // Central Core
      {
        id: 'center_east',
        color: 3, // Yellow
        points: [{ x: 3, y: 3 }, { x: 4, y: 3 }], // RIGHT, blocked by east_guard at (5,3)
      },
      {
        id: 'center_west',
        color: 7, // Cyan
        points: [{ x: 4, y: 4 }, { x: 3, y: 4 }], // LEFT, blocked by west_guard at (2,4)
      },
    ],
  },

  // =========================================================================
  // LEVEL 6: The S-Bridge (Concept: Multi-Turn S-Bends)
  // Design Decision: Teaches that an S-shaped arrow creates obstacles on
  // multiple parallel tracks and crossing bridges simultaneously.
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
        ], // UP, forward ray hits (2,3) on s_snake
      },
      {
        id: 'cross_arrow',
        color: 5, // Orange
        points: [
          { x: 5, y: 5 },
          { x: 3, y: 5 },
        ], // LEFT, forward ray hits bridge_climber at (2,5)
      },
      {
        id: 'top_guard',
        color: 0, // Red
        points: [{ x: 6, y: 1 }, { x: 4, y: 1 }], // LEFT, forward ray hits s_snake at (3,1)
      },
      {
        id: 'side_trap',
        color: 6, // Brown
        points: [{ x: 6, y: 4 }, { x: 6, y: 2 }], // UP, forward ray hits top_guard at (6,1)
      },
    ],
  },

  // =========================================================================
  // LEVEL 7: The Gatekeeper (Concept: Heavy Barrier Pinned by a Linchpin)
  // Design Decision: A massive barrier cuts across the board, pinning 4
  // vertical pawns. The barrier is held by a single perimeter guard.
  // Removing the linchpin unlocks the barrier and triggers a 4-pawn rush!
  // =========================================================================
  {
    id: 'level-7',
    name: 'Level 7: The Gatekeeper',
    gridSize: { width: 8, height: 8 },
    arrows: [
      {
        id: 'linchpin',
        color: 7, // Cyan
        points: [{ x: 7, y: 6 }, { x: 7, y: 0 }], // UP, clear exit
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
  // LEVEL 8: Matryoshka (Concept: Outside-In Concentric Peeling)
  // Design Decision: 3 concentric nested L-shells. You must peel each outer
  // shell to create room for the inner shell to slide out.
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
          { x: 7, y: 1 },
          { x: 0, y: 1 },
        ], // LEFT, exits at (0,1)
      },
      {
        id: 'shell_mid',
        color: 2, // Green
        points: [
          { x: 2, y: 6 },
          { x: 6, y: 6 },
          { x: 6, y: 2 },
          { x: 4, y: 2 },
        ], // LEFT, blocked by west_guard at (1,2)
      },
      {
        id: 'shell_inner',
        color: 1, // Blue
        points: [
          { x: 3, y: 5 },
          { x: 5, y: 5 },
          { x: 5, y: 3 },
        ], // UP, blocked by shell_mid at (5,2)
      },
      {
        id: 'core_pin',
        color: 5, // Orange
        points: [
          { x: 4, y: 3 },
          { x: 4, y: 4 },
        ], // DOWN, blocked by all 3 shells!
      },
      {
        id: 'west_guard',
        color: 3, // Yellow
        points: [{ x: 1, y: 2 }, { x: 1, y: 5 }], // DOWN, blocked by shell_outer at (1,7)
      },
      {
        id: 'west_intercept',
        color: 6, // Brown
        points: [{ x: 0, y: 5 }, { x: 0, y: 3 }], // UP, blocked by shell_outer at (0,1)
      },
    ],
  },

  // =========================================================================
  // LEVEL 9: Screenshot Stage (The Masterpiece / Signature Puzzle)
  // Design Decision: Exact 1:1 recreation of the uploaded game screenshot!
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
  // - 9 interlocking arrows spanning all 8 colors.
  // - Strict 9-step linear dependency cascade (branching factor [1,1,1,1,1,1,1,1,1]).
  // - At every step, exactly ONE move is valid, requiring deep spatial foresight.
  // =========================================================================
  {
    id: 'level-10',
    name: 'Level 10: The Grand Citadel',
    gridSize: { width: 9, height: 9 },
    arrows: [
      // 1. A1 (Cyan = 7): Scout on the Right Edge
      {
        id: 'a1_scout',
        color: 7, // Cyan
        points: [{ x: 8, y: 3 }, { x: 8, y: 0 }], // UP, clear exit off board
      },
      // 2. A2 (Blue = 1): High Bridge
      {
        id: 'a2_bridge',
        color: 1, // Blue
        points: [{ x: 5, y: 1 }, { x: 7, y: 1 }], // RIGHT, blocked by A1 at (8,1)
      },
      // 3. A3 (Green = 2): East Column
      {
        id: 'a3_column',
        color: 2, // Green
        points: [{ x: 6, y: 4 }, { x: 6, y: 2 }], // UP, blocked by A2 at (6,1)
      },
      // 4. A4 (Red = 0): Mid Spear
      {
        id: 'a4_spear',
        color: 0, // Red
        points: [{ x: 3, y: 3 }, { x: 5, y: 3 }], // RIGHT, blocked by A3 at (6,3)
      },
      // 5. A5 (Orange = 5): Center Tower
      {
        id: 'a5_tower',
        color: 5, // Orange
        points: [{ x: 4, y: 6 }, { x: 4, y: 4 }], // UP, blocked by A4 at (4,3)
      },
      // 6. A6 (Pink = 4): West Cross
      {
        id: 'a6_cross',
        color: 4, // Pink
        points: [{ x: 1, y: 5 }, { x: 3, y: 5 }], // RIGHT, blocked by A5 at (4,5)
      },
      // 7. A7 (Brown = 6): Deep Pillar
      {
        id: 'a7_pillar',
        color: 6, // Brown
        points: [{ x: 2, y: 8 }, { x: 2, y: 6 }], // UP, blocked by A6 at (2,5)
      },
      // 8. A8 (Yellow = 3): Low Gate
      {
        id: 'a8_gate',
        color: 3, // Yellow
        points: [{ x: 0, y: 7 }, { x: 1, y: 7 }], // RIGHT, blocked by A7 at (2,7)
      },
      // 9. A9 (Blue = 1): Citadel Monarch
      {
        id: 'a9_monarch',
        color: 1, // Blue
        points: [{ x: 0, y: 4 }, { x: 0, y: 6 }], // DOWN, blocked by A8 at (0,7)
      },
    ],
  },
];

console.log('=== VERIFYING ALL 10 INTENTIONALLY DESIGNED LEVELS ===\n');

let allPassed = true;
for (const level of THE_10_DESIGNED_LEVELS) {
  const overlap = checkArrowOverlaps(level.arrows);
  const sol = solveLevel(level.arrows, level.gridSize);

  let remaining = [...level.arrows];
  const branchHistory: number[] = [];
  while (remaining.length > 0) {
    const free = remaining.filter((a) => !analyzeArrowExit(a, remaining, level.gridSize).isBlocked);
    branchHistory.push(free.length);
    if (free.length === 0) break;
    const chosen = free[0];
    remaining = remaining.filter((a) => a.id !== chosen.id);
  }

  if (!sol.isSolvable || overlap.hasOverlaps) {
    console.error(`❌ ${level.name} FAILED!`);
    if (overlap.hasOverlaps) console.error('  Overlaps:', overlap.overlaps);
    if (!sol.isSolvable) console.error('  Solvability:', sol.message);
    allPassed = false;
  } else {
    console.log(`✅ ${level.name}`);
    console.log(`   Arrows: ${level.arrows.length} | Steps: ${sol.stepOrder.length} | Branching: [${branchHistory.join(', ')}]`);
    console.log(`   Order: ${sol.stepOrder.join(' -> ')}`);
  }
}

if (allPassed) {
  console.log('\n🎉 ALL 10 LEVELS ARE VERIFIED 100% SOLVABLE WITH ZERO OVERLAPS!');
} else {
  process.exit(1);
}

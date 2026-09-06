import { solveLevel } from '../src/utils/solver';
import { checkArrowOverlaps, analyzeArrowExit } from '../src/utils/geometry';
import { Arrow, Level } from '../src/types';

export const THE_10_LEVELS_V3: Level[] = [
  // =========================================================================
  // LEVEL 1: The First Chain (Grid 6x6)
  // Concept: 3 arrows locked to each other so player understands that each
  // arrow must be removed one by one. Strict [1, 1, 1] branching.
  // =========================================================================
  {
    id: 'level-1',
    name: 'Level 1: The First Chain',
    gridSize: { width: 6, height: 6 },
    arrows: [
      { id: 'lead', color: 1, points: [{ x: 2, y: 2 }, { x: 2, y: 0 }] }, // Blue = 1: UP, clear exit
      { id: 'chaser', color: 2, points: [{ x: 2, y: 5 }, { x: 2, y: 3 }] }, // Green = 2: UP, blocked by lead
      { id: 'flank', color: 5, points: [{ x: 5, y: 4 }, { x: 3, y: 4 }] }, // Orange = 5: LEFT, blocked by chaser
    ],
  },

  // =========================================================================
  // LEVEL 2: The Winding Hook (Grid 7x7)
  // Concept: Locked variation with a long 2-turn hook arrow wrapping around
  // a center dart and base dart.
  // =========================================================================
  {
    id: 'level-2',
    name: 'Level 2: The Winding Hook',
    gridSize: { width: 7, height: 7 },
    arrows: [
      { id: 'key', color: 7, points: [{ x: 1, y: 3 }, { x: 1, y: 0 }] }, // Cyan = 7: UP, clear exit
      { id: 'hook', color: 4, points: [{ x: 5, y: 5 }, { x: 5, y: 2 }, { x: 2, y: 2 }] }, // Pink = 4 (2 turns): LEFT, blocked by key
      { id: 'center_dart', color: 2, points: [{ x: 3, y: 5 }, { x: 3, y: 3 }] }, // Green = 2: UP, blocked by hook
      { id: 'base_dart', color: 5, points: [{ x: 0, y: 4 }, { x: 2, y: 4 }] }, // Orange = 5: RIGHT, blocked by center_dart
    ],
  },

  // =========================================================================
  // LEVEL 3: The Serpentine Knot (Grid 7x7)
  // Concept: Locked variation featuring a long S-serpent with 3 turns
  // weaving across rows 1, 3 and cols 2, 4.
  // =========================================================================
  {
    id: 'level-3',
    name: 'Level 3: The Serpentine Knot',
    gridSize: { width: 7, height: 7 },
    arrows: [
      { id: 'key', color: 5, points: [{ x: 1, y: 6 }, { x: 6, y: 6 }] }, // Orange = 5: RIGHT, clear exit
      { id: 's_snake', color: 1, points: [{ x: 1, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 5 }] }, // Blue = 1 (3 turns): DOWN, blocked by key
      { id: 'dart_north', color: 2, points: [{ x: 3, y: 5 }, { x: 3, y: 4 }] }, // Green = 2: UP, blocked by s_snake
      { id: 'spear_east', color: 3, points: [{ x: 6, y: 2 }, { x: 5, y: 2 }] }, // Yellow = 3: LEFT, blocked by s_snake
      { id: 'pin_west', color: 4, points: [{ x: 0, y: 4 }, { x: 1, y: 4 }] }, // Pink = 4: RIGHT, blocked by s_snake
    ],
  },

  // =========================================================================
  // LEVEL 4: The Double Winding (Grid 8x8)
  // Concept: Two multi-turn winding arrows (outer hook + inner S-bend)
  // interlocking with peripheral darts.
  // =========================================================================
  {
    id: 'level-4',
    name: 'Level 4: The Double Winding',
    gridSize: { width: 8, height: 8 },
    arrows: [
      { id: 'key', color: 7, points: [{ x: 6, y: 4 }, { x: 6, y: 0 }] }, // Cyan = 7: UP, clear exit
      { id: 'outer_hook', color: 4, points: [{ x: 2, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 2 }, { x: 5, y: 2 }] }, // Pink = 4 (2 turns): RIGHT, blocked by key
      { id: 'inner_s', color: 1, points: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 4 }] }, // Blue = 1 (2 turns): DOWN, blocked by outer_hook
      { id: 'dart_west', color: 2, points: [{ x: 0, y: 3 }, { x: 1, y: 3 }] }, // Green = 2: RIGHT, blocked by inner_s
      { id: 'south_dart', color: 5, points: [{ x: 5, y: 5 }, { x: 5, y: 3 }] }, // Orange = 5: UP, blocked by outer_hook
    ],
  },

  // =========================================================================
  // LEVEL 5: The Coiled Labyrinth (Grid 8x8)
  // Concept: Two large 3-turn serpentine arrows wrapping around each other
  // in an intricate double labyrinth with 4 interlocked pins.
  // =========================================================================
  {
    id: 'level-5',
    name: 'Level 5: The Coiled Labyrinth',
    gridSize: { width: 8, height: 8 },
    arrows: [
      { id: 'key_guard', color: 7, points: [{ x: 7, y: 3 }, { x: 7, y: 0 }] }, // Cyan = 7: UP, clear exit
      { id: 'serpent_a', color: 4, points: [{ x: 1, y: 7 }, { x: 1, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 1 }, { x: 6, y: 1 }] }, // Pink = 4 (3 turns): RIGHT, blocked by key_guard
      { id: 'serpent_b', color: 1, points: [{ x: 6, y: 6 }, { x: 3, y: 6 }, { x: 3, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 2 }] }, // Blue = 1 (3 turns): UP, blocked by serpent_a
      { id: 'pin_west', color: 2, points: [{ x: 0, y: 2 }, { x: 2, y: 2 }] }, // Green = 2: RIGHT, blocked by serpent_a
      { id: 'pin_south', color: 5, points: [{ x: 2, y: 7 }, { x: 2, y: 5 }] }, // Orange = 5: UP, blocked by serpent_b
      { id: 'east_dart', color: 6, points: [{ x: 7, y: 5 }, { x: 6, y: 5 }] }, // Brown = 6: LEFT, blocked by serpent_b
    ],
  },

  // =========================================================================
  // LEVEL 6: Tangled Noise (Grid 8x8)
  // Concept: Genuine visual and structural noise composed of 6 winding
  // multi-bend arrows (S-hooks, U-turns, zigzags, meanders) intertwined.
  // =========================================================================
  {
    id: 'level-6',
    name: 'Level 6: Tangled Noise',
    gridSize: { width: 8, height: 8 },
    arrows: [
      // Key S-Hook (Cyan = 7, 3 turns): Exits UP at (2,0)
      { id: 'a1_key', color: 7, points: [{ x: 0, y: 5 }, { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 0 }] },
      // Hook Top (Red = 0, 2 turns): (7,2) -> (4,2) -> (4,1) -> (3,1). Points LEFT into a1_key
      { id: 'a2_top_hook', color: 0, points: [{ x: 7, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 3, y: 1 }] },
      // U-West (Blue = 1, 2 turns): (1,6) -> (1,3) -> (3,3) -> (3,2). Points UP into a2_top_hook
      { id: 'a3_west_u', color: 1, points: [{ x: 1, y: 6 }, { x: 1, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }] },
      // Center S (Green = 2, 3 turns): (7,5) -> (5,5) -> (5,4) -> (6,4) -> (6,3). Points UP into a2_top_hook
      { id: 'a4_center_s', color: 2, points: [{ x: 7, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 3 }] },
      // Mid Zigzag (Yellow = 3, 3 turns): (2,7) -> (2,5) -> (4,5) -> (4,4) -> (3,4). Points LEFT into a3_west_u
      { id: 'a5_mid_zigzag', color: 3, points: [{ x: 2, y: 7 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 4 }, { x: 3, y: 4 }] },
      // Base Meander (Orange = 5, 2 turns): (6,7) -> (6,6) -> (5,6) -> (3,6). Points LEFT into a5_mid_zigzag
      { id: 'a6_base_meander', color: 5, points: [{ x: 6, y: 7 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 3, y: 6 }] },
    ],
  },

  // =========================================================================
  // LEVEL 7: The Domino Spiral (Grid 8x8)
  // Concept: A satisfying interlocking puzzle box sequence of nested L-hooks
  // and elbows where each arrow unblocks the next in a rhythmic cascade.
  // =========================================================================
  {
    id: 'level-7',
    name: 'Level 7: The Domino Spiral',
    gridSize: { width: 8, height: 8 },
    arrows: [
      // 0. Outer Frame (Cyan = 7): L-hook from (0,7) -> (7,7) -> (7,0). Points UP, exits off top
      { id: 'a0_frame', color: 7, points: [{ x: 0, y: 7 }, { x: 7, y: 7 }, { x: 7, y: 0 }] },
      // 1. Hook 1 (Red = 0): L-hook (2,5) -> (5,5) -> (6,5). Points RIGHT, blocked by a0_frame
      { id: 'a1_hook1', color: 0, points: [{ x: 2, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }] },
      // 2. Hook 2 (Blue = 1): L-hook (6,1) -> (5,1) -> (5,4). Points DOWN, blocked by a1_hook1
      { id: 'a2_hook2', color: 1, points: [{ x: 6, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 4 }] },
      // 3. Hook 3 (Green = 2): L-hook (1,6) -> (1,3) -> (4,3). Points RIGHT, blocked by a2_hook2
      { id: 'a3_hook3', color: 2, points: [{ x: 1, y: 6 }, { x: 1, y: 3 }, { x: 4, y: 3 }] },
      // 4. Hook 4 (Yellow = 3): L-hook (4,0) -> (3,0) -> (3,2). Points DOWN, blocked by a3_hook3
      { id: 'a4_hook4', color: 3, points: [{ x: 4, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 2 }] },
      // 5. Hook 5 (Pink = 4): (0,2) -> (2,2). Points RIGHT, blocked by a4_hook4
      { id: 'a5_hook5', color: 4, points: [{ x: 0, y: 2 }, { x: 2, y: 2 }] },
      // 6. Hook 6 (Orange = 5): (2,0) -> (2,1). Points DOWN into a5_hook5
      { id: 'a6_hook6', color: 5, points: [{ x: 2, y: 0 }, { x: 2, y: 1 }] },
    ],
  },

  // =========================================================================
  // LEVEL 8: The Dual Zipper (Grid 8x8)
  // Concept: Alternating zipper teeth that unravel in a deeply satisfying
  // chain reaction once the top pull is cleared.
  // =========================================================================
  {
    id: 'level-8',
    name: 'Level 8: The Dual Zipper',
    gridSize: { width: 8, height: 8 },
    arrows: [
      { id: 'pull', color: 7, points: [{ x: 4, y: 1 }, { x: 4, y: 0 }] }, // Cyan = 7: UP, clear exit
      { id: 'l1', color: 1, points: [{ x: 1, y: 1 }, { x: 3, y: 1 }] }, // Blue = 1: RIGHT, blocked by pull
      { id: 'r1', color: 2, points: [{ x: 3, y: 3 }, { x: 3, y: 2 }] }, // Green = 2: UP, blocked by l1
      { id: 'l2', color: 3, points: [{ x: 1, y: 3 }, { x: 2, y: 3 }] }, // Yellow = 3: RIGHT, blocked by r1
      { id: 'r2', color: 4, points: [{ x: 2, y: 5 }, { x: 2, y: 4 }] }, // Pink = 4: UP, blocked by l2
      { id: 'l3', color: 5, points: [{ x: 0, y: 5 }, { x: 1, y: 5 }] }, // Orange = 5: RIGHT, blocked by r2
      { id: 'r3', color: 6, points: [{ x: 1, y: 7 }, { x: 1, y: 6 }] }, // Brown = 6: UP, blocked by l3
      { id: 'anchor', color: 0, points: [{ x: 0, y: 6 }, { x: 0, y: 7 }] }, // Red = 0: DOWN, clear exit
    ],
  },

  // =========================================================================
  // LEVEL 9: The Gentle Breeze (Grid 6x6)
  // Concept: An easy, relaxing breather level before the final challenge.
  // Clean open board with simple, satisfying unblocked escapes.
  // =========================================================================
  {
    id: 'level-9',
    name: 'Level 9: The Gentle Breeze',
    gridSize: { width: 6, height: 6 },
    arrows: [
      { id: 'breeze_1', color: 1, points: [{ x: 1, y: 1 }, { x: 1, y: 4 }] }, // Blue = 1: DOWN, clear exit
      { id: 'breeze_2', color: 2, points: [{ x: 4, y: 4 }, { x: 4, y: 1 }] }, // Green = 2: UP, clear exit
      { id: 'breeze_3', color: 4, points: [{ x: 2, y: 5 }, { x: 5, y: 5 }] }, // Pink = 4: RIGHT, clear exit
      { id: 'breeze_4', color: 3, points: [{ x: 3, y: 0 }, { x: 0, y: 0 }] }, // Yellow = 3: LEFT, clear exit
    ],
  },

  // =========================================================================
  // LEVEL 10: The Master Labyrinth (Grid 10x14 - 15 Multi-Turn Interlocking Arrows)
  // Concept: Achieving at least 2/3 of the uploaded game screenshot!
  // A sprawling 10x14 grid tightly packed with 15 multi-turn winding arrows
  // (S-bends, U-turns, zigzags, stair-steps, and meanders) spanning all 8 colors.
  // =========================================================================
  {
    id: 'level-10',
    name: 'Level 10: The Master Labyrinth',
    gridSize: { width: 10, height: 14 },
    arrows: [
      // 0. Key Scout (Cyan = 7, 3 turns): Exits UP at (3,0)
      { id: 'a00_scout', color: 7, points: [{ x: 1, y: 3 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 0 }] },
      // 1. Top Crown (Yellow = 3, 3 turns): Points LEFT into (3,1) on a00_scout. Exits row 1
      { id: 'a01_crown', color: 3, points: [{ x: 9, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 4, y: 1 }] },
      // 2. Top-Left Hook (Orange = 5, 2 turns): Exits UP at (0,0)
      { id: 'a02_tl_hook', color: 5, points: [{ x: 0, y: 4 }, { x: 0, y: 0 }] },
      // 3. North-East Serpent (Blue = 1, 3 turns): Points LEFT into (5,1) on a01_crown
      { id: 'a03_ne_serpent', color: 1, points: [{ x: 9, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 1 }, { x: 6, y: 1 }] },
      // 4. Upper Green Stair (Green = 2, 3 turns): Points LEFT into (0,2) on a02_tl_hook
      { id: 'a04_upper_stair', color: 2, points: [{ x: 2, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 2 }, { x: 2, y: 2 }] },
      // 5. East Pink U-turn (Pink = 4, 3 turns): Points UP, blocked by a01_crown
      { id: 'a05_east_u', color: 4, points: [{ x: 7, y: 4 }, { x: 9, y: 4 }, { x: 9, y: 3 }] },
      // 6. Center Bridge (Brown = 6, 2 turns): Points LEFT into (3,3) on a04_upper_stair
      { id: 'a06_mid_bridge', color: 6, points: [{ x: 5, y: 5 }, { x: 5, y: 3 }, { x: 4, y: 3 }] },
      // 7. West Flank Snake (Red = 0, 3 turns): Points DOWN into (2,13) on a13_bl_hook
      { id: 'a07_west_flank', color: 0, points: [{ x: 0, y: 8 }, { x: 0, y: 5 }, { x: 2, y: 5 }, { x: 2, y: 6 }] },
      // 8. Mid Horizontal Sweep (Blue = 1, 3 turns): Points RIGHT into (9,5) on a05_east_u
      { id: 'a08_mid_sweep', color: 1, points: [{ x: 1, y: 7 }, { x: 6, y: 7 }, { x: 6, y: 5 }, { x: 7, y: 5 }] },
      // 9. Central Cross (Green = 2, 2 turns): Points RIGHT into (6,6) on a08_mid_sweep
      { id: 'a09_cross', color: 2, points: [{ x: 3, y: 6 }, { x: 5, y: 6 }] },
      // 10. Lower Yellow Frame (Yellow = 3, 3 turns): Points UP into (8,2) on a03_ne_serpent
      { id: 'a10_yellow_frame', color: 3, points: [{ x: 1, y: 10 }, { x: 1, y: 12 }, { x: 8, y: 12 }, { x: 8, y: 10 }] },
      // 11. Inner Cyan Hook (Cyan = 7, 3 turns): Points LEFT into col 1 on a10_yellow_frame
      { id: 'a11_inner_cyan', color: 7, points: [{ x: 3, y: 11 }, { x: 6, y: 11 }, { x: 6, y: 9 }, { x: 5, y: 9 }] },
      // 12. Deep Orange Snake (Orange = 5, 2 turns): Points RIGHT off board at row 8
      { id: 'a12_deep_snake', color: 5, points: [{ x: 7, y: 10 }, { x: 7, y: 8 }, { x: 9, y: 8 }] },
      // 13. Bottom-Left Hook (Pink = 4, 2 turns): Points RIGHT into (5,13) on a14_br_runner
      { id: 'a13_bl_hook', color: 4, points: [{ x: 0, y: 10 }, { x: 0, y: 13 }, { x: 3, y: 13 }] },
      // 14. Bottom-Right Runner (Brown = 6): (5, 13) -> (9, 13). Points RIGHT, clear exit off right edge
      { id: 'a14_br_runner', color: 6, points: [{ x: 5, y: 13 }, { x: 9, y: 13 }] },
    ],
  },
];

console.log('=== VERIFYING ALL 10 LEVELS (VERSION 3) ===\n');
let allOk = true;
for (const lvl of THE_10_LEVELS_V3) {
  const overlap = checkArrowOverlaps(lvl.arrows);
  const sol = solveLevel(lvl.arrows, lvl.gridSize);
  let remaining = [...lvl.arrows];
  const branch: number[] = [];
  while (remaining.length > 0) {
    const free = remaining.filter(a => !analyzeArrowExit(a, remaining, lvl.gridSize).isBlocked);
    branch.push(free.length);
    if (free.length === 0) break;
    remaining = remaining.filter(a => a.id !== free[0].id);
  }

  if (overlap.hasOverlaps || !sol.isSolvable) {
    allOk = false;
    console.error('? ' + lvl.name + ' FAILED:');
    if (overlap.hasOverlaps) console.error('  Overlaps:', overlap.overlaps);
    if (!sol.isSolvable) console.error('  Solvability:', sol.message);
  } else {
    console.log('? ' + lvl.name);
    console.log('   Grid: ' + lvl.gridSize.width + 'x' + lvl.gridSize.height + ' | Arrows: ' + lvl.arrows.length + ' | Steps: ' + sol.stepOrder.length);
    console.log('   Branching: [' + branch.join(', ') + ']');
    console.log('   Order: ' + sol.stepOrder.join(' -> '));
  }
}

if (allOk) {
  console.log('\n?? ALL 10 LEVELS PASS WITH ZERO OVERLAPS AND 100% SOLVABILITY!');
} else {
  process.exit(1);
}

import { solveLevel } from '../src/utils/solver';
import { checkArrowOverlaps, analyzeArrowExit } from '../src/utils/geometry';
import { Arrow, Level } from '../src/types';

export const ALL_10_LEVELS: Level[] = [
  // =========================================================================
  // LEVEL 1: The First Chain (Grid 6x6)
  // Design: 3 arrows locked to each other so player understands that each
  // arrow must be removed one by one. Strict [1, 1, 1] branching.
  // =========================================================================
  {
    id: 'level-1',
    name: 'Level 1: The First Chain',
    gridSize: { width: 6, height: 6 },
    arrows: [
      { id: 'lead', color: 1, points: [{ x: 2, y: 2 }, { x: 2, y: 0 }] }, // Blue = 1: UP, clear exit off board
      { id: 'chaser', color: 2, points: [{ x: 2, y: 5 }, { x: 2, y: 3 }] }, // Green = 2: UP, blocked by lead at (2,2)
      { id: 'flank', color: 5, points: [{ x: 5, y: 4 }, { x: 3, y: 4 }] }, // Orange = 5: LEFT, blocked by chaser at (2,4)
    ],
  },

  // =========================================================================
  // LEVEL 2: The Winding Hook (Grid 7x7)
  // Design: Locked variation with a long 2-turn hook arrow wrapping around
  // a center dart and base dart.
  // =========================================================================
  {
    id: 'level-2',
    name: 'Level 2: The Winding Hook',
    gridSize: { width: 7, height: 7 },
    arrows: [
      { id: 'key', color: 7, points: [{ x: 1, y: 3 }, { x: 1, y: 0 }] }, // Cyan = 7: UP, clear exit
      { id: 'hook', color: 4, points: [{ x: 5, y: 5 }, { x: 5, y: 2 }, { x: 2, y: 2 }] }, // Pink = 4 (2 turns): LEFT, blocked by key at (1,2)
      { id: 'center_dart', color: 2, points: [{ x: 3, y: 5 }, { x: 3, y: 3 }] }, // Green = 2: UP, blocked by hook at (3,2)
      { id: 'base_dart', color: 5, points: [{ x: 0, y: 4 }, { x: 2, y: 4 }] }, // Orange = 5: RIGHT, blocked by center_dart at (3,4)
    ],
  },

  // =========================================================================
  // LEVEL 3: The Serpentine Knot (Grid 7x7)
  // Design: Locked variation featuring a long S-serpent with 3 turns
  // weaving across rows 1, 3 and cols 2, 4.
  // =========================================================================
  {
    id: 'level-3',
    name: 'Level 3: The Serpentine Knot',
    gridSize: { width: 7, height: 7 },
    arrows: [
      { id: 'key', color: 5, points: [{ x: 1, y: 6 }, { x: 6, y: 6 }] }, // Orange = 5: RIGHT, clear exit
      { id: 's_snake', color: 1, points: [{ x: 1, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 5 }] }, // Blue = 1 (3 turns): DOWN, blocked by key at (2,6)
      { id: 'dart_north', color: 2, points: [{ x: 3, y: 5 }, { x: 3, y: 4 }] }, // Green = 2: UP, blocked by s_snake at (3,3)
      { id: 'spear_east', color: 3, points: [{ x: 6, y: 2 }, { x: 5, y: 2 }] }, // Yellow = 3: LEFT, blocked by s_snake at (4,2)
      { id: 'pin_west', color: 4, points: [{ x: 0, y: 4 }, { x: 1, y: 4 }] }, // Pink = 4: RIGHT, blocked by s_snake at (2,4)
    ],
  },

  // =========================================================================
  // LEVEL 4: The Double Winding (Grid 8x8)
  // Design: Two multi-turn winding arrows (outer hook + inner S-bend)
  // interlocking with peripheral darts.
  // =========================================================================
  {
    id: 'level-4',
    name: 'Level 4: The Double Winding',
    gridSize: { width: 8, height: 8 },
    arrows: [
      { id: 'key', color: 7, points: [{ x: 6, y: 4 }, { x: 6, y: 0 }] }, // Cyan = 7: UP, clear exit
      { id: 'outer_hook', color: 4, points: [{ x: 2, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 2 }, { x: 5, y: 2 }] }, // Pink = 4 (2 turns): RIGHT, blocked by key at (6,2)
      { id: 'inner_s', color: 1, points: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 4 }] }, // Blue = 1 (2 turns): DOWN, blocked by outer_hook at (2,6)
      { id: 'dart_west', color: 2, points: [{ x: 0, y: 3 }, { x: 1, y: 3 }] }, // Green = 2: RIGHT, blocked by inner_s at (2,3)
      { id: 'south_dart', color: 5, points: [{ x: 5, y: 5 }, { x: 5, y: 3 }] }, // Orange = 5: UP, blocked by outer_hook at (5,2)
    ],
  },

  // =========================================================================
  // LEVEL 5: The Coiled Labyrinth (Grid 8x8)
  // Design: Two large 3-turn serpentine arrows wrapping around each other
  // in an intricate double labyrinth with 4 interlocked pins.
  // =========================================================================
  {
    id: 'level-5',
    name: 'Level 5: The Coiled Labyrinth',
    gridSize: { width: 8, height: 8 },
    arrows: [
      { id: 'key_guard', color: 7, points: [{ x: 7, y: 3 }, { x: 7, y: 0 }] }, // Cyan = 7: UP, clear exit
      { id: 'serpent_a', color: 4, points: [{ x: 1, y: 7 }, { x: 1, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 1 }, { x: 6, y: 1 }] }, // Pink = 4 (3 turns): RIGHT, blocked by key_guard at (7,1)
      { id: 'serpent_b', color: 1, points: [{ x: 6, y: 6 }, { x: 3, y: 6 }, { x: 3, y: 4 }, { x: 5, y: 4 }, { x: 5, y: 2 }] }, // Blue = 1 (3 turns): UP, blocked by serpent_a at (5,1)
      { id: 'pin_west', color: 2, points: [{ x: 0, y: 2 }, { x: 2, y: 2 }] }, // Green = 2: RIGHT, blocked by serpent_a at (4,2)
      { id: 'pin_south', color: 5, points: [{ x: 2, y: 7 }, { x: 2, y: 5 }] }, // Orange = 5: UP, blocked by serpent_b at (3,6)
      { id: 'east_dart', color: 6, points: [{ x: 7, y: 5 }, { x: 6, y: 5 }] }, // Brown = 6: LEFT, blocked by serpent_b at (5,5)
    ],
  },

  // =========================================================================
  // LEVEL 6: Tangled Noise (Grid 8x8)
  // Design: Dense, criss-crossing arrows layered across alternating rows & cols,
  // creating visual clutter/noise with a single subtle key at the edge.
  // =========================================================================
  {
    id: 'level-6',
    name: 'Level 6: Tangled Noise',
    gridSize: { width: 8, height: 8 },
    arrows: [
      { id: 'noise_key', color: 7, points: [{ x: 0, y: 3 }, { x: 0, y: 0 }] }, // Cyan = 7: UP, clear exit
      { id: 'tangle_1', color: 0, points: [{ x: 5, y: 1 }, { x: 1, y: 1 }] }, // Red = 0: LEFT, blocked by noise_key at (0,1)
      { id: 'tangle_2', color: 1, points: [{ x: 2, y: 6 }, { x: 2, y: 2 }] }, // Blue = 1: UP, blocked by tangle_1 at (2,1)
      { id: 'tangle_3', color: 2, points: [{ x: 6, y: 3 }, { x: 3, y: 3 }] }, // Green = 2: LEFT, blocked by tangle_2 at (2,3)
      { id: 'tangle_4', color: 3, points: [{ x: 4, y: 7 }, { x: 4, y: 4 }] }, // Yellow = 3: UP, blocked by tangle_3 at (4,3)
      { id: 'tangle_5', color: 5, points: [{ x: 7, y: 5 }, { x: 5, y: 5 }] }, // Orange = 5: LEFT, blocked by tangle_4 at (4,5)
      { id: 'tangle_6', color: 4, points: [{ x: 6, y: 7 }, { x: 6, y: 6 }] }, // Pink = 4: UP, blocked by tangle_5 at (6,5)
    ],
  },

  // =========================================================================
  // LEVEL 7: The Domino Run (Grid 8x8)
  // Design: A satisfying diagonal staircase cascade where each arrow unblocks
  // the next in a rhythmic domino chain.
  // =========================================================================
  {
    id: 'level-7',
    name: 'Level 7: The Domino Run',
    gridSize: { width: 8, height: 8 },
    arrows: [
      { id: 'd1', color: 0, points: [{ x: 6, y: 1 }, { x: 7, y: 1 }] }, // Red = 0: RIGHT, clear exit off board
      { id: 'd2', color: 1, points: [{ x: 6, y: 4 }, { x: 6, y: 2 }] }, // Blue = 1: UP, blocked by d1 at (6,1)
      { id: 'd3', color: 2, points: [{ x: 4, y: 3 }, { x: 5, y: 3 }] }, // Green = 2: RIGHT, blocked by d2 at (6,3)
      { id: 'd4', color: 3, points: [{ x: 5, y: 6 }, { x: 5, y: 4 }] }, // Yellow = 3: UP, blocked by d3 at (5,3)
      { id: 'd5', color: 4, points: [{ x: 2, y: 5 }, { x: 4, y: 5 }] }, // Pink = 4: RIGHT, blocked by d4 at (5,5)
      { id: 'd6', color: 5, points: [{ x: 3, y: 7 }, { x: 3, y: 6 }] }, // Orange = 5: UP, blocked by d5 at (3,5)
      { id: 'd7', color: 6, points: [{ x: 0, y: 7 }, { x: 2, y: 7 }] }, // Brown = 6: RIGHT, blocked by d6 at (3,7)
    ],
  },

  // =========================================================================
  // LEVEL 8: The Dual Zipper (Grid 8x8)
  // Design: Alternating zipper teeth that unravel in a deeply satisfying
  // Left-Right chain reaction once the pull is cleared.
  // =========================================================================
  {
    id: 'level-8',
    name: 'Level 8: The Dual Zipper',
    gridSize: { width: 8, height: 8 },
    arrows: [
      { id: 'pull', color: 7, points: [{ x: 4, y: 1 }, { x: 4, y: 0 }] }, // Cyan = 7: UP, clear exit
      { id: 'l1', color: 1, points: [{ x: 1, y: 1 }, { x: 3, y: 1 }] }, // Blue = 1: RIGHT, blocked by pull at (4,1)
      { id: 'r1', color: 2, points: [{ x: 3, y: 3 }, { x: 3, y: 2 }] }, // Green = 2: UP, blocked by l1 at (3,1)
      { id: 'l2', color: 3, points: [{ x: 1, y: 3 }, { x: 2, y: 3 }] }, // Yellow = 3: RIGHT, blocked by r1 at (3,3)
      { id: 'r2', color: 4, points: [{ x: 2, y: 5 }, { x: 2, y: 4 }] }, // Pink = 4: UP, blocked by l2 at (2,3)
      { id: 'l3', color: 5, points: [{ x: 0, y: 5 }, { x: 1, y: 5 }] }, // Orange = 5: RIGHT, blocked by r2 at (2,5)
      { id: 'r3', color: 6, points: [{ x: 1, y: 7 }, { x: 1, y: 6 }] }, // Brown = 6: UP, blocked by l3 at (1,5)
      { id: 'anchor', color: 0, points: [{ x: 0, y: 6 }, { x: 0, y: 7 }] }, // Red = 0: DOWN, clear exit
    ],
  },

  // =========================================================================
  // LEVEL 9: The Gentle Breeze (Grid 6x6)
  // Design: An easy, relaxing breather level before the final challenge.
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
  // LEVEL 10: The Tangled Colossus (Grid 9x9)
  // Design: The ultimate expert challenge. 9 multi-colored interlocking arrows
  // with dense crossings, strict 9-step single-choice cascade [1,1,1,1,1,1,1,1,1].
  // =========================================================================
  {
    id: 'level-10',
    name: 'Level 10: The Tangled Colossus',
    gridSize: { width: 9, height: 9 },
    arrows: [
      { id: 'a1_scout', color: 7, points: [{ x: 8, y: 3 }, { x: 8, y: 0 }] }, // Cyan = 7: UP, clear exit
      { id: 'a2_bridge', color: 1, points: [{ x: 5, y: 1 }, { x: 7, y: 1 }] }, // Blue = 1: RIGHT, blocked by a1 at (8,1)
      { id: 'a3_column', color: 2, points: [{ x: 6, y: 4 }, { x: 6, y: 2 }] }, // Green = 2: UP, blocked by a2 at (6,1)
      { id: 'a4_spear', color: 0, points: [{ x: 3, y: 3 }, { x: 5, y: 3 }] }, // Red = 0: RIGHT, blocked by a3 at (6,3)
      { id: 'a5_tower', color: 5, points: [{ x: 4, y: 6 }, { x: 4, y: 4 }] }, // Orange = 5: UP, blocked by a4 at (4,3)
      { id: 'a6_cross', color: 4, points: [{ x: 1, y: 5 }, { x: 3, y: 5 }] }, // Pink = 4: RIGHT, blocked by a5 at (4,5)
      { id: 'a7_pillar', color: 6, points: [{ x: 2, y: 8 }, { x: 2, y: 6 }] }, // Brown = 6: UP, blocked by a6 at (2,5)
      { id: 'a8_gate', color: 3, points: [{ x: 0, y: 7 }, { x: 1, y: 7 }] }, // Yellow = 3: RIGHT, blocked by a7 at (2,7)
      { id: 'a9_monarch', color: 1, points: [{ x: 0, y: 4 }, { x: 0, y: 6 }] }, // Blue = 1: DOWN, blocked by a8 at (0,7)
    ],
  },
];

console.log('=== VERIFYING COMPLETE 10-LEVEL PROGRESSION ===\n');
let allGood = true;
for (const lvl of ALL_10_LEVELS) {
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
    allGood = false;
    console.error('? ' + lvl.name + ' FAILED:');
    if (overlap.hasOverlaps) console.error('  Overlaps:', overlap.overlaps);
    if (!sol.isSolvable) console.error('  Solvability:', sol.message);
  } else {
    console.log('? ' + lvl.name);
    console.log('   Arrows: ' + lvl.arrows.length + ' | Steps: ' + sol.stepOrder.length + ' | Branching: [' + branch.join(', ') + ']');
    console.log('   Order: ' + sol.stepOrder.join(' -> '));
  }
}

if (allGood) {
  console.log('\n?? ALL 10 LEVELS PASS WITH ZERO OVERLAPS AND 100% SOLVABILITY!');
} else {
  process.exit(1);
}

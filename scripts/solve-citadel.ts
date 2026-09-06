import { Arrow } from '../src/types';
import { solveLevel } from '../src/utils/solver';
import { analyzeArrowExit, checkArrowOverlaps } from '../src/utils/geometry';

const citadelArrows: Arrow[] = [
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

  // 9. A9 (Cyan = 7 / Blue = 1): Citadel Monarch
  {
    id: 'a9_monarch',
    color: 1, // Blue
    points: [{ x: 0, y: 4 }, { x: 0, y: 6 }], // DOWN, blocked by A8 at (0,7)
  },
];

console.log('Testing Citadel Level Design...');
const overlap = checkArrowOverlaps(citadelArrows);
console.log('Overlaps:', overlap);

const sol = solveLevel(citadelArrows, { width: 9, height: 9 });
console.log('Solvable:', sol.isSolvable);
console.log('Step Count:', sol.stepOrder.length);
console.log('Step Order:', sol.stepOrder);

let remaining = [...citadelArrows];
const branchHistory: number[] = [];
while (remaining.length > 0) {
  const free = remaining.filter((a) => !analyzeArrowExit(a, remaining, { width: 9, height: 9 }).isBlocked);
  branchHistory.push(free.length);
  if (free.length === 0) break;
  const chosen = free[0];
  remaining = remaining.filter((a) => a.id !== chosen.id);
}
console.log('Branching per step (free choices):', branchHistory);

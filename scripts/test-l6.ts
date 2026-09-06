import { testAndReport } from './design-complex-levels';
import { Level } from '../src/types';

const lvl6: Level = {
  id: 'level-6',
  name: 'Level 6: Tangled Maze',
  gridSize: { width: 8, height: 8 },
  arrows: [
    // 0. Key S-Hook (Cyan = 7): Exits top at (2,0)
    {
      id: 'a0_key',
      color: 7,
      points: [{ x: 0, y: 5 }, { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 0 }],
    },
    // 1. Zigzag (Red = 0): (7,2) -> (4,2) -> (4,1) -> (3,1). Points LEFT, ray hits (2,1) on a0_key
    {
      id: 'a1_zigzag',
      color: 0,
      points: [{ x: 7, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 3, y: 1 }],
    },
    // 2. Center Hook (Blue = 1): (6,5) -> (6,3) -> (5,3) -> (5,2). Points UP, ray hits (5,2) on a1_zigzag
    {
      id: 'a2_hook',
      color: 1,
      points: [{ x: 7, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 5, y: 3 }], // points LEFT at (5,3)? Wait, (4,2) is nearby.
    },
  ],
};

testAndReport(lvl6);

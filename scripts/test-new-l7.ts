import { validateLevel } from './build-masterpiece';
import { Level } from '../src/types';

const lvl7: Level = {
  id: 'level-7',
  name: 'Level 7: The Unfolding Spiral',
  gridSize: { width: 8, height: 8 },
  arrows: [
    // 0. Outer Frame (Cyan = 7): L-hook from (0,7) -> (7,7) -> (7,0). Points UP, exits off top!
    {
      id: 'a0_frame',
      color: 7,
      points: [{ x: 0, y: 7 }, { x: 7, y: 7 }, { x: 7, y: 0 }],
    },
    // 1. Hook 1 (Red = 0): Starts at x=2! (2,5) -> (5,5) -> (6,5). Points RIGHT, ray hits (7,5) on a0_frame
    {
      id: 'a1_hook1',
      color: 0,
      points: [{ x: 2, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }],
    },
    // 2. Hook 2 (Blue = 1): L-hook (6,1) -> (5,1) -> (5,4). Points DOWN, ray hits (5,5) on a1_hook1
    {
      id: 'a2_hook2',
      color: 1,
      points: [{ x: 6, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 4 }],
    },
    // 3. Hook 3 (Green = 2): L-hook (1,6) -> (1,3) -> (4,3). Points RIGHT, ray hits (5,3) on a2_hook2
    {
      id: 'a3_hook3',
      color: 2,
      points: [{ x: 1, y: 6 }, { x: 1, y: 3 }, { x: 4, y: 3 }],
    },
    // 4. Hook 4 (Yellow = 3): L-hook (4,0) -> (3,0) -> (3,2). Points DOWN, ray hits (3,3) on a3_hook3
    {
      id: 'a4_hook4',
      color: 3,
      points: [{ x: 4, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 2 }],
    },
    // 5. Hook 5 (Pink = 4): (0,2) -> (2,2). Points RIGHT, ray hits (3,2) on a4_hook4
    {
      id: 'a5_hook5',
      color: 4,
      points: [{ x: 0, y: 2 }, { x: 2, y: 2 }],
    },
    // 6. Hook 6 (Orange = 5): (2,0) -> (2,1). Points DOWN into (2,2) on a5_hook5
    {
      id: 'a6_hook6',
      color: 5,
      points: [{ x: 2, y: 0 }, { x: 2, y: 1 }],
    },
  ],
};

validateLevel(lvl7);

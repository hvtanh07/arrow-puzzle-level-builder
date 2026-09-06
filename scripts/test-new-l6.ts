import { validateLevel } from './build-masterpiece';
import { Level } from '../src/types';

const lvl6: Level = {
  id: 'level-6',
  name: 'Level 6: Tangled Noise (Winding Maze)',
  gridSize: { width: 8, height: 8 },
  arrows: [
    // Key (Cyan = 7): S-hook, exits UP at (2,0)
    {
      id: 'a1_key',
      color: 7,
      points: [{ x: 0, y: 5 }, { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 0 }],
    },
    // Hook Top (Red = 0, 2 turns): (7,2) -> (4,2) -> (4,1) -> (3,1). Points LEFT into (2,1) on a1_key
    {
      id: 'a2_top_hook',
      color: 0,
      points: [{ x: 7, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 1 }, { x: 3, y: 1 }],
    },
    // U-West (Blue = 1, 2 turns): (1,6) -> (1,3) -> (3,3) -> (3,2). Points UP into (3,1) on a2_top_hook
    {
      id: 'a3_west_u',
      color: 1,
      points: [{ x: 1, y: 6 }, { x: 1, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 2 }],
    },
    // Center S (Green = 2, 3 turns): (7,5) -> (5,5) -> (5,3) -> (6,3). Points RIGHT off board or UP?
    // Let head be at (6,3) from (6,4) pointing UP into (6,2) on a2_top_hook!
    {
      id: 'a4_center_s',
      color: 2,
      points: [{ x: 7, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 6, y: 3 }],
    },
    // Mid Zigzag (Yellow = 3, 3 turns): (2,7) -> (2,5) -> (4,5) -> (4,4) -> (3,4).
    // Points LEFT into a3_west_u at (1,4)
    {
      id: 'a5_mid_zigzag',
      color: 3,
      points: [{ x: 2, y: 7 }, { x: 2, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 4 }, { x: 3, y: 4 }],
    },
    // Base Meander (Orange = 5, 2 turns): (5,7) -> (5,6) -> (7,6) -> (7,7). Points DOWN, exits board!
    // Or points LEFT into a5_mid_zigzag:
    {
      id: 'a6_base_meander',
      color: 5,
      points: [{ x: 6, y: 7 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 3, y: 6 }],
    },
  ],
};

validateLevel(lvl6);

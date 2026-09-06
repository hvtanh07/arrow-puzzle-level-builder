import { validateLevel } from './build-masterpiece';
import { Level } from '../src/types';

const lvl10_fixed: Level = {
  id: 'level-10',
  name: 'Level 10: The Master Labyrinth',
  gridSize: { width: 10, height: 14 },
  arrows: [
    // 0. Key Scout (Cyan = 7, 3 turns): Exits UP at (3,0)
    {
      id: 'a00_scout',
      color: 7,
      points: [{ x: 1, y: 3 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 0 }],
    },
    // 1. Top Crown (Yellow = 3, 3 turns): Points LEFT into (3,1) on a00_scout. Exits row 1!
    {
      id: 'a01_crown',
      color: 3,
      points: [{ x: 9, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 4, y: 1 }],
    },
    // 2. Top-Left Hook (Orange = 5, 2 turns): Exits UP at (0,0)
    {
      id: 'a02_tl_hook',
      color: 5,
      points: [{ x: 0, y: 4 }, { x: 0, y: 0 }],
    },
    // 3. North-East Serpent (Blue = 1, 3 turns): Points LEFT into (5,1) on a01_crown
    {
      id: 'a03_ne_serpent',
      color: 1,
      points: [{ x: 9, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 1 }, { x: 6, y: 1 }],
    },
    // 4. Upper Green Stair (Green = 2, 3 turns): Points LEFT into (0,2) on a02_tl_hook
    {
      id: 'a04_upper_stair',
      color: 2,
      points: [{ x: 2, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 2 }, { x: 2, y: 2 }],
    },
    // 5. East Pink U-turn (Pink = 4, 3 turns): Points UP, exits off board at (9,0), blocked by a01_crown
    {
      id: 'a05_east_u',
      color: 4,
      points: [{ x: 7, y: 4 }, { x: 9, y: 4 }, { x: 9, y: 3 }],
    },
    // 6. Center Bridge (Brown = 6, 2 turns): Points LEFT into (3,3) on a04_upper_stair
    {
      id: 'a06_mid_bridge',
      color: 6,
      points: [{ x: 5, y: 5 }, { x: 5, y: 3 }, { x: 4, y: 3 }],
    },
    // 7. West Flank Snake (Red = 0, 3 turns): Points DOWN into (2,13) on a13_bl_hook
    {
      id: 'a07_west_flank',
      color: 0,
      points: [{ x: 0, y: 8 }, { x: 0, y: 5 }, { x: 2, y: 5 }, { x: 2, y: 6 }],
    },
    // 8. Mid Horizontal Sweep (Blue = 1, 3 turns): Points RIGHT into (9,5) on a05_east_u
    {
      id: 'a08_mid_sweep',
      color: 1,
      points: [{ x: 1, y: 7 }, { x: 6, y: 7 }, { x: 6, y: 5 }, { x: 7, y: 5 }],
    },
    // 9. Central Cross (Green = 2, 2 turns): Points RIGHT into (6,6) on a08_mid_sweep
    {
      id: 'a09_cross',
      color: 2,
      points: [{ x: 3, y: 6 }, { x: 5, y: 6 }],
    },
    // 10. Lower Yellow Frame (Yellow = 3, 3 turns): Points UP into (8,2) on a03_ne_serpent
    {
      id: 'a10_yellow_frame',
      color: 3,
      points: [{ x: 1, y: 10 }, { x: 1, y: 12 }, { x: 8, y: 12 }, { x: 8, y: 10 }],
    },
    // 11. Inner Cyan Hook (Cyan = 7, 3 turns): Points LEFT into col 1 on a10_yellow_frame
    {
      id: 'a11_inner_cyan',
      color: 7,
      points: [{ x: 3, y: 11 }, { x: 6, y: 11 }, { x: 6, y: 9 }, { x: 5, y: 9 }],
    },
    // 12. Deep Orange Snake (Orange = 5, 2 turns): Points RIGHT off board at row 8
    {
      id: 'a12_deep_snake',
      color: 5,
      points: [{ x: 7, y: 10 }, { x: 7, y: 8 }, { x: 9, y: 8 }],
    },
    // 13. Bottom-Left Hook (Pink = 4, 2 turns): (0, 10) -> (0, 13) -> (3, 13). Points RIGHT into (5,13) on a14_br_runner
    {
      id: 'a13_bl_hook',
      color: 4,
      points: [{ x: 0, y: 10 }, { x: 0, y: 13 }, { x: 3, y: 13 }],
    },
    // 14. Bottom-Right Runner (Brown = 6): (5, 13) -> (9, 13). Points RIGHT, clear exit off right edge
    {
      id: 'a14_br_runner',
      color: 6,
      points: [{ x: 5, y: 13 }, { x: 9, y: 13 }],
    },
  ],
};

validateLevel(lvl10_fixed);

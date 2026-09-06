import { testLevel } from './pack-even-levels';
import { Level } from '../src/types';

const lvl8_clean: Level = {
  id: 'level-8',
  name: 'Level 8: The Interwoven Comb',
  gridSize: { width: 8, height: 8 },
  arrows: [
    // Top Key (Cyan = 7): (7,0) -> (0,0) [LEFT, clear exit off left edge!]
    { id: 'top_key', color: 7, points: [{ x: 7, y: 0 }, { x: 0, y: 0 }] },

    // East Spine (Pink = 4): Col 5, (5,7) -> (5,1). Points UP, ray hits (5,0) on top_key!
    { id: 'spine_east', color: 4, points: [{ x: 5, y: 7 }, { x: 5, y: 1 }] },

    // West Spine (Yellow = 3): Col 2, (2,7) -> (2,1). Points UP, ray hits (2,0) on top_key!
    { id: 'spine_west', color: 3, points: [{ x: 2, y: 7 }, { x: 2, y: 1 }] },

    // Left Teeth in cols 0..1 (Rows 1, 3, 5) pointing RIGHT into spine_west:
    { id: 'l_tooth_1', color: 2, points: [{ x: 0, y: 1 }, { x: 1, y: 1 }] }, // Hits (2,1) on spine_west
    { id: 'l_tooth_2', color: 4, points: [{ x: 0, y: 3 }, { x: 1, y: 3 }] }, // Hits (2,3) on spine_west
    { id: 'l_tooth_3', color: 1, points: [{ x: 0, y: 5 }, { x: 1, y: 5 }] }, // Hits (2,5) on spine_west

    // Right Teeth in cols 6..7 (Rows 2, 4, 6) pointing LEFT into spine_east:
    { id: 'r_tooth_1', color: 0, points: [{ x: 7, y: 2 }, { x: 6, y: 2 }] }, // Hits (5,2) on spine_east
    { id: 'r_tooth_2', color: 5, points: [{ x: 7, y: 4 }, { x: 6, y: 4 }] }, // Hits (5,4) on spine_east
    { id: 'r_tooth_3', color: 6, points: [{ x: 7, y: 6 }, { x: 6, y: 6 }] }, // Hits (5,6) on spine_east

    // Center vertical pillars: Cols 3 and 4 pointing DOWN off board!
    // But blocked by bottom runners or spine!
    { id: 'c_pillar_1', color: 1, points: [{ x: 3, y: 1 }, { x: 3, y: 5 }] }, // Points DOWN, ray hits (3,7) on bc_runner
    { id: 'c_pillar_2', color: 2, points: [{ x: 4, y: 1 }, { x: 4, y: 5 }] }, // Points DOWN, ray hits (4,7) on bc_runner

    // Bottom runners:
    { id: 'bl_runner', color: 0, points: [{ x: 1, y: 7 }, { x: 0, y: 7 }] }, // LEFT off board
    { id: 'bc_runner', color: 7, points: [{ x: 3, y: 7 }, { x: 4, y: 7 }] }, // RIGHT into (5,7) on spine_east!
    { id: 'br_runner', color: 6, points: [{ x: 6, y: 7 }, { x: 7, y: 7 }] }, // RIGHT off board
  ],
};

testLevel(lvl8_clean);

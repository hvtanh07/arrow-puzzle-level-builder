import { testLevel } from './pack-even-levels';
import { Level } from '../src/types';

// Let us first design an EVENLY FILLED Level 9 (6x6)
// Easy level, but NO giant hole in the middle!
// 6 arrows covering top, center, and bottom evenly.
const lvl9_even: Level = {
  id: 'level-9',
  name: 'Level 9: The Gentle Breeze (Evenly Filled)',
  gridSize: { width: 6, height: 6 },
  arrows: [
    // Top border: row 0
    { id: 'top_left', color: 3, points: [{ x: 2, y: 0 }, { x: 0, y: 0 }] }, // LEFT, clear
    { id: 'top_right', color: 5, points: [{ x: 3, y: 0 }, { x: 5, y: 0 }] }, // RIGHT, clear
    // Center column 2 & 3: FILLING THE CENTER!
    { id: 'center_up', color: 1, points: [{ x: 2, y: 4 }, { x: 2, y: 1 }] }, // UP, blocked by top_left at (2,0)
    { id: 'center_down', color: 2, points: [{ x: 3, y: 1 }, { x: 3, y: 4 }] }, // DOWN, blocked by bot_right at (3,5)
    // Left & Right columns:
    { id: 'west_down', color: 4, points: [{ x: 1, y: 1 }, { x: 1, y: 4 }] }, // DOWN, clear exit
    { id: 'east_up', color: 7, points: [{ x: 4, y: 4 }, { x: 4, y: 1 }] }, // UP, clear exit
    // Bottom border: row 5
    { id: 'bot_left', color: 0, points: [{ x: 2, y: 5 }, { x: 0, y: 5 }] }, // LEFT, clear
    { id: 'bot_right', color: 6, points: [{ x: 3, y: 5 }, { x: 5, y: 5 }] }, // RIGHT, clear
  ],
};

testLevel(lvl9_even);

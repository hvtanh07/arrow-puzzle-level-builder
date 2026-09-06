import { Level } from '../types';

export const PREMADE_LEVELS: Level[] = [
  {
    id: 'level-1',
    name: 'Level 1: First Flight',
    gridSize: { width: 6, height: 6 },
    arrows: [
      {
        id: 'a1',
        color: 1, // Blue
        points: [
          { x: 1, y: 1 },
          { x: 1, y: 4 },
        ], // Points DOWN, clear
      },
      {
        id: 'a2',
        color: 2, // Green
        points: [
          { x: 4, y: 4 },
          { x: 4, y: 1 },
        ], // Points UP, clear
      },
      {
        id: 'a3',
        color: 4, // Pink
        points: [
          { x: 2, y: 5 },
          { x: 5, y: 5 },
        ], // Points RIGHT, clear
      },
    ],
  },
  {
    id: 'level-2',
    name: 'Level 2: The Crossing',
    gridSize: { width: 7, height: 7 },
    arrows: [
      {
        id: 'a1',
        color: 1, // Blue
        points: [
          { x: 2, y: 1 },
          { x: 2, y: 5 },
        ], // Points DOWN, clear
      },
      {
        id: 'a2',
        color: 5, // Orange
        points: [
          { x: 5, y: 3 },
          { x: 3, y: 3 },
        ], // Points LEFT, blocked by a1 at (2,3)
      },
      {
        id: 'a3',
        color: 2, // Green
        points: [
          { x: 4, y: 1 },
          { x: 4, y: 2 },
        ], // Points DOWN, blocked by a2 at (4,3)
      },
      {
        id: 'a4',
        color: 0, // Red
        points: [
          { x: 5, y: 6 },
          { x: 1, y: 6 },
        ], // Points LEFT, clear
      },
    ],
  },
  {
    id: 'level-3',
    name: 'Level 3: Corner Turn',
    gridSize: { width: 7, height: 7 },
    arrows: [
      {
        id: 'a1',
        color: 1, // Blue
        points: [
          { x: 1, y: 5 },
          { x: 5, y: 5 },
          { x: 5, y: 1 },
        ], // L-shape UP, clear
      },
      {
        id: 'a2',
        color: 2, // Green
        points: [
          { x: 3, y: 1 },
          { x: 3, y: 4 },
        ], // Straight DOWN, blocked by a1 bottom bar at (3,5)
      },
      {
        id: 'a3',
        color: 4, // Pink
        points: [
          { x: 1, y: 2 },
          { x: 2, y: 2 },
        ], // Straight RIGHT, blocked by a2 at (3,2)
      },
    ],
  },
  {
    id: 'level-4',
    name: 'Level 4: Zig Zag Escape',
    gridSize: { width: 8, height: 8 },
    arrows: [
      {
        id: 'a1',
        color: 1, // Blue
        points: [
          { x: 2, y: 1 },
          { x: 2, y: 3 },
          { x: 1, y: 3 },
          { x: 1, y: 6 },
        ], // S-shape DOWN, clear
      },
      {
        id: 'a2',
        color: 2, // Green
        points: [
          { x: 5, y: 7 },
          { x: 2, y: 7 },
          { x: 2, y: 5 },
        ], // L-shape UP, blocked by a1 at (2,3)
      },
      {
        id: 'a3',
        color: 5, // Orange
        points: [
          { x: 4, y: 1 },
          { x: 4, y: 6 },
        ], // DOWN, blocked by a2 at (4,7)
      },
      {
        id: 'a4',
        color: 6, // Brown
        points: [
          { x: 6, y: 3 },
          { x: 5, y: 3 },
        ], // LEFT, blocked by a3 at (4,3)
      },
    ],
  },
  {
    id: 'level-5',
    name: 'Level 5: Box Trap',
    gridSize: { width: 8, height: 8 },
    arrows: [
      {
        id: 'a1',
        color: 1, // Blue
        points: [
          { x: 1, y: 6 },
          { x: 1, y: 1 },
          { x: 5, y: 1 },
        ], // L-shape RIGHT, clear
      },
      {
        id: 'a2',
        color: 2, // Green
        points: [
          { x: 6, y: 1 },
          { x: 6, y: 6 },
        ], // Straight DOWN, clear
      },
      {
        id: 'a3',
        color: 3, // Yellow
        points: [
          { x: 2, y: 2 },
          { x: 4, y: 2 },
        ], // RIGHT, blocked by a2 at (6,2)
      },
      {
        id: 'a4',
        color: 4, // Pink
        points: [
          { x: 5, y: 5 },
          { x: 5, y: 3 },
        ], // UP, blocked by a1 at (5,1)
      },
      {
        id: 'a5',
        color: 6, // Brown
        points: [
          { x: 4, y: 5 },
          { x: 2, y: 5 },
        ], // LEFT, blocked by a1 at (1,5)
      },
    ],
  },
  {
    id: 'level-6',
    name: 'Level 6: Spiral Escape',
    gridSize: { width: 8, height: 8 },
    arrows: [
      {
        id: 'a1',
        color: 4, // Pink
        points: [
          { x: 1, y: 7 },
          { x: 7, y: 7 },
          { x: 7, y: 1 },
        ], // Outer border UP, clear
      },
      {
        id: 'a2',
        color: 2, // Green
        points: [
          { x: 2, y: 6 },
          { x: 6, y: 6 },
          { x: 6, y: 2 },
        ], // Inner border UP, blocked if a1 is there
      },
      {
        id: 'a3',
        color: 1, // Blue
        points: [
          { x: 3, y: 5 },
          { x: 5, y: 5 },
          { x: 5, y: 3 },
        ], // Innermost UP, blocked by a2
      },
      {
        id: 'a4',
        color: 5, // Orange
        points: [
          { x: 4, y: 2 },
          { x: 4, y: 4 },
        ], // Center DOWN, blocked by a3, a2, a1
      },
    ],
  },
  {
    id: 'level-7',
    name: 'Level 7: The Gatekeeper',
    gridSize: { width: 8, height: 8 },
    arrows: [
      {
        id: 'barrier',
        color: 0, // Red
        points: [
          { x: 1, y: 4 },
          { x: 6, y: 4 },
        ], // Horizontal bar pointing RIGHT, clear
      },
      {
        id: 'pawn1',
        color: 1, // Blue
        points: [
          { x: 2, y: 1 },
          { x: 2, y: 3 },
        ], // DOWN, blocked by barrier
      },
      {
        id: 'pawn2',
        color: 2, // Green
        points: [
          { x: 4, y: 1 },
          { x: 4, y: 3 },
        ], // DOWN, blocked by barrier
      },
      {
        id: 'pawn3',
        color: 4, // Pink
        points: [
          { x: 5, y: 6 },
          { x: 5, y: 5 },
        ], // UP, blocked by barrier
      },
      {
        id: 'pawn4',
        color: 3, // Yellow
        points: [
          { x: 3, y: 6 },
          { x: 3, y: 5 },
        ], // UP, blocked by barrier
      },
    ],
  },
  {
    id: 'level-8',
    name: 'Level 8: Highway Interchange',
    gridSize: { width: 8, height: 9 },
    arrows: [
      {
        id: 'a1',
        color: 7, // Cyan
        points: [
          { x: 1, y: 1 },
          { x: 6, y: 1 },
        ], // Straight RIGHT, clear
      },
      {
        id: 'a2',
        color: 1, // Blue
        points: [
          { x: 5, y: 7 },
          { x: 5, y: 2 },
        ], // Straight UP, blocked by a1 at (5,1)
      },
      {
        id: 'a3',
        color: 2, // Green
        points: [
          { x: 1, y: 3 },
          { x: 3, y: 3 },
          { x: 3, y: 6 },
        ], // L DOWN, clear
      },
      {
        id: 'a4',
        color: 5, // Orange
        points: [
          { x: 2, y: 7 },
          { x: 2, y: 4 },
          { x: 1, y: 4 },
        ], // L LEFT, clear
      },
      {
        id: 'a5',
        color: 6, // Brown
        points: [
          { x: 7, y: 5 },
          { x: 6, y: 5 },
        ], // Straight LEFT, blocked by a2 at (5,5)
      },
    ],
  },
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
  {
    id: 'level-10',
    name: 'Level 10: Grand Labyrinth',
    gridSize: { width: 9, height: 9 },
    arrows: [
      {
        id: 'g1',
        color: 4, // Pink
        points: [
          { x: 1, y: 1 },
          { x: 8, y: 1 },
        ], // RIGHT, clear
      },
      {
        id: 'g2',
        color: 6, // Brown
        points: [
          { x: 8, y: 2 },
          { x: 8, y: 8 },
        ], // DOWN, clear
      },
      {
        id: 'g3',
        color: 1, // Blue
        points: [
          { x: 7, y: 8 },
          { x: 1, y: 8 },
        ], // LEFT, clear
      },
      {
        id: 'g4',
        color: 2, // Green
        points: [
          { x: 1, y: 7 },
          { x: 1, y: 2 },
        ], // UP, blocked by g1
      },
      {
        id: 'g5',
        color: 3, // Yellow
        points: [
          { x: 3, y: 3 },
          { x: 6, y: 3 },
          { x: 6, y: 5 },
        ], // L DOWN, blocked by g3
      },
      {
        id: 'g6',
        color: 7, // Cyan
        points: [
          { x: 5, y: 6 },
          { x: 3, y: 6 },
          { x: 3, y: 4 },
        ], // L UP, blocked by g5
      },
      {
        id: 'g7',
        color: 0, // Red
        points: [
          { x: 4, y: 4 },
          { x: 5, y: 4 },
        ], // RIGHT, blocked by g5
      },
    ],
  },
];

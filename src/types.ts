export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Point {
  x: number;
  y: number;
}

export interface Arrow {
  id: string;
  points: Point[]; // ordered from tail (points[0]) to head (points[points.length - 1])
  color: number | string; // 0..7 or hex code
}

export interface GridSize {
  width: number;
  height: number;
}

export interface Level {
  id: string;
  name: string;
  gridSize: GridSize;
  arrows: Arrow[];
}

export interface CollisionPoint {
  x: number;
  y: number;
  arrowId: string;
  obstacleArrowId: string;
}

export interface SolvabilityResult {
  isSolvable: boolean;
  hasOverlaps: boolean;
  overlaps: { arrow1Id: string; arrow2Id: string; point: Point }[];
  stepOrder: string[]; // sequence of arrow IDs to solve
  deadlockedArrowIds: string[];
  blockingGraph: Record<string, string[]>; // arrowId -> array of arrowIds that block it
  message: string;
}

export interface MoveAnalysis {
  arrowId: string;
  isBlocked: boolean;
  blockedByArrowIds: string[];
  firstObstacle?: {
    x: number;
    y: number;
    arrowId: string;
  };
}

export type EditorTool = 'select' | 'draw' | 'erase';

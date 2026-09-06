export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Point {
  x: number;
  y: number;
}

export interface Arrow {
  id: string;
  points: Point[]; // ordered from tail (points[0]) to head (points[points.length - 1])
  color: number | string; // 0..7 or hex code
  isDoubleHeaded?: boolean; // Element 1: Two-headed arrow (heads at both points[0] and points[len-1])
  linkedGroupId?: string; // Element 2: Linked arrows group ID
  layer?: number; // Element 3: Overlap layer (higher layer is on top of lower layer)
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
    distance: number;
  };
  // Diagnostics for the 3 new elements
  isBlockedByReverseHead?: boolean;
  firstObstacleReverse?: {
    x: number;
    y: number;
    arrowId: string;
    distance: number;
  };
  isBlockedByTopLayer?: boolean;
  topPinArrowId?: string;
  isBlockedByLinkedGroup?: boolean;
  blockingPartnerId?: string;
}

export type EditorTool = 'select' | 'draw' | 'erase';

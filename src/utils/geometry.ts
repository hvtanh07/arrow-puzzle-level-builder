import { Arrow, Direction, GridSize, Point } from '../types';

export function getHeadDirection(arrow: Arrow): Direction {
  if (arrow.points.length < 2) return 'UP';
  const prev = arrow.points[arrow.points.length - 2];
  const head = arrow.points[arrow.points.length - 1];

  const dx = head.x - prev.x;
  const dy = head.y - prev.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'RIGHT' : 'LEFT';
  } else {
    return dy > 0 ? 'DOWN' : 'UP';
  }
}

export function getDirectionVector(dir: Direction): Point {
  switch (dir) {
    case 'UP':
      return { x: 0, y: -1 };
    case 'DOWN':
      return { x: 0, y: 1 };
    case 'LEFT':
      return { x: -1, y: 0 };
    case 'RIGHT':
      return { x: 1, y: 0 };
  }
}

/**
 * Returns all discrete grid points occupied by an arrow's polyline
 */
export function getArrowOccupiedPoints(arrow: Arrow): Point[] {
  const points: Point[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < arrow.points.length - 1; i++) {
    const p1 = arrow.points[i];
    const p2 = arrow.points[i + 1];

    const dx = Math.sign(p2.x - p1.x);
    const dy = Math.sign(p2.y - p1.y);

    let cx = p1.x;
    let cy = p1.y;

    while (true) {
      const key = `${cx},${cy}`;
      if (!seen.has(key)) {
        seen.add(key);
        points.push({ x: cx, y: cy });
      }
      if (cx === p2.x && cy === p2.y) break;
      cx += dx;
      cy += dy;
    }
  }

  return points;
}

/**
 * Checks if a point is within grid boundaries
 */
export function isPointInBounds(point: Point, gridSize: GridSize): boolean {
  return (
    point.x >= 0 &&
    point.x < gridSize.width &&
    point.y >= 0 &&
    point.y < gridSize.height
  );
}

/**
 * Checks if arrow A's exit path is blocked by any other arrow in arrows list.
 * Returns the blocking analysis.
 */
export function analyzeArrowExit(
  arrow: Arrow,
  allArrows: Arrow[],
  gridSize: GridSize
): {
  isBlocked: boolean;
  blockedByArrowIds: string[];
  firstObstacle?: { x: number; y: number; arrowId: string; distance: number };
} {
  if (arrow.points.length < 2) {
    return { isBlocked: false, blockedByArrowIds: [] };
  }

  const head = arrow.points[arrow.points.length - 1];
  const dir = getHeadDirection(arrow);
  const v = getDirectionVector(dir);

  // Map other arrows to their occupied points
  const otherArrows = allArrows.filter((a) => a.id !== arrow.id);
  const pointToArrowId = new Map<string, string>();

  for (const other of otherArrows) {
    const occupied = getArrowOccupiedPoints(other);
    for (const p of occupied) {
      pointToArrowId.set(`${p.x},${p.y}`, other.id);
    }
  }

  const blockedBySet = new Set<string>();
  let firstObstacle: { x: number; y: number; arrowId: string; distance: number } | undefined;

  let step = 1;
  while (true) {
    const checkX = head.x + v.x * step;
    const checkY = head.y + v.y * step;

    // Check if we've exited the board
    if (!isPointInBounds({ x: checkX, y: checkY }, gridSize)) {
      break;
    }

    const blockerId = pointToArrowId.get(`${checkX},${checkY}`);
    if (blockerId) {
      blockedBySet.add(blockerId);
      if (!firstObstacle) {
        firstObstacle = {
          x: checkX,
          y: checkY,
          arrowId: blockerId,
          distance: step,
        };
      }
    }

    step++;
  }

  return {
    isBlocked: blockedBySet.size > 0,
    blockedByArrowIds: Array.from(blockedBySet),
    firstObstacle,
  };
}

/**
 * Check if arrows overlap at rest
 */
export function checkArrowOverlaps(arrows: Arrow[]): {
  hasOverlaps: boolean;
  overlaps: { arrow1Id: string; arrow2Id: string; point: Point }[];
} {
  const pointMap = new Map<string, string>(); // 'x,y' -> arrowId
  const overlaps: { arrow1Id: string; arrow2Id: string; point: Point }[] = [];

  for (const arrow of arrows) {
    const occupied = getArrowOccupiedPoints(arrow);
    for (const p of occupied) {
      const key = `${p.x},${p.y}`;
      if (pointMap.has(key)) {
        const otherId = pointMap.get(key)!;
        overlaps.push({
          arrow1Id: otherId,
          arrow2Id: arrow.id,
          point: p,
        });
      } else {
        pointMap.set(key, arrow.id);
      }
    }
  }

  return {
    hasOverlaps: overlaps.length > 0,
    overlaps,
  };
}

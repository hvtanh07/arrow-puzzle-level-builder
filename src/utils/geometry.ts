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

/**
 * Extends an arrow's polyline forward in the head's exit direction by exitDistance units.
 */
export function getExtendedTrack(points: Point[], exitDistance: number): Point[] {
  if (points.length < 2) return points;
  const head = points[points.length - 1];
  const dir = getHeadDirection({ id: 'temp', color: 0, points });
  const v = getDirectionVector(dir);

  const exitHead: Point = {
    x: head.x + v.x * exitDistance,
    y: head.y + v.y * exitDistance,
  };

  return [...points, exitHead];
}

/**
 * Computes cumulative polyline arc-lengths at each vertex of track.
 */
export function computePolylineLengths(track: Point[]): number[] {
  const cumLengths: number[] = [0];
  for (let i = 0; i < track.length - 1; i++) {
    const p1 = track[i];
    const p2 = track[i + 1];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    cumLengths.push(cumLengths[cumLengths.length - 1] + dist);
  }
  return cumLengths;
}

/**
 * Returns a point along the polyline track at arc-length dist.
 */
export function getPointAtDistance(track: Point[], cumLengths: number[], dist: number): Point {
  const total = cumLengths[cumLengths.length - 1];
  if (dist <= 0) return { ...track[0] };
  if (dist >= total) return { ...track[track.length - 1] };

  for (let i = 0; i < cumLengths.length - 1; i++) {
    if (dist >= cumLengths[i] && dist <= cumLengths[i + 1]) {
      const segLen = cumLengths[i + 1] - cumLengths[i];
      if (segLen === 0) return { ...track[i] };
      const u = (dist - cumLengths[i]) / segLen;
      return {
        x: track[i].x + u * (track[i + 1].x - track[i].x),
        y: track[i].y + u * (track[i + 1].y - track[i].y),
      };
    }
  }
  return { ...track[track.length - 1] };
}

/**
 * Slices the polyline track between arc-length sStart and sEnd,
 * preserving all intermediate corner vertices so that the arrow body
 * follows the exact geometry path as the head moves straight ahead.
 */
export function slicePolyline(
  track: Point[],
  cumLengths: number[],
  sStart: number,
  sEnd: number
): Point[] {
  const startPt = getPointAtDistance(track, cumLengths, sStart);
  const endPt = getPointAtDistance(track, cumLengths, sEnd);

  const raw: Point[] = [startPt];

  // Include intermediate track vertices strictly between sStart and sEnd
  for (let i = 1; i < track.length - 1; i++) {
    const d = cumLengths[i];
    if (d > sStart + 0.001 && d < sEnd - 0.001) {
      raw.push({ ...track[i] });
    }
  }

  // Ensure endPt is distinct from the last added point
  const last = raw[raw.length - 1];
  const dist = Math.hypot(endPt.x - last.x, endPt.y - last.y);
  if (dist > 0.001) {
    raw.push(endPt);
  } else if (raw.length === 1) {
    raw.push({ x: endPt.x + 0.01, y: endPt.y });
  }

  // Collinear cleaning
  if (raw.length <= 2) return raw;
  const cleaned: Point[] = [raw[0]];
  for (let i = 1; i < raw.length - 1; i++) {
    const prev = cleaned[cleaned.length - 1];
    const cur = raw[i];
    const next = raw[i + 1];

    const isHoriz = Math.abs(prev.y - cur.y) < 0.001 && Math.abs(cur.y - next.y) < 0.001;
    const isVert = Math.abs(prev.x - cur.x) < 0.001 && Math.abs(cur.x - next.x) < 0.001;

    if (!isHoriz && !isVert) {
      cleaned.push(cur);
    }
  }
  cleaned.push(raw[raw.length - 1]);
  return cleaned;
}


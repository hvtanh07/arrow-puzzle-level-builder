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

/**
 * Returns the direction of the reverse head (at points[0]) for double-headed arrows
 */
export function getReverseHeadDirection(arrow: Arrow): Direction {
  if (arrow.points.length < 2) return 'DOWN';
  const p1 = arrow.points[1];
  const p0 = arrow.points[0];

  const dx = p0.x - p1.x;
  const dy = p0.y - p1.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'RIGHT' : 'LEFT';
  } else {
    return dy > 0 ? 'DOWN' : 'UP';
  }
}

/**
 * Computes strict total order for arrow layer sorting.
 * Higher layer sits on top of lower layer.
 * Array index acts as consistent tiebreaker for equal layers.
 */
export function getEffectiveLayer(arrow: Arrow, allArrows?: Arrow[]): number {
  const explicit = arrow.layer ?? 0;
  if (!allArrows) return explicit * 1000;
  const index = allArrows.findIndex((a) => a.id === arrow.id);
  return explicit * 1000 + (index >= 0 ? index : 0);
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
 * Analyzes whether an arrow itself is blocked (forward head ray,
 * reverse head ray for 2-headed arrows, or pinned down by a top layer arrow).
 */
export function analyzeIndividualArrowExit(
  arrow: Arrow,
  allArrows: Arrow[],
  gridSize: GridSize
): {
  arrowId: string;
  isBlocked: boolean;
  blockedByArrowIds: string[];
  firstObstacle?: { x: number; y: number; arrowId: string; distance: number };
  isBlockedByReverseHead?: boolean;
  firstObstacleReverse?: { x: number; y: number; arrowId: string; distance: number };
  isBlockedByTopLayer?: boolean;
  topPinArrowId?: string;
} {
  if (arrow.points.length < 2) {
    return { arrowId: arrow.id, isBlocked: false, blockedByArrowIds: [] };
  }

  const otherArrows = allArrows.filter((a) => a.id !== arrow.id);
  const pointToArrowId = new Map<string, string>();
  const pointToTopArrowId = new Map<string, string>();

  const myEffectiveLayer = getEffectiveLayer(arrow, allArrows);

  for (const other of otherArrows) {
    const occupied = getArrowOccupiedPoints(other);
    const otherEffectiveLayer = getEffectiveLayer(other, allArrows);
    for (const p of occupied) {
      const key = `${p.x},${p.y}`;
      pointToArrowId.set(key, other.id);
      // Element 3: If other arrow has higher effective layer, it pins anything beneath it
      if (otherEffectiveLayer > myEffectiveLayer) {
        pointToTopArrowId.set(key, other.id);
      }
    }
  }

  const blockedBySet = new Set<string>();
  let isBlockedByTopLayer = false;
  let topPinArrowId: string | undefined;

  // Element 3: Check if arrow's own body is pinned down by an arrow on a higher layer
  const myOccupied = getArrowOccupiedPoints(arrow);
  for (const p of myOccupied) {
    const pinningArrowId = pointToTopArrowId.get(`${p.x},${p.y}`);
    if (pinningArrowId) {
      isBlockedByTopLayer = true;
      if (!topPinArrowId) topPinArrowId = pinningArrowId;
      blockedBySet.add(pinningArrowId);
    }
  }

  // Check forward head exit ray
  const head = arrow.points[arrow.points.length - 1];
  const dir = getHeadDirection(arrow);
  const v = getDirectionVector(dir);

  let firstObstacle: { x: number; y: number; arrowId: string; distance: number } | undefined;
  let step = 1;
  while (true) {
    const checkX = head.x + v.x * step;
    const checkY = head.y + v.y * step;

    if (!isPointInBounds({ x: checkX, y: checkY }, gridSize)) break;

    const blockerId = pointToArrowId.get(`${checkX},${checkY}`);
    if (blockerId) {
      blockedBySet.add(blockerId);
      if (!firstObstacle) {
        firstObstacle = { x: checkX, y: checkY, arrowId: blockerId, distance: step };
      }
    }
    step++;
  }

  // Element 1: Check reverse head exit ray if arrow is double-headed
  let isBlockedByReverseHead = false;
  let firstObstacleReverse: { x: number; y: number; arrowId: string; distance: number } | undefined;

  if (arrow.isDoubleHeaded) {
    const tailHead = arrow.points[0];
    const reverseDir = getReverseHeadDirection(arrow);
    const rv = getDirectionVector(reverseDir);

    let revStep = 1;
    while (true) {
      const checkX = tailHead.x + rv.x * revStep;
      const checkY = tailHead.y + rv.y * revStep;

      if (!isPointInBounds({ x: checkX, y: checkY }, gridSize)) break;

      const blockerId = pointToArrowId.get(`${checkX},${checkY}`);
      if (blockerId) {
        isBlockedByReverseHead = true;
        blockedBySet.add(blockerId);
        if (!firstObstacleReverse) {
          firstObstacleReverse = { x: checkX, y: checkY, arrowId: blockerId, distance: revStep };
        }
      }
      revStep++;
    }
  }

  return {
    arrowId: arrow.id,
    isBlocked: blockedBySet.size > 0,
    blockedByArrowIds: Array.from(blockedBySet),
    firstObstacle,
    isBlockedByReverseHead,
    firstObstacleReverse,
    isBlockedByTopLayer,
    topPinArrowId,
  };
}

/**
 * Checks if arrow's exit path is blocked, taking into account:
 * - Forward head ray
 * - Reverse head ray (Element 1: 2-headed arrow)
 * - Layer pinning (Element 3: Overlap arrows)
 * - Linked group synchronization (Element 2: Linked arrows)
 */
export function analyzeArrowExit(
  arrow: Arrow,
  allArrows: Arrow[],
  gridSize: GridSize
): {
  arrowId: string;
  isBlocked: boolean;
  blockedByArrowIds: string[];
  firstObstacle?: { x: number; y: number; arrowId: string; distance: number };
  isBlockedByReverseHead?: boolean;
  firstObstacleReverse?: { x: number; y: number; arrowId: string; distance: number };
  isBlockedByTopLayer?: boolean;
  topPinArrowId?: string;
  isBlockedByLinkedGroup?: boolean;
  blockingPartnerId?: string;
} {
  const selfAnalysis = analyzeIndividualArrowExit(arrow, allArrows, gridSize);

  // Element 2: Linked arrows group check
  if (arrow.linkedGroupId) {
    const linkedPartners = allArrows.filter(
      (a) => a.linkedGroupId === arrow.linkedGroupId && a.id !== arrow.id
    );

    const allBlockedBy = new Set<string>(selfAnalysis.blockedByArrowIds);
    let isBlockedByLinkedGroup = false;
    let blockingPartnerId: string | undefined;

    for (const partner of linkedPartners) {
      const partnerAnalysis = analyzeIndividualArrowExit(partner, allArrows, gridSize);
      if (partnerAnalysis.isBlocked) {
        isBlockedByLinkedGroup = true;
        if (!blockingPartnerId) blockingPartnerId = partner.id;
        for (const bid of partnerAnalysis.blockedByArrowIds) {
          allBlockedBy.add(bid);
        }
        allBlockedBy.add(partner.id);
      }
    }

    const isBlocked = selfAnalysis.isBlocked || isBlockedByLinkedGroup;

    return {
      ...selfAnalysis,
      isBlocked,
      blockedByArrowIds: Array.from(allBlockedBy),
      isBlockedByLinkedGroup,
      blockingPartnerId,
    };
  }

  return selfAnalysis;
}

/**
 * Check if arrows overlap at rest.
 * Distinguishes between valid layered intersections (different layers)
 * and illegal co-planar collisions (same layer).
 */
export function checkArrowOverlaps(arrows: Arrow[]): {
  hasOverlaps: boolean;
  overlaps: { arrow1Id: string; arrow2Id: string; point: Point; isLayered: boolean }[];
} {
  const pointMap = new Map<string, Arrow>();
  const overlaps: { arrow1Id: string; arrow2Id: string; point: Point; isLayered: boolean }[] = [];
  let hasIllegalOverlaps = false;

  for (const arrow of arrows) {
    const occupied = getArrowOccupiedPoints(arrow);
    for (const p of occupied) {
      const key = `${p.x},${p.y}`;
      if (pointMap.has(key)) {
        const other = pointMap.get(key)!;
        const layerOther = getEffectiveLayer(other, arrows);
        const layerCur = getEffectiveLayer(arrow, arrows);
        // If effective layers differ, one arrow is strictly on top of the other (Element 3)
        const isLayered = layerOther !== layerCur;

        overlaps.push({
          arrow1Id: other.id,
          arrow2Id: arrow.id,
          point: p,
          isLayered,
        });

        if (!isLayered) {
          hasIllegalOverlaps = true;
        }
      } else {
        pointMap.set(key, arrow);
      }
    }
  }

  return {
    hasOverlaps: hasIllegalOverlaps,
    overlaps,
  };
}

/**
 * Splits a two-headed arrow into two half-arrow polylines at its midpoint.
 * Forward half starts at midpoint and ends at original head (points[last]).
 * Reverse half starts at midpoint and ends at original tail (points[0]).
 */
export function splitDoubleHeadedArrow(arrow: Arrow): {
  forwardHalf: Arrow;
  reverseHalf: Arrow;
} {
  const track = arrow.points;
  const cumLengths = computePolylineLengths(track);
  const totalLen = cumLengths[cumLengths.length - 1];
  const midDist = totalLen / 2;

  // Forward half: from midDist to totalLen
  const forwardPoints = slicePolyline(track, cumLengths, midDist, totalLen);

  // Reverse half: along reversed track from midDist to totalLen
  const reversedTrack = [...track].reverse();
  const revCumLengths = computePolylineLengths(reversedTrack);
  const reversePoints = slicePolyline(reversedTrack, revCumLengths, midDist, totalLen);

  return {
    forwardHalf: {
      id: `${arrow.id}_fwd`,
      color: arrow.color,
      points: forwardPoints,
      layer: arrow.layer,
    },
    reverseHalf: {
      id: `${arrow.id}_rev`,
      color: arrow.color,
      points: reversePoints,
      layer: arrow.layer,
    },
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


import { Arrow, Direction, Level, StyleProfile } from '../types';
import { getHeadDirection, getArrowOccupiedPoints } from './geometry';
import { getColorId } from '../constants/colors';

/**
 * Counts actual orthogonal direction changes in an arrow's polyline
 */
export function countArrowTurns(arrow: Arrow): number {
  if (arrow.points.length <= 2) return 0;

  let turns = 0;
  for (let i = 0; i < arrow.points.length - 2; i++) {
    const p0 = arrow.points[i];
    const p1 = arrow.points[i + 1];
    const p2 = arrow.points[i + 2];

    const dx1 = Math.sign(p1.x - p0.x);
    const dy1 = Math.sign(p1.y - p0.y);
    const dx2 = Math.sign(p2.x - p1.x);
    const dy2 = Math.sign(p2.y - p1.y);

    if (dx1 !== dx2 || dy1 !== dy2) {
      turns++;
    }
  }

  return turns;
}

/**
 * Calculates total manhattan path length of an arrow
 */
export function getArrowPathLength(arrow: Arrow): number {
  let len = 0;
  for (let i = 0; i < arrow.points.length - 1; i++) {
    len += Math.abs(arrow.points[i + 1].x - arrow.points[i].x) +
           Math.abs(arrow.points[i + 1].y - arrow.points[i].y);
  }
  return len;
}

/**
 * Analyzes the layout design style of a level
 */
export function analyzeLevelStyle(level: Level): StyleProfile {
  const arrows = level.arrows;

  // Defaults if level has no arrows
  if (!arrows || arrows.length === 0) {
    return {
      sourceLevelId: level.id,
      sourceLevelName: level.name,
      arrowCount: 0,
      avgLength: 3,
      minLength: 2,
      maxLength: 5,
      turnComplexity: {
        straightRatio: 0.35,
        singleTurnRatio: 0.45,
        multiTurnRatio: 0.2,
      },
      directionDistribution: {
        UP: 0.25,
        DOWN: 0.25,
        LEFT: 0.25,
        RIGHT: 0.25,
      },
      colorPalette: [1, 2, 4],
      density: 0.4,
    };
  }

  let totalLength = 0;
  let minLen = Infinity;
  let maxLen = 0;

  let straightCount = 0;
  let singleTurnCount = 0;
  let multiTurnCount = 0;

  const dirCounts: Record<Direction, number> = {
    UP: 0,
    DOWN: 0,
    LEFT: 0,
    RIGHT: 0,
  };

  const colorFrequency = new Map<number, number>();
  const occupiedKeys = new Set<string>();

  for (const arrow of arrows) {
    const len = getArrowPathLength(arrow);
    totalLength += len;
    if (len < minLen) minLen = len;
    if (len > maxLen) maxLen = len;

    const turns = countArrowTurns(arrow);
    if (turns === 0) straightCount++;
    else if (turns === 1) singleTurnCount++;
    else multiTurnCount++;

    const dir = getHeadDirection(arrow);
    dirCounts[dir]++;

    const cid = getColorId(arrow.color);
    colorFrequency.set(cid, (colorFrequency.get(cid) || 0) + 1);

    const pts = getArrowOccupiedPoints(arrow);
    for (const p of pts) {
      occupiedKeys.add(`${p.x},${p.y}`);
    }
  }

  const total = arrows.length;

  // Calculate bounding box of occupied cells to get true cluster packing density
  let minOccX = Infinity, maxOccX = -Infinity, minOccY = Infinity, maxOccY = -Infinity;
  for (const k of occupiedKeys) {
    const [x, y] = k.split(',').map(Number);
    if (x < minOccX) minOccX = x;
    if (x > maxOccX) maxOccX = x;
    if (y < minOccY) minOccY = y;
    if (y > maxOccY) maxOccY = y;
  }

  const occBBoxCells =
    minOccX <= maxOccX && minOccY <= maxOccY
      ? (maxOccX - minOccX + 1) * (maxOccY - minOccY + 1)
      : level.gridSize.width * level.gridSize.height;

  const rawDensity = occupiedKeys.size / Math.max(1, occBBoxCells);
  const clusterDensity = Math.max(0.75, Math.min(0.95, Math.round(rawDensity * 100) / 100));

  // Sorted unique colors by frequency
  const sortedColors = Array.from(colorFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);

  return {
    sourceLevelId: level.id,
    sourceLevelName: level.name,
    arrowCount: total,
    avgLength: Math.round((totalLength / total) * 10) / 10,
    minLength: minLen === Infinity ? 2 : minLen,
    maxLength: maxLen === 0 ? 4 : maxLen,
    turnComplexity: {
      straightRatio: Math.round((straightCount / total) * 100) / 100,
      singleTurnRatio: Math.round((singleTurnCount / total) * 100) / 100,
      multiTurnRatio: Math.round((multiTurnCount / total) * 100) / 100,
    },
    directionDistribution: {
      UP: Math.round((dirCounts.UP / total) * 100) / 100,
      DOWN: Math.round((dirCounts.DOWN / total) * 100) / 100,
      LEFT: Math.round((dirCounts.LEFT / total) * 100) / 100,
      RIGHT: Math.round((dirCounts.RIGHT / total) * 100) / 100,
    },
    colorPalette: sortedColors.length > 0 ? sortedColors : [1, 2, 4],
    density: clusterDensity,
  };
}

/**
 * Formats a concise human-readable summary of the style profile
 */
export function formatStyleSummary(profile: StyleProfile): string {
  const parts: string[] = [];
  parts.push(`Avg Length: ${profile.avgLength}`);

  const complexities: string[] = [];
  if (profile.turnComplexity.straightRatio > 0.3) {
    complexities.push(`${Math.round(profile.turnComplexity.straightRatio * 100)}% Straight`);
  }
  if (profile.turnComplexity.singleTurnRatio > 0.3) {
    complexities.push(`${Math.round(profile.turnComplexity.singleTurnRatio * 100)}% L-Turns`);
  }
  if (profile.turnComplexity.multiTurnRatio > 0.2) {
    complexities.push(`${Math.round(profile.turnComplexity.multiTurnRatio * 100)}% Winding`);
  }
  if (complexities.length > 0) {
    parts.push(complexities.join(', '));
  }

  // Dominant exit directions
  const dominantDirs = (Object.entries(profile.directionDistribution) as [Direction, number][])
    .filter(([, ratio]) => ratio >= 0.25)
    .map(([dir]) => dir);
  if (dominantDirs.length > 0) {
    parts.push(`Exit: ${dominantDirs.join('/')}`);
  }

  return parts.join(' • ');
}

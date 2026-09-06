import { Arrow, Level, Point } from '../types';
import { getColorId } from '../constants/colors';

export interface ExportedLevel {
  id: string;
  name: string;
  gridSize: {
    width: number;
    height: number;
  };
  arrows: {
    id: string;
    color: number | string;
    points: { x: number; y: number }[];
  }[];
}

/**
 * Format a single level to strict minimal JSON containing only required parameters
 */
export function exportLevelToJson(level: Level): string {
  const minimalData: ExportedLevel = {
    id: level.id,
    name: level.name,
    gridSize: {
      width: level.gridSize.width,
      height: level.gridSize.height,
    },
    arrows: level.arrows.map((arrow) => ({
      id: arrow.id,
      color: typeof arrow.color === 'number' ? arrow.color : getColorId(arrow.color),
      points: arrow.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
    })),
  };

  return JSON.stringify(minimalData, null, 2);
}

/**
 * Format all levels to minimal JSON array
 */
export function exportAllLevelsToJson(levels: Level[]): string {
  const minimalList = levels.map((lvl) => ({
    id: lvl.id,
    name: lvl.name,
    gridSize: {
      width: lvl.gridSize.width,
      height: lvl.gridSize.height,
    },
    arrows: lvl.arrows.map((arrow) => ({
      id: arrow.id,
      color: typeof arrow.color === 'number' ? arrow.color : getColorId(arrow.color),
      points: arrow.points.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
    })),
  }));

  return JSON.stringify(minimalList, null, 2);
}

/**
 * Validate and parse a level JSON string
 */
export function importLevelFromJson(jsonString: string): {
  success: boolean;
  level?: Level;
  levels?: Level[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);

    // Check if it's an array of levels
    if (Array.isArray(parsed)) {
      const validatedLevels: Level[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        const valRes = validateSingleLevel(item, `Level at index ${i}`);
        if (!valRes.valid || !valRes.level) {
          return { success: false, error: valRes.error };
        }
        validatedLevels.push(valRes.level);
      }
      return { success: true, levels: validatedLevels };
    }

    // Single level
    const valRes = validateSingleLevel(parsed, 'Root');
    if (!valRes.valid || !valRes.level) {
      return { success: false, error: valRes.error };
    }

    return { success: true, level: valRes.level };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Invalid JSON syntax: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function validateSingleLevel(
  data: unknown,
  prefix: string
): { valid: boolean; level?: Level; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: `${prefix}: Must be a JSON object` };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== 'string' || !obj.id.trim()) {
    return { valid: false, error: `${prefix}: Missing or invalid "id" field` };
  }

  const name = typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : obj.id;

  if (!obj.gridSize || typeof obj.gridSize !== 'object') {
    return { valid: false, error: `${prefix}: Missing "gridSize" object` };
  }

  const grid = obj.gridSize as Record<string, unknown>;
  const width = Number(grid.width);
  const height = Number(grid.height);

  if (!Number.isInteger(width) || width < 3 || width > 30) {
    return { valid: false, error: `${prefix}: "gridSize.width" must be an integer between 3 and 30` };
  }
  if (!Number.isInteger(height) || height < 3 || height > 30) {
    return { valid: false, error: `${prefix}: "gridSize.height" must be an integer between 3 and 30` };
  }

  if (!Array.isArray(obj.arrows)) {
    return { valid: false, error: `${prefix}: "arrows" must be an array` };
  }

  const arrows: Arrow[] = [];
  for (let i = 0; i < obj.arrows.length; i++) {
    const rawArrow = obj.arrows[i];
    if (!rawArrow || typeof rawArrow !== 'object') {
      return { valid: false, error: `${prefix}: Arrow #${i + 1} must be an object` };
    }

    const arrowObj = rawArrow as Record<string, unknown>;
    const arrowId = typeof arrowObj.id === 'string' && arrowObj.id.trim() ? arrowObj.id : `arrow_${i + 1}`;
    let color: number | string = 1;
    if (typeof arrowObj.color === 'number' && arrowObj.color >= 0 && arrowObj.color <= 7) {
      color = arrowObj.color;
    } else if (typeof arrowObj.color === 'string' && arrowObj.color.trim()) {
      color = arrowObj.color.trim();
    }

    if (!Array.isArray(arrowObj.points) || arrowObj.points.length < 2) {
      return {
        valid: false,
        error: `${prefix}: Arrow "${arrowId}" must have a "points" array with at least 2 points`,
      };
    }

    const points: Point[] = [];
    for (let j = 0; j < arrowObj.points.length; j++) {
      const p = arrowObj.points[j] as Record<string, unknown>;
      if (!p || typeof p !== 'object') {
        return { valid: false, error: `${prefix}: Point #${j + 1} in arrow "${arrowId}" is invalid` };
      }
      const x = Number(p.x);
      const y = Number(p.y);
      if (isNaN(x) || isNaN(y)) {
        return { valid: false, error: `${prefix}: Coordinates in arrow "${arrowId}" must be numbers` };
      }
      points.push({ x: Math.round(x), y: Math.round(y) });
    }

    arrows.push({
      id: arrowId,
      color,
      points,
    });
  }

  return {
    valid: true,
    level: {
      id: obj.id as string,
      name,
      gridSize: { width, height },
      arrows,
    },
  };
}

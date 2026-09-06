export interface ColorDefinition {
  id: number;
  name: string;
  hex: string;
  border: string;
  bgLight: string;
}

export const COLOR_TYPES: ColorDefinition[] = [
  { id: 0, name: 'Red', hex: '#ef4444', border: '#dc2626', bgLight: '#fef2f2' },
  { id: 1, name: 'Blue', hex: '#3b82f6', border: '#2563eb', bgLight: '#eff6ff' },
  { id: 2, name: 'Green', hex: '#22c55e', border: '#16a34a', bgLight: '#f0fdf4' },
  { id: 3, name: 'Yellow', hex: '#eab308', border: '#ca8a04', bgLight: '#fefce8' },
  { id: 4, name: 'Pink', hex: '#ec4899', border: '#db2777', bgLight: '#fdf2f8' },
  { id: 5, name: 'Orange', hex: '#f97316', border: '#ea580c', bgLight: '#fff7ed' },
  { id: 6, name: 'Brown', hex: '#854d0e', border: '#713f12', bgLight: '#fefce8' },
  { id: 7, name: 'Cyan', hex: '#06b6d4', border: '#0891b2', bgLight: '#ecfeff' },
];

/**
 * Returns hex color string given a color ID (0..7) or existing hex string
 */
export function getColorHex(color: number | string | undefined): string {
  if (color === undefined) return COLOR_TYPES[1].hex; // default Blue

  if (typeof color === 'number') {
    const found = COLOR_TYPES.find((c) => c.id === color);
    return found ? found.hex : COLOR_TYPES[1].hex;
  }

  // If it's a numeric string e.g. "0", "1"
  const numeric = parseInt(color, 10);
  if (!isNaN(numeric) && numeric >= 0 && numeric <= 7) {
    return COLOR_TYPES[numeric].hex;
  }

  // If it's already a hex string, check if it matches one of the 8 types or return it
  const match = COLOR_TYPES.find((c) => c.hex.toLowerCase() === color.toLowerCase());
  if (match) return match.hex;

  // If it's purple (from previous version), map to Pink (#ec4899)
  if (color.toLowerCase().includes('8b5cf6') || color.toLowerCase().includes('a855f7')) {
    return COLOR_TYPES[4].hex; // Pink
  }

  return color;
}

/**
 * Returns color ID (0..7) for a given color
 */
export function getColorId(color: number | string | undefined): number {
  if (typeof color === 'number' && color >= 0 && color <= 7) {
    return color;
  }
  if (typeof color === 'string') {
    const numeric = parseInt(color, 10);
    if (!isNaN(numeric) && numeric >= 0 && numeric <= 7) {
      return numeric;
    }
    const match = COLOR_TYPES.find((c) => c.hex.toLowerCase() === color.toLowerCase());
    if (match) return match.id;
    if (color.toLowerCase().includes('8b5cf6') || color.toLowerCase().includes('a855f7')) {
      return 4; // Pink
    }
  }
  return 1; // Default Blue
}

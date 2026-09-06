import { solveLevel } from '../src/utils/solver';
import { checkArrowOverlaps, analyzeArrowExit, getArrowOccupiedPoints } from '../src/utils/geometry';
import { Arrow, Level, Point } from '../src/types';

export function analyzeFill(arrows: Arrow[], width: number, height: number) {
  const grid: string[][] = Array.from({ length: height }, () => Array(width).fill('  . '));
  let occupiedCount = 0;
  
  arrows.forEach((a, idx) => {
    const pts = getArrowOccupiedPoints(a);
    occupiedCount += pts.length;
    const head = a.points[a.points.length - 1];
    pts.forEach(p => {
      if (p.x >= 0 && p.x < width && p.y >= 0 && p.y < height) {
        const isHead = (p.x === head.x && p.y === head.y);
        grid[p.y][p.x] = isHead ? '>' + String(idx).padStart(2, '0') : ' ' + String(idx).padStart(2, '0') + ' ';
      }
    });
  });

  console.log('     ' + Array.from({ length: width }, (_, i) => String(i).padStart(3, ' ') + ' ').join(''));
  grid.forEach((row, y) => {
    console.log(String(y).padStart(3, ' ') + ': ' + row.join(''));
  });
  const total = width * height;
  const pct = Math.round((occupiedCount / total) * 100);
  console.log('Density: ' + occupiedCount + ' / ' + total + ' cells (' + pct + '%)');
}

export function testLevel(lvl: Level): boolean {
  console.log('\n=======================================================');
  console.log('LEVEL: ' + lvl.name + ' [' + lvl.gridSize.width + 'x' + lvl.gridSize.height + ']');
  console.log('Arrow Count: ' + lvl.arrows.length);
  analyzeFill(lvl.arrows, lvl.gridSize.width, lvl.gridSize.height);

  const overlap = checkArrowOverlaps(lvl.arrows);
  if (overlap.hasOverlaps) {
    console.error('? OVERLAPS DETECTED (' + overlap.overlaps.length + '):');
    overlap.overlaps.slice(0, 5).forEach(o => {
      console.error('  ' + o.arrow1Id + ' & ' + o.arrow2Id + ' at (' + o.point.x + ', ' + o.point.y + ')');
    });
    return false;
  }
  console.log('? 0 Resting Overlaps');

  const sol = solveLevel(lvl.arrows, lvl.gridSize);
  if (sol.isSolvable) {
    console.log('?? 100% SOLVABLE in ' + sol.stepOrder.length + ' steps');
    console.log('Order: ' + sol.stepOrder.join(' -> '));
    return true;
  } else {
    console.error('? UNSOLVABLE: ' + sol.deadlockedArrowIds.join(', '));
    return false;
  }
}

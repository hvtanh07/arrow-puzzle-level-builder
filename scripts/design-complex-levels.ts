import { solveLevel } from '../src/utils/solver';
import { checkArrowOverlaps, analyzeArrowExit, getPointsOnSegment } from '../src/utils/geometry';
import { Arrow, Level, Point } from '../src/types';

export function printGrid(arrows: Arrow[], width: number, height: number) {
  const grid: string[][] = Array.from({ length: height }, () => Array(width).fill(' . '));
  arrows.forEach((a, idx) => {
    const symbol = String(idx).padStart(2, ' ') + ' ';
    for (let i = 0; i < a.points.length - 1; i++) {
      const seg = getPointsOnSegment(a.points[i], a.points[i + 1]);
      seg.forEach(p => {
        if (p.x >= 0 && p.x < width && p.y >= 0 && p.y < height) {
          grid[p.y][p.x] = symbol;
        }
      });
    }
  });
  console.log('    ' + Array.from({ length: width }, (_, i) => String(i).padStart(2, ' ') + ' ').join(''));
  grid.forEach((row, y) => {
    console.log(String(y).padStart(2, ' ') + ': ' + row.join(''));
  });
}

export function testAndReport(lvl: Level) {
  console.log('\n==================================================');
  console.log('LEVEL: ' + lvl.name + ' (' + lvl.gridSize.width + 'x' + lvl.gridSize.height + ')');
  console.log('Arrows: ' + lvl.arrows.length);
  printGrid(lvl.arrows, lvl.gridSize.width, lvl.gridSize.height);
  const overlap = checkArrowOverlaps(lvl.arrows);
  if (overlap.hasOverlaps) {
    console.error('? OVERLAPS:', overlap.overlaps);
    return false;
  }
  console.log('? 0 Overlaps');
  const sol = solveLevel(lvl.arrows, lvl.gridSize);
  if (sol.isSolvable) {
    console.log('? 100% SOLVABLE in ' + sol.stepOrder.length + ' steps');
    console.log('Order: ' + sol.stepOrder.join(' -> '));
    return true;
  } else {
    console.error('? DEADLOCKED:', sol.deadlockedArrowIds);
    return false;
  }
}

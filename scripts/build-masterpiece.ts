import { solveLevel } from '../src/utils/solver';
import { checkArrowOverlaps, analyzeArrowExit, getArrowOccupiedPoints } from '../src/utils/geometry';
import { Arrow, Level, Point } from '../src/types';

export function printAscii(arrows: Arrow[], width: number, height: number) {
  const grid: string[][] = Array.from({ length: height }, () => Array(width).fill('  . '));
  
  arrows.forEach((a, idx) => {
    const pts = getArrowOccupiedPoints(a);
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
  console.log('Arrow Index Map:');
  arrows.forEach((a, idx) => console.log('  [' + String(idx).padStart(2, '0') + '] ' + a.id + ' (color ' + a.color + ', ' + a.points.length + ' pts)'));
}

export function validateLevel(lvl: Level): boolean {
  console.log('\n=======================================================');
  console.log('LEVEL: ' + lvl.name + ' [' + lvl.gridSize.width + 'x' + lvl.gridSize.height + ']');
  console.log('Arrow Count: ' + lvl.arrows.length);
  printAscii(lvl.arrows, lvl.gridSize.width, lvl.gridSize.height);

  const overlap = checkArrowOverlaps(lvl.arrows);
  if (overlap.hasOverlaps) {
    console.error('? OVERLAPS DETECTED (' + overlap.overlaps.length + '):');
    overlap.overlaps.slice(0, 10).forEach(o => {
      console.error('  Overlap between ' + o.arrow1Id + ' and ' + o.arrow2Id + ' at (' + o.point.x + ', ' + o.point.y + ')');
    });
    return false;
  }
  console.log('? 0 Resting Overlaps');

  const sol = solveLevel(lvl.arrows, lvl.gridSize);
  if (sol.isSolvable) {
    console.log('?? 100% SOLVABLE in ' + sol.stepOrder.length + ' steps!');
    let remaining = [...lvl.arrows];
    const branch: number[] = [];
    while (remaining.length > 0) {
      const free = remaining.filter(a => !analyzeArrowExit(a, remaining, lvl.gridSize).isBlocked);
      branch.push(free.length);
      if (free.length === 0) break;
      remaining = remaining.filter(a => a.id !== free[0].id);
    }
    console.log('Branching profile: [' + branch.join(', ') + ']');
    console.log('Solution Order: ' + sol.stepOrder.join(' -> '));
    return true;
  } else {
    console.error('? UNSOLVABLE / DEADLOCKED!');
    console.error('Stuck arrows: ' + sol.deadlockedArrowIds.join(', '));
    console.error('Blocking graph:');
    Object.entries(sol.blockingGraph).forEach(([id, blockers]) => {
      console.error('  ' + id + ' blocked by: ' + blockers.join(', '));
    });
    return false;
  }
}

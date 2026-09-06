// Test script for levels and solver
import { PREMADE_LEVELS } from '../src/data/premadeLevels.ts';
import { solveLevel } from '../src/utils/solver.ts';

console.log(`Checking ${PREMADE_LEVELS.length} premade levels...`);

let allPassed = true;
for (const level of PREMADE_LEVELS) {
  const result = solveLevel(level.arrows, level.gridSize);
  if (!result.isSolvable) {
    console.error(`❌ ${level.name} FAILED: ${result.message}`);
    allPassed = false;
  } else if (result.hasOverlaps) {
    console.warn(`⚠️ ${level.name} HAS OVERLAPS: ${result.overlaps.length} overlaps found`);
    allPassed = false;
  } else {
    console.log(`✅ ${level.name} PASSED: Solved in ${result.stepOrder.length} steps: ${result.stepOrder.join(' -> ')}`);
  }
}

if (allPassed) {
  console.log('\n🎉 ALL 10 PREMADE LEVELS ARE 100% SOLVABLE WITHOUT OVERLAPS!');
} else {
  process.exit(1);
}

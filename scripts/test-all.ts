import { PREMADE_LEVELS } from '../src/data/premadeLevels';
import { solveLevel } from '../src/utils/solver';
import { exportLevelToJson, exportAllLevelsToJson, importLevelFromJson } from '../src/utils/jsonHandler';
import { Arrow, GridSize } from '../src/types';

console.log('🧪 RUNNING COMPLETE VERIFICATION TEST SUITE...\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ ${msg}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failCount++;
  }
}

// 1. Check all 10 premade levels
console.log('Test 1: Premade Levels Solvability');
assert(PREMADE_LEVELS.length === 10, 'Exactly 10 premade levels exist');

for (const level of PREMADE_LEVELS) {
  const result = solveLevel(level.arrows, level.gridSize);
  assert(
    result.isSolvable && !result.hasOverlaps,
    `${level.name} is solvable (${result.stepOrder.length} steps, 0 overlaps)`
  );
}

// 2. Specific verification for Level 9 (Screenshot stage)
console.log('\nTest 2: Screenshot Stage (Level 9) Verification');
const lvl9 = PREMADE_LEVELS.find((l) => l.id === 'level-9')!;
assert(!!lvl9, 'Level 9 exists');
assert(lvl9.arrows.length === 6, 'Level 9 has exactly 6 arrows as in screenshot');
assert(lvl9.gridSize.width === 8 && lvl9.gridSize.height === 9, 'Level 9 grid is 8x9');
const lvl9Sol = solveLevel(lvl9.arrows, lvl9.gridSize);
assert(lvl9Sol.isSolvable, 'Level 9 is solvable');
assert(lvl9Sol.stepOrder.length === 6, 'Level 9 requires all 6 arrows to escape');
// Check that purple or blue_s is first
assert(
  lvl9Sol.stepOrder[0] === 'purple_outer' || lvl9Sol.stepOrder[0] === 'blue_s',
  `First escape is ${lvl9Sol.stepOrder[0]}`
);

// 3. Test Deadlock Detection on circular cycle
console.log('\nTest 3: Deadlock Detection');
const cycleArrows: Arrow[] = [
  { id: 'top', color: '#38bdf8', points: [{ x: 1, y: 1 }, { x: 4, y: 1 }] }, // points RIGHT into right arrow
  { id: 'right', color: '#38bdf8', points: [{ x: 5, y: 1 }, { x: 5, y: 4 }] }, // points DOWN into bottom arrow
  { id: 'bottom', color: '#38bdf8', points: [{ x: 5, y: 5 }, { x: 2, y: 5 }] }, // points LEFT into left arrow
  { id: 'left', color: '#38bdf8', points: [{ x: 1, y: 5 }, { x: 1, y: 2 }] }, // points UP into top arrow
];
const cycleResult = solveLevel(cycleArrows, { width: 7, height: 7 });
assert(!cycleResult.isSolvable, 'Cycle of 4 arrows is detected as UNSOLVABLE');
assert(cycleResult.deadlockedArrowIds.length === 4, 'All 4 arrows are marked as deadlocked');

// 4. Test JSON Export & Import (Minimal Format Requirement)
console.log('\nTest 4: JSON Export & Import Minimal Format');
const exportedLvl9 = exportLevelToJson(lvl9);
const parsedLvl9Obj = JSON.parse(exportedLvl9);

const expectedKeys = ['id', 'name', 'gridSize', 'arrows'];
const actualKeys = Object.keys(parsedLvl9Obj);
assert(
  JSON.stringify(actualKeys.sort()) === JSON.stringify(expectedKeys.sort()),
  `JSON contains ONLY required level parameters: [${actualKeys.join(', ')}]`
);

const arrowKeys = Object.keys(parsedLvl9Obj.arrows[0]);
const expectedArrowKeys = ['id', 'color', 'points'];
assert(
  JSON.stringify(arrowKeys.sort()) === JSON.stringify(expectedArrowKeys.sort()),
  `Arrow object contains ONLY required parameters: [${arrowKeys.join(', ')}]`
);

// Test Roundtrip Import
const importResult = importLevelFromJson(exportedLvl9);
assert(importResult.success && !!importResult.level, 'Level imports successfully from minimal JSON');
assert(importResult.level?.arrows.length === 6, 'Imported level retains all 6 arrows');
const rechecked = solveLevel(importResult.level!.arrows, importResult.level!.gridSize);
assert(rechecked.isSolvable, 'Imported level remains solvable');

// Test All Levels Export & Import
const allJson = exportAllLevelsToJson(PREMADE_LEVELS);
const allImportResult = importLevelFromJson(allJson);
assert(
  allImportResult.success && allImportResult.levels?.length === 10,
  'All 10 levels export and import cleanly in bulk pack'
);

// 5. Test Invalid JSON rejection
console.log('\nTest 5: Error Handling for Malformed JSON');
assert(!importLevelFromJson('{ invalid: json').success, 'Rejects invalid syntax JSON');
assert(!importLevelFromJson('{"id": "test"}').success, 'Rejects JSON missing gridSize and arrows');
assert(
  !importLevelFromJson('{"id": "test", "gridSize": {"width": 1, "height": 1}, "arrows": []}').success,
  'Rejects invalid grid dimensions'
);

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================`);

if (failCount > 0) {
  process.exit(1);
}

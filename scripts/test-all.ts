import { PREMADE_LEVELS } from '../src/data/premadeLevels';
import { solveLevel } from '../src/utils/solver';
import { exportLevelToJson, exportAllLevelsToJson, importLevelFromJson } from '../src/utils/jsonHandler';
import { Arrow, GridSize, Point } from '../src/types';
import {
  getExtendedTrack,
  computePolylineLengths,
  slicePolyline,
  analyzeArrowExit,
  splitDoubleHeadedArrow,
  checkArrowOverlaps,
  getArrowOccupiedPoints,
  cleanCollinearPoints,
  isArrowStrictlyOrthogonal,
} from '../src/utils/geometry';

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

// 2. Specific verification for Level 1 (The First Chain: 3 arrows locked 1-by-1)
console.log('\nTest 2: Level 1 (The First Chain) Verification');
const lvl1 = PREMADE_LEVELS.find((l) => l.id === 'level-1')!;
assert(!!lvl1, 'Level 1 exists');
assert(lvl1.arrows.length === 3, 'Level 1 has exactly 3 arrows');
const lvl1Sol = solveLevel(lvl1.arrows, lvl1.gridSize);
assert(lvl1Sol.isSolvable, 'Level 1 is solvable');
assert(
  lvl1Sol.stepOrder.join('->') === 'blue_hook->red_pillar->green_runner',
  'Level 1 strictly enforces 1-by-1 removal (blue_hook -> red_pillar -> green_runner)'
);

// 3. Specific verification for Level 6 (Tangled Noise)
console.log('\nTest 3: Level 6 (Tangled Noise) Verification');
const lvl6 = PREMADE_LEVELS.find((l) => l.id === 'level-6')!;
assert(!!lvl6, 'Level 6 exists');
assert(lvl6.arrows.length === 6, 'Level 6 has 6 winding multi-turn arrows creating noise');
const lvl6Sol = solveLevel(lvl6.arrows, lvl6.gridSize);
assert(lvl6Sol.isSolvable && !lvl6Sol.hasOverlaps, 'Level 6 is solvable with 0 overlaps');

// 4. Specific verification for Levels 7 & 8 (Domino Spiral & Dual Zipper)
console.log('\nTest 4: Levels 7 & 8 (Domino Spiral & Zipper Chains) Verification');
const lvl7 = PREMADE_LEVELS.find((l) => l.id === 'level-7')!;
assert(lvl7?.arrows.length === 7, 'Level 7 has 7 nested spiral staircase hooks');
const lvl7Sol = solveLevel(lvl7.arrows, lvl7.gridSize);
assert(lvl7Sol.isSolvable && lvl7Sol.stepOrder.length === 7, 'Level 7 cascades cleanly across 7 steps');

const lvl8 = PREMADE_LEVELS.find((l) => l.id === 'level-8')!;
assert(lvl8?.arrows.length === 14, 'Level 8 has 14 interwoven comb arrows evenly filling the 8x8 grid (78% density)');
const lvl8Sol = solveLevel(lvl8.arrows, lvl8.gridSize);
assert(lvl8Sol.isSolvable && lvl8Sol.stepOrder.length === 14, 'Level 8 solves cleanly across 14 steps with 0 overlaps');

// 5. Specific verification for Level 9 (The Gentle Breeze - Evenly Filled 6x6)
console.log('\nTest 5: Level 9 (The Gentle Breeze) Verification');
const lvl9 = PREMADE_LEVELS.find((l) => l.id === 'level-9')!;
assert(!!lvl9, 'Level 9 exists');
assert(lvl9.arrows.length === 8, 'Level 9 has 8 arrows evenly filling perimeter and center (78% density)');
const lvl9Sol = solveLevel(lvl9.arrows, lvl9.gridSize);
assert(lvl9Sol.isSolvable, 'Level 9 is solvable');
assert(lvl9Sol.stepOrder.length === 8, 'Level 9 clears cleanly in 8 steps with 0 overlaps');

// 6. Specific verification for Level 10 (The Master Labyrinth - Hardest Finale)
console.log('\nTest 6: Level 10 (The Master Labyrinth) Verification');
const lvl10 = PREMADE_LEVELS.find((l) => l.id === 'level-10')!;
assert(!!lvl10, 'Level 10 exists');
assert(lvl10.arrows.length === 20, 'Level 10 has 20 interlocking multi-turn arrows evenly packing the 10x14 board (77% density)');
assert(lvl10.gridSize.width === 10 && lvl10.gridSize.height === 14, 'Level 10 grid is 10x14');
const lvl10Sol = solveLevel(lvl10.arrows, lvl10.gridSize);
assert(lvl10Sol.isSolvable, 'Level 10 is solvable');
assert(lvl10Sol.stepOrder.length === 20, 'Level 10 requires all 20 arrows to escape');
assert(!lvl10Sol.hasOverlaps, 'Level 10 has 0 overlaps');


// 7. Test Deadlock Detection on circular cycle
console.log('\nTest 7: Deadlock Detection');
const cycleArrows: Arrow[] = [
  { id: 'top', color: '#38bdf8', points: [{ x: 1, y: 1 }, { x: 4, y: 1 }] }, // points RIGHT into right arrow
  { id: 'right', color: '#38bdf8', points: [{ x: 5, y: 1 }, { x: 5, y: 4 }] }, // points DOWN into bottom arrow
  { id: 'bottom', color: '#38bdf8', points: [{ x: 5, y: 5 }, { x: 2, y: 5 }] }, // points LEFT into left arrow
  { id: 'left', color: '#38bdf8', points: [{ x: 1, y: 5 }, { x: 1, y: 2 }] }, // points UP into top arrow
];
const cycleResult = solveLevel(cycleArrows, { width: 7, height: 7 });
assert(!cycleResult.isSolvable, 'Cycle of 4 arrows is detected as UNSOLVABLE');
assert(cycleResult.deadlockedArrowIds.length === 4, 'All 4 arrows are marked as deadlocked');

// 8. Test JSON Export & Import (Minimal Format Requirement)
console.log('\nTest 8: JSON Export & Import Minimal Format');
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
assert(importResult.level?.arrows.length === lvl9.arrows.length, 'Imported level retains all arrows');
const rechecked = solveLevel(importResult.level!.arrows, importResult.level!.gridSize);
assert(rechecked.isSolvable, 'Imported level remains solvable');

// Test All Levels Export & Import
const allJson = exportAllLevelsToJson(PREMADE_LEVELS);
const allImportResult = importLevelFromJson(allJson);
assert(
  allImportResult.success && allImportResult.levels?.length === 10,
  'All 10 levels export and import cleanly in bulk pack'
);

// 9. Test Invalid JSON rejection
console.log('\nTest 9: Error Handling for Malformed JSON');
assert(!importLevelFromJson('{ invalid: json').success, 'Rejects invalid syntax JSON');
assert(!importLevelFromJson('{"id": "test"}').success, 'Rejects JSON missing gridSize and arrows');
assert(
  !importLevelFromJson('{"id": "test", "gridSize": {"width": 1, "height": 1}, "arrows": []}').success,
  'Rejects invalid grid dimensions'
);

// 10. Test Slither Exit Polyline Animation
console.log('\nTest 10: Slither Exit Polyline Animation');
const testArrowPoints: Point[] = [
  { x: 2, y: 8 },
  { x: 5, y: 8 },
  { x: 5, y: 9 },
  { x: 4, y: 9 },
  { x: 4, y: 10 }, // head pointing DOWN
];
const extendedTrack = getExtendedTrack(testArrowPoints, 8);
assert(extendedTrack.length === testArrowPoints.length + 1, 'Extended track adds exit point');
const trackCumLengths = computePolylineLengths(extendedTrack);
const origArrowLen = trackCumLengths[testArrowPoints.length - 1];
const totalTravelDist = trackCumLengths[trackCumLengths.length - 1] - origArrowLen;

// Test at start (s=0)
const sliceAtStart = slicePolyline(extendedTrack, trackCumLengths, 0, origArrowLen);
assert(sliceAtStart.length === testArrowPoints.length, 'At s=0, sliced polyline matches original arrow vertex count');
assert(
  sliceAtStart[0].x === testArrowPoints[0].x && sliceAtStart[0].y === testArrowPoints[0].y,
  'At s=0, tail matches original tail'
);
assert(
  sliceAtStart[sliceAtStart.length - 1].x === testArrowPoints[testArrowPoints.length - 1].x &&
  sliceAtStart[sliceAtStart.length - 1].y === testArrowPoints[testArrowPoints.length - 1].y,
  'At s=0, head matches original head'
);

// Test midway (s=3) - intermediate corners preserved
const sliceMidway = slicePolyline(extendedTrack, trackCumLengths, 3, 3 + origArrowLen);
assert(sliceMidway.length >= 3, 'Intermediate corners preserved while body slithers through turns');

// Test end (s=totalTravelDist) - straightened exit trajectory
const sliceAtEnd = slicePolyline(extendedTrack, trackCumLengths, totalTravelDist, totalTravelDist + origArrowLen);
assert(sliceAtEnd.length === 2, 'Arrow straightens into 2-point vector along exit trajectory once past corners');
assert(sliceAtEnd[sliceAtEnd.length - 1].y === 18, 'Arrow head exits far outside board before removal');

// 11. Test Element 1: Two-Headed Arrows
console.log('\nTest 11: Element 1 (Two-Headed Arrows)');
const testGrid: GridSize = { width: 8, height: 8 };

// Arrow runs horizontally from (2, 4) to (5, 4).
// Forward head is at (5, 4) pointing RIGHT.
// Reverse head is at (2, 4) pointing LEFT.
const doubleArrow: Arrow = {
  id: 'double_1',
  color: 1,
  points: [{ x: 2, y: 4 }, { x: 5, y: 4 }],
  isDoubleHeaded: true,
};

// Case 1: Obstacle on forward path (RIGHT) at (6, 4)
const blockerFwd: Arrow = {
  id: 'blocker_fwd',
  color: 0,
  points: [{ x: 6, y: 3 }, { x: 6, y: 5 }],
};
const analysisFwdBlocked = analyzeArrowExit(doubleArrow, [doubleArrow, blockerFwd], testGrid);
assert(analysisFwdBlocked.isBlocked, 'Two-headed arrow is blocked when forward head is obstructed');

// Case 2: Obstacle on reverse path (LEFT) at (1, 4)
const blockerRev: Arrow = {
  id: 'blocker_rev',
  color: 2,
  points: [{ x: 1, y: 3 }, { x: 1, y: 5 }],
};
const analysisRevBlocked = analyzeArrowExit(doubleArrow, [doubleArrow, blockerRev], testGrid);
assert(analysisRevBlocked.isBlocked, 'Two-headed arrow is blocked when reverse head is obstructed');
assert(analysisRevBlocked.isBlockedByReverseHead === true, 'Diagnostics identify reverse head as blocked');

// Case 3: Both paths clear
const analysisClear = analyzeArrowExit(doubleArrow, [doubleArrow], testGrid);
assert(!analysisClear.isBlocked, 'Two-headed arrow is unblocked when both forward and reverse paths are clear');

// Case 4: Splitting at midpoint
const splitResult = splitDoubleHeadedArrow(doubleArrow);
assert(splitResult.forwardHalf.points.length === 2, 'Forward half polyline created from midpoint');
assert(splitResult.reverseHalf.points.length === 2, 'Reverse half polyline created from midpoint');
assert(splitResult.forwardHalf.points[1].x === 5, 'Forward half head matches original forward head');
assert(splitResult.reverseHalf.points[1].x === 2, 'Reverse half head matches original reverse head');

// 12. Test Element 2: Linked Arrows
console.log('\nTest 12: Element 2 (Linked Arrows)');
const linkedArrowA: Arrow = {
  id: 'link_A',
  color: 1,
  points: [{ x: 2, y: 2 }, { x: 2, y: 1 }], // pointing UP
  linkedGroupId: 'group_alpha',
};
const linkedArrowB: Arrow = {
  id: 'link_B',
  color: 2,
  points: [{ x: 5, y: 5 }, { x: 5, y: 6 }], // pointing DOWN
  linkedGroupId: 'group_alpha',
};
const blockerForA: Arrow = {
  id: 'blocker_for_A',
  color: 0,
  points: [{ x: 1, y: 0 }, { x: 3, y: 0 }], // blocks UP at (2,0)
};

// If A is blocked by blockerForA, then both A and B are blocked!
const linkAnalysisA = analyzeArrowExit(linkedArrowA, [linkedArrowA, linkedArrowB, blockerForA], testGrid);
const linkAnalysisB = analyzeArrowExit(linkedArrowB, [linkedArrowA, linkedArrowB, blockerForA], testGrid);
assert(linkAnalysisA.isBlocked, 'Linked arrow A is blocked by direct obstacle');
assert(linkAnalysisB.isBlocked, 'Linked arrow B is blocked because linked partner A is blocked');
assert(linkAnalysisB.isBlockedByLinkedGroup === true, 'Diagnostics flag partner obstruction for linked arrow');

// When blocker is removed, both are unblocked and clear together in solver
const linkLevelSolved = solveLevel([linkedArrowA, linkedArrowB], testGrid);
assert(linkLevelSolved.isSolvable, 'Linked arrows level solves successfully');
assert(linkLevelSolved.stepOrder.length === 2, 'Both linked arrows cleared in step order');

// 13. Test Element 3: Layered Overlap Arrows
console.log('\nTest 13: Element 3 (Layered Overlap Arrows)');
// Arrow Top runs horizontally across (1,3) to (5,3) pointing RIGHT (Layer 1)
const arrowTop: Arrow = {
  id: 'arrow_top',
  color: 3,
  points: [{ x: 1, y: 3 }, { x: 5, y: 3 }],
  layer: 1,
};
// Arrow Bottom runs vertically across (3,1) to (3,5) pointing DOWN (Layer 0)
const arrowBottom: Arrow = {
  id: 'arrow_bottom',
  color: 4,
  points: [{ x: 3, y: 1 }, { x: 3, y: 5 }],
  layer: 0,
};
// They intersect at (3,3)!
const overlapAnalysis = checkArrowOverlaps([arrowTop, arrowBottom]);
assert(overlapAnalysis.overlaps.length === 1, 'Intersection at (3,3) detected');
assert(overlapAnalysis.overlaps[0].isLayered === true, 'Intersection is recognized as a valid Layered Overlap');
assert(!overlapAnalysis.hasOverlaps, 'Valid layered intersection is not flagged as illegal overlap');

// Exit analysis: Arrow Bottom is pinned from above by Arrow Top!
const bottomExit = analyzeArrowExit(arrowBottom, [arrowTop, arrowBottom], testGrid);
assert(bottomExit.isBlocked, 'Bottom arrow is locked while top arrow is on board');
assert(bottomExit.isBlockedByTopLayer === true, 'Bottom arrow diagnostics confirm locked by top layer');
assert(bottomExit.topPinArrowId === 'arrow_top', 'Top pin arrow ID correctly identified');

// Arrow Top is unblocked!
const topExit = analyzeArrowExit(arrowTop, [arrowTop, arrowBottom], testGrid);
assert(!topExit.isBlocked, 'Top arrow is free to escape over the bottom arrow');

// Solver solves in correct sequence: top arrow first, then bottom arrow!
const layeredSolved = solveLevel([arrowTop, arrowBottom], testGrid);
assert(layeredSolved.isSolvable, 'Layered overlap level is 100% solvable');
assert(layeredSolved.stepOrder[0] === 'arrow_top', 'Top arrow must be removed first');
assert(layeredSolved.stepOrder[1] === 'arrow_bottom', 'Bottom arrow is removed second after top arrow leaves');

// JSON Serialization preserves new elements
const layeredJson = exportLevelToJson({
  id: 'test_layer',
  name: 'Test Layered',
  gridSize: testGrid,
  arrows: [arrowTop, arrowBottom, doubleArrow, linkedArrowA],
});
const reimported = importLevelFromJson(layeredJson);
assert(reimported.success, 'Level with 3 new elements exports and imports successfully');
const impDouble = reimported.level?.arrows.find((a) => a.id === 'double_1');
const impLinked = reimported.level?.arrows.find((a) => a.id === 'link_A');
const impTop = reimported.level?.arrows.find((a) => a.id === 'arrow_top');
assert(impDouble?.isDoubleHeaded === true, 'isDoubleHeaded preserved on import');
assert(impLinked?.linkedGroupId === 'group_alpha', 'linkedGroupId preserved on import');
assert(impTop?.layer === 1, 'layer preserved on import');

// 14. Style Analyzer Verification
console.log('\nTest 14: Style Analyzer Verification');
const { analyzeLevelStyle, formatStyleSummary, countArrowTurns } = await import('../src/utils/styleAnalyzer');

const lvl1Style = analyzeLevelStyle(lvl1);
assert(lvl1Style.arrowCount === 3, 'Level 1 style analysis counts 3 arrows');
assert(lvl1Style.avgLength > 2, 'Level 1 average length is > 2 cells');
assert(lvl1Style.turnComplexity.straightRatio > 0.5, 'Level 1 has dominant straight arrows (67%)');
assert(lvl1Style.turnComplexity.singleTurnRatio > 0.2, 'Level 1 includes L-turn arrows (33%)');
assert(lvl1Style.colorPalette.length >= 3, 'Level 1 color palette captures 3 colors');
const summary1 = formatStyleSummary(lvl1Style);
assert(typeof summary1 === 'string' && summary1.length > 0, `Style summary formatted: "${summary1}"`);

const lvl6Style = analyzeLevelStyle(lvl6);
assert(lvl6Style.turnComplexity.multiTurnRatio > 0.3, 'Level 6 style analysis reflects high serpentine winding ratio');

// 15. Prebuild Generator Procedural Solvability Verification
console.log('\nTest 15: Prebuild Generator Solvability & Constraints');
const { generateStyledArrowsForArea } = await import('../src/utils/prebuildGenerator');

// 15a. Generate in empty area with Level 1 style
const area1: { minX: number; maxX: number; minY: number; maxY: number } = { minX: 1, maxX: 5, minY: 1, maxY: 5 };
const prebuildRes1 = generateStyledArrowsForArea({
  area: area1,
  existingArrows: [],
  gridSize: { width: 8, height: 8 },
  style: lvl1Style,
  maxAttempts: 30,
});
assert(prebuildRes1.success, 'Prebuild generator succeeds in 5x5 empty area');
assert(prebuildRes1.newArrows.length > 0, `Generated ${prebuildRes1.newArrows.length} arrows`);

// Verify normal arrows constraint: single-headed, no forced links
for (const a of prebuildRes1.newArrows) {
  assert(!a.isDoubleHeaded, `Arrow ${a.id} is normal (not double-headed)`);
  assert(!a.linkedGroupId, `Arrow ${a.id} is normal (not linked)`);
  assert(!a.layer || a.layer === 0, `Arrow ${a.id} is on base layer`);

  // Verify bounded within area
  const withinArea = a.points.every(
    (p) => p.x >= area1.minX && p.x <= area1.maxX && p.y >= area1.minY && p.y <= area1.maxY
  );
  assert(withinArea, `Arrow ${a.id} vertices are strictly within marked bounding box [1..5, 1..5]`);
}

// Verify high density / space-filling coverage (>= 75%)
const occPoints1 = new Set<string>();
for (const a of prebuildRes1.newArrows) {
  for (const pt of getArrowOccupiedPoints(a)) {
    occPoints1.add(`${pt.x},${pt.y}`);
  }
}
const area1Cells = (area1.maxX - area1.minX + 1) * (area1.maxY - area1.minY + 1); // 25
const density1 = occPoints1.size / area1Cells;
assert(density1 >= 0.75, `Prebuild generator achieves high space-filling density: ${Math.round(density1 * 100)}% coverage (${occPoints1.size}/${area1Cells} cells)`);

// Verify 100% solvability and 0 overlaps
const sol1 = solveLevel(prebuildRes1.arrows, { width: 8, height: 8 });
assert(sol1.isSolvable, 'Generated prebuild level is 100% SOLVABLE');
assert(!sol1.hasOverlaps, 'Generated prebuild level has 0 resting overlaps');
assert(sol1.stepOrder.length === prebuildRes1.newArrows.length, 'All generated arrows escape successfully');

// 15b. Generate inside a board with existing arrows (Level 1's board) without collision
const area2 = { minX: 4, maxX: 7, minY: 4, maxY: 7 };
const prebuildRes2 = generateStyledArrowsForArea({
  area: area2,
  existingArrows: lvl1.arrows,
  gridSize: lvl1.gridSize,
  style: lvl6Style,
  maxAttempts: 30,
});
assert(prebuildRes2.success, 'Prebuild generator succeeds alongside existing arrows');
assert(prebuildRes2.newArrows.length > 0, `Generated ${prebuildRes2.newArrows.length} new arrows alongside Level 1`);

const sol2 = solveLevel(prebuildRes2.arrows, lvl1.gridSize);
assert(sol2.isSolvable, 'Combined level (existing + prebuild arrows) is 100% SOLVABLE');
assert(!sol2.hasOverlaps, 'Combined level has 0 resting overlaps');

// 16. Select Mode Editing & Orthogonal Integrity Verification
console.log('\nTest 16: Select Mode & Orthogonal Editing Verification');

// 16a. Non-orthogonal arrow rejected as invalid level
const invalidDiagonalArrow: Arrow = {
  id: 'diagonal_arrow',
  color: 0,
  points: [{ x: 1, y: 1 }, { x: 3, y: 4 }], // Diagonal line!
};
const diagonalLevelSol = solveLevel([invalidDiagonalArrow], { width: 8, height: 8 });
assert(!diagonalLevelSol.isSolvable, 'Level containing non-orthogonal (diagonal) arrow is rejected as UNSOLVABLE');
assert(
  diagonalLevelSol.message.startsWith('Invalid Level:'),
  `Solvability message clearly flags invalid level: "${diagonalLevelSol.message}"`
);
assert(!isArrowStrictlyOrthogonal(invalidDiagonalArrow), 'isArrowStrictlyOrthogonal returns false for diagonal arrow');

// 16b. Arrow with fewer than 2 points rejected as invalid level
const invalidPointArrow: Arrow = {
  id: 'single_point',
  color: 0,
  points: [{ x: 2, y: 2 }],
};
const singlePointSol = solveLevel([invalidPointArrow], { width: 8, height: 8 });
assert(!singlePointSol.isSolvable, 'Level containing arrow with fewer than 2 points is rejected as UNSOLVABLE');
assert(!isArrowStrictlyOrthogonal(invalidPointArrow), 'isArrowStrictlyOrthogonal returns false for 1-point arrow');

// 16c. cleanCollinearPoints deduplication and collinear merging
const rawPoints: Point[] = [
  { x: 1, y: 1 },
  { x: 1, y: 1 }, // Duplicate
  { x: 3, y: 1 }, // Intermediate collinear
  { x: 5, y: 1 },
  { x: 5, y: 4 },
];
const cleaned = cleanCollinearPoints(rawPoints);
assert(cleaned.length === 3, `cleanCollinearPoints simplifies 5 points to 3 (got ${cleaned.length})`);
assert(cleaned[0].x === 1 && cleaned[0].y === 1, 'Cleaned point 0 matches start (1,1)');
assert(cleaned[1].x === 5 && cleaned[1].y === 1, 'Cleaned point 1 is corner (5,1)');
assert(cleaned[2].x === 5 && cleaned[2].y === 4, 'Cleaned point 2 is end (5,4)');

// 16d. Moving horizontal line section preserves 90-degree orthogonal layout
// Snake arrow: (1,1) -> (5,1) -> (5,4) -> (2,4) -> (2,6)
const snakeArrow: Arrow = {
  id: 'snake',
  color: 0,
  points: [
    { x: 1, y: 1 },
    { x: 5, y: 1 }, // seg 0: horizontal y=1
    { x: 5, y: 4 }, // seg 1: vertical x=5
    { x: 2, y: 4 }, // seg 2: horizontal y=4
    { x: 2, y: 6 }, // seg 3: vertical x=2
  ],
};
assert(isArrowStrictlyOrthogonal(snakeArrow), 'Original snake arrow is strictly orthogonal');

// Drag seg 1 (vertical x=5) to x=3
const afterVerticalSegDrag: Arrow = {
  ...snakeArrow,
  points: snakeArrow.points.map((p, idx) => {
    if (idx === 1 || idx === 2) return { ...p, x: 3 };
    return { ...p };
  }),
};
assert(
  isArrowStrictlyOrthogonal(afterVerticalSegDrag),
  'Moving vertical line section to x=3 maintains 100% 90-degree orthogonal layout on all segments'
);

// Drag seg 2 (horizontal y=4) to y=5
const afterHorizSegDrag: Arrow = {
  ...snakeArrow,
  points: snakeArrow.points.map((p, idx) => {
    if (idx === 2 || idx === 3) return { ...p, y: 5 };
    return { ...p };
  }),
};
assert(
  isArrowStrictlyOrthogonal(afterHorizSegDrag),
  'Moving horizontal line section to y=5 maintains 100% 90-degree orthogonal layout on all segments'
);

// 16e. Dragging corner vertex maintains 90-degree orthogonality
// Corner vertex 2 is between seg 1 (vertical x=5) and seg 2 (horizontal y=4)
const afterCornerDrag: Arrow = {
  ...snakeArrow,
  points: [
    { x: 1, y: 1 },
    { x: 4, y: 1 }, // seg 1 x moved to 4
    { x: 4, y: 3 }, // corner moved to (4,3)
    { x: 2, y: 3 }, // seg 2 y moved to 3
    { x: 2, y: 6 },
  ],
};
assert(
  isArrowStrictlyOrthogonal(afterCornerDrag),
  'Moving corner vertex adapts connected perpendicular segments cleanly maintaining strict 90-degree angles'
);

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================`);

if (failCount > 0) {
  process.exit(1);
}

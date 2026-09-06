import { Arrow, GridSize, SolvabilityResult } from '../types';
import { analyzeArrowExit, checkArrowOverlaps } from './geometry';

export function solveLevel(arrows: Arrow[], gridSize: GridSize): SolvabilityResult {
  if (arrows.length === 0) {
    return {
      isSolvable: true,
      hasOverlaps: false,
      overlaps: [],
      stepOrder: [],
      deadlockedArrowIds: [],
      blockingGraph: {},
      message: 'Empty level (place arrows to test solvability)',
    };
  }

  // 1. Check for overlapping arrows at rest
  const overlapCheck = checkArrowOverlaps(arrows);

  // 2. Build initial blocking graph for diagnostics
  const initialBlockingGraph: Record<string, string[]> = {};
  for (const arrow of arrows) {
    const analysis = analyzeArrowExit(arrow, arrows, gridSize);
    initialBlockingGraph[arrow.id] = analysis.blockedByArrowIds;
  }

  // 3. Simulate greedy clearance
  let remaining = [...arrows];
  const stepOrder: string[] = [];

  while (remaining.length > 0) {
    // Find all arrows that can currently escape
    const freeArrows = remaining.filter((arrow) => {
      const analysis = analyzeArrowExit(arrow, remaining, gridSize);
      return !analysis.isBlocked;
    });

    if (freeArrows.length === 0) {
      // Deadlock detected! None of the remaining arrows can escape
      const deadlockedIds = remaining.map((a) => a.id);
      
      // Filter blocking graph for remaining arrows
      const activeBlockingGraph: Record<string, string[]> = {};
      for (const arrow of remaining) {
        const analysis = analyzeArrowExit(arrow, remaining, gridSize);
        activeBlockingGraph[arrow.id] = analysis.blockedByArrowIds;
      }

      return {
        isSolvable: false,
        hasOverlaps: overlapCheck.hasOverlaps,
        overlaps: overlapCheck.overlaps,
        stepOrder,
        deadlockedArrowIds: deadlockedIds,
        blockingGraph: activeBlockingGraph,
        message: overlapCheck.hasOverlaps 
          ? `Unsolvable: ${overlapCheck.overlaps.length} overlap(s) detected and ${deadlockedIds.length} arrow(s) are deadlocked.`
          : `Unsolvable: Deadlock detected! ${deadlockedIds.length} arrow(s) cannot escape because they block each other.`,
      };
    }

    // Pick the first free arrow to clear (clearing linked groups atomically)
    const chosen = freeArrows[0];
    if (chosen.linkedGroupId) {
      const groupMembers = remaining.filter((a) => a.linkedGroupId === chosen.linkedGroupId);
      for (const member of groupMembers) {
        stepOrder.push(member.id);
      }
      const groupIds = new Set(groupMembers.map((a) => a.id));
      remaining = remaining.filter((a) => !groupIds.has(a.id));
    } else {
      stepOrder.push(chosen.id);
      remaining = remaining.filter((a) => a.id !== chosen.id);
    }
  }

  // All cleared successfully!
  return {
    isSolvable: !overlapCheck.hasOverlaps,
    hasOverlaps: overlapCheck.hasOverlaps,
    overlaps: overlapCheck.overlaps,
    stepOrder,
    deadlockedArrowIds: [],
    blockingGraph: initialBlockingGraph,
    message: overlapCheck.hasOverlaps
      ? `Warning: Clearance sequence found (${stepOrder.length} steps), but illegal co-planar collision(s) detected.`
      : `Solvable in ${stepOrder.length} steps! (${stepOrder.join(' → ')})`,
  };
}

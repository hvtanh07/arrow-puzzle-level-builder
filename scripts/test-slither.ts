import { Point } from '../src/types';
import {
  getExtendedTrack,
  computePolylineLengths,
  slicePolyline,
} from '../src/utils/geometry';

function verifySlither(name: string, points: Point[], exitDist: number = 8) {
  const track = getExtendedTrack(points, exitDist);
  const cumLengths = computePolylineLengths(track);
  const origLen = cumLengths[points.length - 1];
  const totalTravel = cumLengths[cumLengths.length - 1] - origLen;

  console.log(`\n=== Testing: ${name} (origLen: ${origLen}, totalTravel: ${totalTravel}) ===`);

  // Test 20 steps along the travel
  for (let step = 0; step <= 20; step++) {
    const s = (step / 20) * totalTravel;
    const slice = slicePolyline(track, cumLengths, s, s + origLen);

    if (slice.length < 2) {
      throw new Error(`Slice has fewer than 2 points at s=${s}`);
    }

    // Verify sliced length
    let sliceLen = 0;
    for (let i = 0; i < slice.length - 1; i++) {
      sliceLen += Math.hypot(slice[i + 1].x - slice[i].x, slice[i + 1].y - slice[i].y);
    }

    if (Math.abs(sliceLen - origLen) > 0.05) {
      throw new Error(
        `Slice length mismatch at s=${s}: expected ${origLen}, got ${sliceLen}`
      );
    }
  }

  console.log(`PASS: ${name} verified across 21 interpolation steps.`);
}

// 1. Serpentine arrow
verifySlither('Serpentine 4-turn', [
  { x: 2, y: 8 },
  { x: 5, y: 8 },
  { x: 5, y: 9 },
  { x: 4, y: 9 },
  { x: 4, y: 10 },
]);

// 2. Straight 1-unit arrow
verifySlither('Straight 1-unit UP', [
  { x: 3, y: 3 },
  { x: 3, y: 2 },
]);

// 3. Straight 4-unit arrow RIGHT
verifySlither('Straight 4-unit RIGHT', [
  { x: 1, y: 2 },
  { x: 5, y: 2 },
]);

// 4. L-shape arrow
verifySlither('L-shape LEFT-UP', [
  { x: 5, y: 4 },
  { x: 2, y: 4 },
  { x: 2, y: 1 },
]);

console.log('\nAll slither geometry tests passed successfully!');


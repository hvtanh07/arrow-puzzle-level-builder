import React, { useState, useEffect, useRef } from 'react';
import { Arrow, Level, Point } from '../types';
import { ArrowRenderer } from './ArrowRenderer';
import {
  analyzeArrowExit,
  getDirectionVector,
  getHeadDirection,
  getExtendedTrack,
  computePolylineLengths,
  slicePolyline,
} from '../utils/geometry';
import { getColorHex } from '../constants/colors';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  ArrowLeft,
  Heart,
  Lightbulb,
  Sparkles,
  Smartphone,
  Maximize2,
  Trophy,
  Frown,
  Settings,
  Scissors,
  Route,
  X,
} from 'lucide-react';

interface PlayTestViewProps {
  level: Level;
  onBackToEditor: () => void;
  onNextLevel?: () => void;
  hasNextLevel?: boolean;
}

export const PlayTestView: React.FC<PlayTestViewProps> = ({
  level,
  onBackToEditor,
  onNextLevel,
  hasNextLevel = false,
}) => {
  const [activeArrows, setActiveArrows] = useState<Arrow[]>([]);
  const [lives, setLives] = useState<number>(3);
  const [blockedTapId, setBlockedTapId] = useState<string | null>(null);
  const [escapingArrowAnim, setEscapingArrowAnim] = useState<{
    arrowId: string;
    arrow: Arrow;
    currentPoints: Point[];
  } | null>(null);
  const [hintArrowId, setHintArrowId] = useState<string | null>(null);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [phoneFrame, setPhoneFrame] = useState<boolean>(true);
  const [movesCount, setMovesCount] = useState<number>(0);

  const animFrameRef = useRef<number | null>(null);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // The 3 Boosters States
  const [isRemovalMode, setIsRemovalMode] = useState<boolean>(false);
  const [showPathsHighlight, setShowPathsHighlight] = useState<boolean>(false);

  // Initialize level
  useEffect(() => {
    resetGame();
  }, [level]);

  const resetGame = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setActiveArrows([...level.arrows]);
    setLives(3);
    setBlockedTapId(null);
    setEscapingArrowAnim(null);
    setHintArrowId(null);
    setIsWon(false);
    setIsGameOver(false);
    setMovesCount(0);
    setIsRemovalMode(false);
    setShowPathsHighlight(false);
  };

  const handleArrowTap = (arrowId: string) => {
    if (isWon || isGameOver || escapingArrowAnim) return;

    // Booster 2: If in "Remove Any Arrow" mode, remove tapped arrow directly!
    if (isRemovalMode) {
      sound.playPop();
      setIsRemovalMode(false);
      const remaining = activeArrows.filter((a) => a.id !== arrowId);
      setActiveArrows(remaining);
      if (remaining.length === 0) {
        sound.playVictory();
        setIsWon(true);
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      return;
    }

    const arrow = activeArrows.find((a) => a.id === arrowId);
    if (!arrow) return;

    setMovesCount((prev) => prev + 1);

    // Analyze if unblocked
    const analysis = analyzeArrowExit(arrow, activeArrows, level.gridSize);

    if (analysis.isBlocked) {
      // BLOCKED!
      sound.playBump();
      setBlockedTapId(arrowId);
      setTimeout(() => setBlockedTapId(null), 400);

      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        sound.playGameOver();
        setIsGameOver(true);
      }
    } else {
      // FREE! ESCAPE WITH SLITHER ANIMATION!
      sound.playWhoosh();
      setHintArrowId(null);

      // Compute extended polyline track and cumulative distances
      const origPoints = arrow.points;
      const exitDist = Math.max(level.gridSize.width, level.gridSize.height) + origPoints.length + 5;
      const track = getExtendedTrack(origPoints, exitDist);
      const cumLengths = computePolylineLengths(track);
      const arrowLength = cumLengths[origPoints.length - 1];
      const totalTrackDist = cumLengths[cumLengths.length - 1];
      const totalTravel = totalTrackDist - arrowLength;

      const durationMs = 420;
      const startTime = performance.now();

      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }

      const animateStep = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Smooth power curve: arrow accelerates cleanly along polyline
        const easedProgress = Math.pow(progress, 1.4);
        const currentDist = easedProgress * totalTravel;

        const currentPoints = slicePolyline(
          track,
          cumLengths,
          currentDist,
          currentDist + arrowLength
        );

        setEscapingArrowAnim({
          arrowId: arrow.id,
          arrow,
          currentPoints,
        });

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animateStep);
        } else {
          // Animation complete!
          animFrameRef.current = null;
          setEscapingArrowAnim(null);

          const remaining = activeArrows.filter((a) => a.id !== arrowId);
          setActiveArrows(remaining);

          // Check if won
          if (remaining.length === 0) {
            sound.playVictory();
            setIsWon(true);
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        }
      };

      animFrameRef.current = requestAnimationFrame(animateStep);
    }
  };

  // Booster 1: Hint
  const handleHintBooster = () => {
    if (isWon || isGameOver) return;
    sound.playPop();

    // Find any currently unblocked arrow
    const free = activeArrows.find(
      (a) => !analyzeArrowExit(a, activeArrows, level.gridSize).isBlocked
    );

    if (free) {
      setHintArrowId(free.id);
      setTimeout(() => setHintArrowId(null), 3000);
    }
  };

  // Booster 2: Remove Any Arrow Mode Toggle
  const handleRemoveArrowBooster = () => {
    if (isWon || isGameOver || activeArrows.length === 0) return;
    sound.playClick();
    setIsRemovalMode(!isRemovalMode);
  };

  // Booster 3: Highlight Paths Toggle
  const handleHighlightPathsBooster = () => {
    sound.playClick();
    setShowPathsHighlight(!showPathsHighlight);
  };

  const cellSize = 54;
  const padding = 45;
  const boardWidth = level.gridSize.width * cellSize + padding * 2;
  const boardHeight = level.gridSize.height * cellSize + padding * 2;

  // Compute highlighted path trajectories for all active arrows
  const arrowTrajectories = showPathsHighlight
    ? activeArrows.map((arr) => {
        const analysis = analyzeArrowExit(arr, activeArrows, level.gridSize);
        const head = arr.points[arr.points.length - 1];
        const dir = getHeadDirection(arr);
        const v = getDirectionVector(dir);

        let endX = head.x;
        let endY = head.y;

        if (analysis.firstObstacle) {
          endX = analysis.firstObstacle.x;
          endY = analysis.firstObstacle.y;
        } else {
          // off board
          while (
            endX >= 0 &&
            endX < level.gridSize.width &&
            endY >= 0 &&
            endY < level.gridSize.height
          ) {
            endX += v.x;
            endY += v.y;
          }
        }

        return {
          arrow: arr,
          isBlocked: analysis.isBlocked,
          color: getColorHex(arr.color),
          start: head,
          end: { x: endX, y: endY },
        };
      })
    : [];

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700 text-white z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToEditor}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Editor</span>
          </button>
          <div className="h-5 w-px bg-slate-600" />
          <span className="text-sm font-bold text-slate-200">{level.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhoneFrame(!phoneFrame)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold transition-all"
            title="Toggle Mobile Mockup Frame"
          >
            {phoneFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>{phoneFrame ? 'Fullscreen View' : 'Phone Frame'}</span>
          </button>

          <button
            onClick={resetGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95"
            title="Reset Level"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-radial from-slate-800 to-slate-950">
        <div
          className={`relative transition-all duration-300 ${
            phoneFrame
              ? 'w-full max-w-[420px] h-[830px] max-h-[92vh] bg-white rounded-[44px] shadow-2xl border-[10px] border-slate-700 flex flex-col overflow-hidden'
              : 'bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center'
          }`}
        >
          {/* Removal Mode Indicator Banner */}
          {isRemovalMode && (
            <div className="bg-rose-500 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between shadow-xs z-30 animate-in slide-in-from-top duration-150">
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                <span>Booster Active: Tap ANY arrow to eliminate it!</span>
              </div>
              <button
                onClick={() => setIsRemovalMode(false)}
                className="p-0.5 hover:bg-rose-600 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* In-Game Header (Matching Screenshot) */}
          <div className="w-full px-6 pt-5 pb-3 bg-gradient-to-b from-slate-50 to-white flex flex-col gap-3 border-b border-slate-100">
            {/* Top Stat Bar */}
            <div className="flex items-center justify-between">
              <button className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-2xs">
                <Settings className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
                <span className="text-base">🪙</span>
                <span className="text-xs font-black text-slate-700">800</span>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
                <span className="text-xs font-black text-emerald-700">$95,34</span>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-1 rounded">Tiền</span>
              </div>

              <button
                onClick={resetGame}
                className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-2xs hover:bg-indigo-100 transition-all"
                title="Reset Level"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Level Title & Progress */}
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-slate-800 tracking-wide">
                {level.name.includes(':') ? level.name.split(':')[0] : level.name}
              </span>
              <div className="w-44 h-2 bg-indigo-100 rounded-full mt-1.5 overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      level.arrows.length > 0
                        ? ((level.arrows.length - activeArrows.length) / level.arrows.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Lives Display (3 Hearts) */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((h) => (
                <div
                  key={h}
                  className={`transition-all duration-300 transform ${
                    h <= lives ? 'scale-100 text-rose-500' : 'scale-90 text-slate-300 opacity-50'
                  }`}
                >
                  <Heart
                    className={`w-7 h-7 drop-shadow-sm ${
                      h <= lives ? 'fill-rose-500 stroke-rose-600' : 'fill-slate-200 stroke-slate-300'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SVG Game Board */}
          <div className="flex-1 flex items-center justify-center p-3 overflow-hidden">
            <svg
              width={boardWidth}
              height={boardHeight}
              viewBox={`0 0 ${boardWidth} ${boardHeight}`}
              className="max-w-full max-h-full block transition-transform select-none"
              style={{ overflow: 'visible' }}
            >
              {/* Board Container */}
              <rect
                x={padding - 8}
                y={padding - 8}
                width={level.gridSize.width * cellSize + 16}
                height={level.gridSize.height * cellSize + 16}
                rx={20}
                fill="#fcfcfd"
                stroke="#f1f5f9"
                strokeWidth={2}
              />

              {/* Grid dots */}
              {Array.from({ length: level.gridSize.width }).map((_, col) =>
                Array.from({ length: level.gridSize.height }).map((_, row) => (
                  <circle
                    key={`dot-${col}-${row}`}
                    cx={padding + col * cellSize}
                    cy={padding + row * cellSize}
                    r={2.5}
                    fill="#e2e8f0"
                  />
                ))
              )}

              {/* Booster 3: Highlight Paths in Arrow Colors */}
              {showPathsHighlight &&
                arrowTrajectories.map((traj, idx) => {
                  const sx = padding + traj.start.x * cellSize;
                  const sy = padding + traj.start.y * cellSize;
                  const ex = padding + traj.end.x * cellSize;
                  const ey = padding + traj.end.y * cellSize;

                  return (
                    <g key={`traj-${idx}`} className="pointer-events-none">
                      <line
                        x1={sx}
                        y1={sy}
                        x2={ex}
                        y2={ey}
                        stroke={traj.color}
                        strokeWidth={3}
                        strokeDasharray="6 4"
                        strokeOpacity={0.8}
                      />
                      {traj.isBlocked && (
                        <circle
                          cx={ex}
                          cy={ey}
                          r={6}
                          fill="#ef4444"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      )}
                    </g>
                  );
                })}

              {/* Arrows */}
              {activeArrows.map((arr) => {
                const isBlockedTap = arr.id === blockedTapId;
                const isEscaping = arr.id === escapingArrowAnim?.arrowId;
                const isHinted = arr.id === hintArrowId;
                const displayArrow =
                  isEscaping && escapingArrowAnim
                    ? { ...arr, points: escapingArrowAnim.currentPoints }
                    : arr;

                return (
                  <ArrowRenderer
                    key={arr.id}
                    arrow={displayArrow}
                    cellSize={cellSize}
                    padding={padding}
                    isBlockedTap={isBlockedTap}
                    isEscaping={isEscaping}
                    isHinted={isHinted}
                    isTargetForRemoval={isRemovalMode}
                    onClick={() => handleArrowTap(arr.id)}
                  />
                );
              })}
            </svg>
          </div>

          {/* Bottom Game Power-ups Bar: STRICTLY 3 BOOSTERS */}
          <div className="w-full px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-around">
            {/* Booster 1: Hint */}
            <button
              onClick={handleHintBooster}
              className="group flex flex-col items-center gap-1 active:scale-95 transition-transform"
              title="Hint Booster: Highlight free arrow"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-xs relative group-hover:bg-amber-100">
                <Lightbulb className="w-7 h-7 fill-amber-400 stroke-amber-600" />
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  2
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-600">Hint</span>
            </button>

            {/* Booster 2: Remove Any Arrow */}
            <button
              onClick={handleRemoveArrowBooster}
              className={`group flex flex-col items-center gap-1 active:scale-95 transition-transform`}
              title="Booster: Remove any arrow from board"
            >
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs relative transition-colors ${
                  isRemovalMode
                    ? 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-400/40'
                    : 'bg-rose-50 border-rose-200 text-rose-500 group-hover:bg-rose-100'
                }`}
              >
                <Scissors className={`w-7 h-7 ${isRemovalMode ? 'stroke-white' : 'stroke-rose-600'}`} />
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-600">Remove Arrow</span>
            </button>

            {/* Booster 3: Highlight Paths in Arrow Colors */}
            <button
              onClick={handleHighlightPathsBooster}
              className="group flex flex-col items-center gap-1 active:scale-95 transition-transform"
              title="Booster: Highlight arrow paths in their colors"
            >
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs relative transition-colors ${
                  showPathsHighlight
                    ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-400/40'
                    : 'bg-blue-50 border-blue-200 text-blue-500 group-hover:bg-blue-100'
                }`}
              >
                <Route className={`w-7 h-7 ${showPathsHighlight ? 'stroke-white' : 'stroke-blue-600'}`} />
                <span
                  className={`absolute -top-1.5 -right-1.5 text-white text-[9px] font-bold px-1 py-0.5 rounded-full flex items-center justify-center ${
                    showPathsHighlight ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                >
                  {showPathsHighlight ? 'ON' : '2'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-600">Highlight Path</span>
            </button>
          </div>

          {/* Victory Modal Overlay */}
          {isWon && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-3 shadow-inner">
                  <Trophy className="w-9 h-9" />
                </div>

                <h3 className="text-xl font-black text-slate-800">LEVEL CLEARED!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cleared in <b className="text-slate-700">{movesCount}</b> taps!
                </p>

                {/* Stars */}
                <div className="flex gap-1.5 my-4">
                  {[1, 2, 3].map((star) => (
                    <span
                      key={star}
                      className={`text-3xl ${
                        star <= (lives === 3 ? 3 : lives === 2 ? 2 : 1)
                          ? 'text-amber-400 drop-shadow-sm'
                          : 'text-slate-200'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <div className="flex flex-col gap-2 w-full mt-2">
                  {hasNextLevel && onNextLevel && (
                    <button
                      onClick={onNextLevel}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
                    >
                      Next Level →
                    </button>
                  )}
                  <button
                    onClick={resetGame}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={onBackToEditor}
                    className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 font-semibold text-xs transition-all"
                  >
                    Return to Level Editor
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Modal Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-3">
                  <Frown className="w-9 h-9" />
                </div>

                <h3 className="text-xl font-black text-slate-800">OUT OF LIVES!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You bumped into obstacles 3 times.
                </p>

                <div className="flex flex-col gap-2 w-full mt-5">
                  <button
                    onClick={resetGame}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onBackToEditor}
                    className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 font-semibold text-xs transition-all"
                  >
                    Return to Level Editor
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

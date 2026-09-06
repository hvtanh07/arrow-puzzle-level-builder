import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Arrow, EditorTool, GridSize, Point, SolvabilityResult } from '../types';
import { ArrowRenderer } from './ArrowRenderer';
import {
  analyzeArrowExit,
  getDirectionVector,
  getHeadDirection,
  getReverseHeadDirection,
  getEffectiveLayer,
} from '../utils/geometry';
import { getColorHex } from '../constants/colors';
import { sound } from '../utils/sound';
import { Check, X, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';

interface CanvasEditorProps {
  gridSize: GridSize;
  arrows: Arrow[];
  solvability: SolvabilityResult;
  onChangeArrows: (newArrows: Arrow[]) => void;
  tool: EditorTool;
  selectedArrowId: string | null;
  onSelectArrowId: (id: string | null) => void;
  activeColorId: number;
  showRays: boolean;
  showCoords: boolean;
  onPlayTest: () => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  gridSize,
  arrows,
  solvability,
  onChangeArrows,
  tool,
  selectedArrowId,
  onSelectArrowId,
  activeColorId,
  showRays,
  showCoords,
  onPlayTest,
}) => {
  // Drawing state
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const [hoverGridPos, setHoverGridPos] = useState<Point | null>(null);

  // Dragging vertex state
  const [dragVertex, setDragVertex] = useState<{
    arrowId: string;
    vertexIndex: number;
  } | null>(null);

  // Dragging whole arrow state
  const [dragArrow, setDragArrow] = useState<{
    arrowId: string;
    startMouse: Point;
    origPoints: Point[];
    hasMoved: boolean;
  } | null>(null);

  // Zoom and Pan states
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Grid & Sizing Calculations (Centered Symmetrically!)
  const cellSize = 54;
  const gridWidth = (gridSize.width - 1) * cellSize;
  const gridHeight = (gridSize.height - 1) * cellSize;

  // Board margin around grid dots inside the rounded card
  const boardMargin = 45;
  const padding = 65; // Total SVG padding for labels and arrowheads

  const cardX = padding - boardMargin;
  const cardY = padding - boardMargin;
  const cardWidth = gridWidth + boardMargin * 2;
  const cardHeight = gridHeight + boardMargin * 2;

  const totalSvgWidth = gridWidth + padding * 2;
  const totalSvgHeight = gridHeight + padding * 2;

  const activeColorHex = getColorHex(activeColorId);

  // Convert client mouse event to grid coordinates (Zoom & Pan Aware!)
  const clientToGrid = useCallback(
    (e: React.MouseEvent | MouseEvent): { gx: number; gy: number; rawX: number; rawY: number } => {
      if (!svgRef.current) return { gx: 0, gy: 0, rawX: 0, rawY: 0 };
      const rect = svgRef.current.getBoundingClientRect();

      // Screen to local SVG coordinates using actual bounding client rect
      const localX = (e.clientX - rect.left) / zoom;
      const localY = (e.clientY - rect.top) / zoom;

      let gx = Math.round((localX - padding) / cellSize);
      let gy = Math.round((localY - padding) / cellSize);

      gx = Math.max(0, Math.min(gridSize.width - 1, gx));
      gy = Math.max(0, Math.min(gridSize.height - 1, gy));

      return { gx, gy, rawX: localX, rawY: localY };
    },
    [cellSize, padding, gridSize, zoom]
  );

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.max(0.3, Math.min(3.0, prev * zoomFactor)));
  };

  // Reset Zoom & Pan
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Tool change listener: clear drawing when switching away from draw mode
  useEffect(() => {
    if (tool !== 'draw') {
      setDrawPoints([]);
    } else {
      onSelectArrowId(null);
    }
  }, [tool]);

  // Global mouseup listener for clean drag release anywhere
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      if (dragVertex) setDragVertex(null);
      if (dragArrow) {
        if (dragArrow.hasMoved) {
          sound.playPop();
        }
        setDragArrow(null);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragVertex, dragArrow]);

  // Keyboard shortcut listener for finish / cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Enter') {
        finishDrawing(true);
      } else if (e.key === 'Escape') {
        cancelDrawing();
        onSelectArrowId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawPoints, activeColorId, hoverGridPos, tool]);

  // Handle Arrow Mouse Down (Select mode: select & start drag-move)
  const handleArrowMouseDown = (arrow: Arrow, e: React.MouseEvent) => {
    if (tool !== 'select') return;
    if (e.button !== 0) return; // Left mouse button only

    e.stopPropagation();
    e.preventDefault();

    onSelectArrowId(arrow.id);

    const { gx, gy } = clientToGrid(e);
    setDragArrow({
      arrowId: arrow.id,
      startMouse: { x: gx, y: gy },
      origPoints: arrow.points.map((p) => ({ ...p })),
      hasMoved: false,
    });
  };

  // Handle Mouse Down on Canvas (Right-click finishes arrow if drawing, or pans)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) {
      // Right mouse button
      e.preventDefault();
      e.stopPropagation();

      if (tool === 'draw' && drawPoints.length > 0) {
        finishDrawing(true);
        return;
      }

      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  // Handle Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    const { gx, gy } = clientToGrid(e);
    setHoverGridPos({ x: gx, y: gy });

    // If dragging single vertex handle
    if (dragVertex && tool === 'select') {
      const arrow = arrows.find((a) => a.id === dragVertex.arrowId);
      if (!arrow) return;

      const newPoints = [...arrow.points];
      const curPt = newPoints[dragVertex.vertexIndex];
      if (curPt.x !== gx || curPt.y !== gy) {
        newPoints[dragVertex.vertexIndex] = { x: gx, y: gy };
        const updated = arrows.map((a) =>
          a.id === dragVertex.arrowId ? { ...a, points: newPoints } : a
        );
        onChangeArrows(updated);
      }
      return;
    }

    // If dragging whole arrow in select mode
    if (dragArrow && tool === 'select') {
      const dx = gx - dragArrow.startMouse.x;
      const dy = gy - dragArrow.startMouse.y;

      const minX = Math.min(...dragArrow.origPoints.map((p) => p.x));
      const maxX = Math.max(...dragArrow.origPoints.map((p) => p.x));
      const minY = Math.min(...dragArrow.origPoints.map((p) => p.y));
      const maxY = Math.max(...dragArrow.origPoints.map((p) => p.y));

      const clampedDx = Math.max(-minX, Math.min(gridSize.width - 1 - maxX, dx));
      const clampedDy = Math.max(-minY, Math.min(gridSize.height - 1 - maxY, dy));

      const shiftedPoints = dragArrow.origPoints.map((p) => ({
        x: p.x + clampedDx,
        y: p.y + clampedDy,
      }));

      const target = arrows.find((a) => a.id === dragArrow.arrowId);
      if (target) {
        const changed = shiftedPoints.some(
          (p, i) => p.x !== target.points[i]?.x || p.y !== target.points[i]?.y
        );
        if (changed) {
          setDragArrow((prev) => (prev ? { ...prev, hasMoved: true } : null));
          const updated = arrows.map((a) =>
            a.id === dragArrow.arrowId ? { ...a, points: shiftedPoints } : a
          );
          onChangeArrows(updated);
        }
      }
    }
  };

  // Handle Mouse Up
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning || e.button === 2) {
      setIsPanning(false);
    }
    if (dragVertex) setDragVertex(null);
    if (dragArrow) {
      if (dragArrow.hasMoved) {
        sound.playPop();
      }
      setDragArrow(null);
    }
  };

  // Handle Canvas Click (Left click only)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only process primary click (left button)
    if (e.button !== 0) return;

    const { gx, gy } = clientToGrid(e);

    if (tool === 'draw') {
      sound.playPop();
      if (drawPoints.length === 0) {
        // Starting point is the ARROW HEAD!
        setDrawPoints([{ x: gx, y: gy }]);
      } else {
        const last = drawPoints[drawPoints.length - 1];

        // Snap to dominant orthogonal axis
        let nextX = gx;
        let nextY = gy;
        const dx = Math.abs(gx - last.x);
        const dy = Math.abs(gy - last.y);

        if (dx === 0 && dy === 0) return;

        if (dx >= dy) {
          nextY = last.y;
        } else {
          nextX = last.x;
        }

        setDrawPoints([...drawPoints, { x: nextX, y: nextY }]);
      }
    } else if (tool === 'select') {
      if (!dragArrow || !dragArrow.hasMoved) {
        onSelectArrowId(null);
      }
    }
  };

  // Finish drawn arrow (Right-click, Enter, or Finish Button)
  // Starting point drawPoints[0] is the ARROW HEAD!
  const finishDrawing = (includeHover: boolean = false) => {
    if (tool !== 'draw') return;

    let rawPoints = [...drawPoints];

    // If only 1 point placed (head), and user is hovering over another grid cell,
    // include it to allow quick 2-point creation in 1 left-click + 1 right-click!
    if (includeHover && rawPoints.length === 1 && hoverGridPos) {
      const last = rawPoints[0];
      const dx = Math.abs(hoverGridPos.x - last.x);
      const dy = Math.abs(hoverGridPos.y - last.y);
      if (dx > 0 || dy > 0) {
        let nextX = hoverGridPos.x;
        let nextY = hoverGridPos.y;
        if (dx >= dy) {
          nextY = last.y;
        } else {
          nextX = last.x;
        }
        if (nextX !== last.x || nextY !== last.y) {
          rawPoints.push({ x: nextX, y: nextY });
        }
      }
    }

    if (rawPoints.length < 2) {
      setDrawPoints([]);
      return;
    }

    // CRITICAL: The starting point (rawPoints[0]) is the ARROW HEAD!
    // In our arrow data model, points[points.length - 1] is the head.
    // So we reverse rawPoints: [tail, ..., head].
    const reversed = [...rawPoints].reverse();

    // Clean collinear redundant points
    const cleaned: Point[] = [reversed[0]];
    for (let i = 1; i < reversed.length - 1; i++) {
      const prev = cleaned[cleaned.length - 1];
      const cur = reversed[i];
      const next = reversed[i + 1];

      const sameHoriz = prev.y === cur.y && cur.y === next.y;
      const sameVert = prev.x === cur.x && cur.x === next.x;

      if (!sameHoriz && !sameVert) {
        cleaned.push(cur);
      }
    }
    cleaned.push(reversed[reversed.length - 1]);

    if (cleaned.length < 2) {
      setDrawPoints([]);
      return;
    }

    const newArrow: Arrow = {
      id: `arrow_${Date.now().toString(36).substr(-4)}`,
      color: activeColorId,
      points: cleaned,
    };

    sound.playClick();
    onChangeArrows([...arrows, newArrow]);
    setDrawPoints([]);
  };

  // Cancel drawing
  const cancelDrawing = () => {
    setDrawPoints([]);
  };

  // Live preview points during drawing
  // rawPoints in click order: [Head (drawPoints[0]), point1, ..., pointN, hoverPoint?]
  // Reversed for ArrowRenderer so head is at points[points.length - 1]:
  let previewArrowPoints: Point[] | null = null;
  if (tool === 'draw' && drawPoints.length > 0) {
    const rawPreview: Point[] = [...drawPoints];
    if (hoverGridPos) {
      const last = drawPoints[drawPoints.length - 1];
      let nextX = hoverGridPos.x;
      let nextY = hoverGridPos.y;
      const dx = Math.abs(hoverGridPos.x - last.x);
      const dy = Math.abs(hoverGridPos.y - last.y);

      if (dx >= dy) {
        nextY = last.y;
      } else {
        nextX = last.x;
      }

      if (nextX !== last.x || nextY !== last.y) {
        rawPreview.push({ x: nextX, y: nextY });
      }
    }

    if (rawPreview.length >= 2) {
      previewArrowPoints = [...rawPreview].reverse();
    }
  }

  // Precompute ray lines when showRays is enabled
  const arrowRays = showRays
    ? arrows.flatMap((arr) => {
        const analysis = analyzeArrowExit(arr, arrows, gridSize);
        const head = arr.points[arr.points.length - 1];
        const dir = getHeadDirection(arr);
        const v = getDirectionVector(dir);

        let endX = head.x;
        let endY = head.y;

        if (analysis.firstObstacle) {
          endX = analysis.firstObstacle.x;
          endY = analysis.firstObstacle.y;
        } else {
          while (
            endX >= 0 &&
            endX < gridSize.width &&
            endY >= 0 &&
            endY < gridSize.height
          ) {
            endX += v.x;
            endY += v.y;
          }
        }

        const rays = [
          {
            arrow: arr,
            analysis,
            color: getColorHex(arr.color),
            start: head,
            end: { x: endX, y: endY },
            obstacle: analysis.firstObstacle,
          },
        ];

        // Element 1: Also show reverse head exit ray for double-headed arrows
        if (arr.isDoubleHeaded) {
          const revHead = arr.points[0];
          const revDir = getReverseHeadDirection(arr);
          const rv = getDirectionVector(revDir);

          let revEndX = revHead.x;
          let revEndY = revHead.y;

          if (analysis.firstObstacleReverse) {
            revEndX = analysis.firstObstacleReverse.x;
            revEndY = analysis.firstObstacleReverse.y;
          } else {
            while (
              revEndX >= 0 &&
              revEndX < gridSize.width &&
              revEndY >= 0 &&
              revEndY < gridSize.height
            ) {
              revEndX += rv.x;
              revEndY += rv.y;
            }
          }

          rays.push({
            arrow: arr,
            analysis,
            color: getColorHex(arr.color),
            start: revHead,
            end: { x: revEndX, y: revEndY },
            obstacle: analysis.firstObstacleReverse,
          });
        }

        return rays;
      })
    : [];

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-slate-100 select-none overflow-hidden relative cursor-default"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (tool === 'draw' && drawPoints.length > 0) {
          finishDrawing(true);
        }
      }}
    >
      {/* Drawing active banner */}
      {tool === 'draw' && drawPoints.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md z-10 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              <b>Drawing:</b> First point is <b>Arrow Head</b>. Left-click to add points • <b>Right-click</b> to finish!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => finishDrawing(true)}
              className="px-3 py-1 bg-white text-blue-700 hover:bg-blue-50 rounded-lg font-bold shadow-xs text-xs flex items-center gap-1 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Finish Arrow (Right-Click)
            </button>
            <button
              onClick={cancelDrawing}
              className="p-1 text-blue-200 hover:text-white rounded-lg"
              title="Cancel (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Zoom & Pan Controls (Bottom-Left) */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-2xl shadow-lg border border-slate-200/80">
        <button
          onClick={() => setZoom((prev) => Math.max(0.3, prev - 0.15))}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="px-2 py-1 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 font-mono transition-colors"
          title="Reset Zoom & Pan"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom((prev) => Math.min(3.0, prev + 0.15))}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-200 mx-0.5" />
        <button
          onClick={handleResetView}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
          title="Reset to Center"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Helper Navigation Hint (Bottom-Right) */}
      <div className="absolute bottom-5 right-5 z-20 hidden md:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-slate-200/80 text-[11px] text-slate-600 font-medium">
        {tool === 'draw' ? (
          <span>
            <b>Draw Mode:</b> Left-click Head → Left-click Points → <b>Right-click</b> to End
          </span>
        ) : (
          <span>
            <b>Select Mode:</b> Drag arrow to move & release to place • Click to select
          </span>
        )}
        <span className="text-slate-300">|</span>
        <span className="text-slate-400">Scroll to zoom • Right-click drag to pan</span>
      </div>

      {/* Main Canvas SVG Area (Centered in Viewport with Pan & Zoom) */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-6 bg-radial from-slate-50 to-slate-200/80">
        <div
          className="relative transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <svg
            ref={svgRef}
            width={totalSvgWidth}
            height={totalSvgHeight}
            className={tool === 'draw' ? 'cursor-crosshair block' : 'cursor-default block'}
            onClick={handleCanvasClick}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (tool === 'draw' && drawPoints.length > 0) {
                finishDrawing(true);
              }
            }}
          >
            {/* Board Background (Symmetrically Centered Card!) */}
            <rect
              x={cardX}
              y={cardY}
              width={cardWidth}
              height={cardHeight}
              rx={24}
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth={2}
              style={{
                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.08))',
              }}
            />

            {/* Grid Lines (Symmetrically spanning column 0 to width-1) */}
            {Array.from({ length: gridSize.width }).map((_, col) => (
              <line
                key={`v-${col}`}
                x1={padding + col * cellSize}
                y1={padding}
                x2={padding + col * cellSize}
                y2={padding + gridHeight}
                stroke="#f1f5f9"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            ))}
            {Array.from({ length: gridSize.height }).map((_, row) => (
              <line
                key={`h-${row}`}
                x1={padding}
                y1={padding + row * cellSize}
                x2={padding + gridWidth}
                y2={padding + row * cellSize}
                stroke="#f1f5f9"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            ))}

            {/* Grid Intersections / Dots (Perfect symmetric spacing) */}
            {Array.from({ length: gridSize.width }).map((_, col) =>
              Array.from({ length: gridSize.height }).map((_, row) => (
                <circle
                  key={`dot-${col}-${row}`}
                  cx={padding + col * cellSize}
                  cy={padding + row * cellSize}
                  r={3}
                  fill="#cbd5e1"
                  className="pointer-events-none"
                />
              ))
            )}

            {/* Coordinate numbers */}
            {showCoords && (
              <>
                {Array.from({ length: gridSize.width }).map((_, col) => (
                  <text
                    key={`col-label-${col}`}
                    x={padding + col * cellSize}
                    y={padding - 24}
                    textAnchor="middle"
                    className="text-[11px] font-mono font-bold fill-slate-400"
                  >
                    {col}
                  </text>
                ))}
                {Array.from({ length: gridSize.height }).map((_, row) => (
                  <text
                    key={`row-label-${row}`}
                    x={padding - 26}
                    y={padding + row * cellSize + 4}
                    textAnchor="middle"
                    className="text-[11px] font-mono font-bold fill-slate-400"
                  >
                    {row}
                  </text>
                ))}
              </>
            )}

            {/* Escape Trajectory Rays */}
            {showRays &&
              arrowRays.map((ray, idx) => {
                const sx = padding + ray.start.x * cellSize;
                const sy = padding + ray.start.y * cellSize;
                const ex = padding + ray.end.x * cellSize;
                const ey = padding + ray.end.y * cellSize;

                return (
                  <g key={`ray-${idx}`} className="pointer-events-none">
                    <line
                      x1={sx}
                      y1={sy}
                      x2={ex}
                      y2={ey}
                      stroke={ray.color}
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      strokeOpacity={0.75}
                    />
                    {ray.analysis.isBlocked && ray.analysis.firstObstacle && (
                      <circle
                        cx={padding + ray.analysis.firstObstacle.x * cellSize}
                        cy={padding + ray.analysis.firstObstacle.y * cellSize}
                        r={7}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    )}
                  </g>
                );
              })}

            {/* Resting Overlap Warnings */}
            {solvability.hasOverlaps &&
              solvability.overlaps.map((ov, i) => (
                <circle
                  key={`ov-${i}`}
                  cx={padding + ov.point.x * cellSize}
                  cy={padding + ov.point.y * cellSize}
                  r={12}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeDasharray="3 3"
                  className="animate-pulse pointer-events-none"
                />
              ))}

            {/* Element 2: Linked Arrows Visual Connection Lines */}
            {arrows.map((a1, idx) => {
              if (!a1.linkedGroupId) return null;
              const partners = arrows.slice(idx + 1).filter((a2) => a2.linkedGroupId === a1.linkedGroupId);
              const mid1 = a1.points[Math.floor(a1.points.length / 2)];
              return partners.map((a2) => {
                const mid2 = a2.points[Math.floor(a2.points.length / 2)];
                const isEitherSelected = a1.id === selectedArrowId || a2.id === selectedArrowId;
                return (
                  <g key={`link-${a1.id}-${a2.id}`} className="pointer-events-none">
                    <line
                      x1={padding + mid1.x * cellSize}
                      y1={padding + mid1.y * cellSize}
                      x2={padding + mid2.x * cellSize}
                      y2={padding + mid2.y * cellSize}
                      stroke={isEitherSelected ? '#38bdf8' : '#94a3b8'}
                      strokeWidth={isEitherSelected ? 3 : 2}
                      strokeDasharray="6 4"
                      strokeOpacity={isEitherSelected ? 0.9 : 0.45}
                    />
                  </g>
                );
              });
            })}

            {/* Arrows (Sorted by Layer Order for Element 3) */}
            {[...arrows]
              .sort((a, b) => getEffectiveLayer(a, arrows) - getEffectiveLayer(b, arrows))
              .map((arr) => {
                const isSelected = arr.id === selectedArrowId;
                const isDeadlocked = solvability.deadlockedArrowIds.includes(arr.id);
                const isDraggingThis = dragArrow?.arrowId === arr.id;

                return (
                  <ArrowRenderer
                    key={arr.id}
                    arrow={arr}
                    cellSize={cellSize}
                    padding={padding}
                    isSelected={isSelected}
                    isDeadlocked={isDeadlocked}
                    showHandles={tool === 'select'}
                    isDragging={isDraggingThis}
                    interactive={tool === 'select'}
                    onClick={(e) => {
                      if (tool === 'select') {
                        e.stopPropagation();
                        if (!dragArrow?.hasMoved) {
                          sound.playClick();
                          onSelectArrowId(arr.id);
                        }
                      }
                    }}
                    onArrowMouseDown={(e) => {
                      if (tool === 'select') {
                        handleArrowMouseDown(arr, e);
                      }
                    }}
                    onVertexDragStart={(idx) => {
                      if (tool === 'select') {
                        setDragVertex({ arrowId: arr.id, vertexIndex: idx });
                      }
                    }}
                  />
                );
              })}

            {/* Currently drawing preview arrow (Head-First!) */}
            {tool === 'draw' && previewArrowPoints && previewArrowPoints.length >= 2 && (
              <ArrowRenderer
                arrow={{
                  id: 'temp_draw',
                  color: activeColorId,
                  points: previewArrowPoints,
                }}
                cellSize={cellSize}
                padding={padding}
                isSelected={true}
                interactive={false}
              />
            )}

            {/* Pulsing Arrow Head & Placed Turn Markers while drawing */}
            {tool === 'draw' && drawPoints.length > 0 && (
              <g className="pointer-events-none">
                {/* Outer pulsing ring on Arrow Head */}
                <circle
                  cx={padding + drawPoints[0].x * cellSize}
                  cy={padding + drawPoints[0].y * cellSize}
                  r={cellSize * 0.44}
                  fill={activeColorHex}
                  fillOpacity={0.25}
                  className="animate-ping"
                />
                {/* Glowing Head badge */}
                <circle
                  cx={padding + drawPoints[0].x * cellSize}
                  cy={padding + drawPoints[0].y * cellSize}
                  r={12}
                  fill={activeColorHex}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}
                />
                <text
                  x={padding + drawPoints[0].x * cellSize}
                  y={padding + drawPoints[0].y * cellSize + 3}
                  textAnchor="middle"
                  className="text-[9px] font-black fill-white pointer-events-none select-none"
                >
                  ▲
                </text>
                {/* Placed turn dots */}
                {drawPoints.slice(1).map((pt, idx) => (
                  <circle
                    key={`placed-turn-${idx}`}
                    cx={padding + pt.x * cellSize}
                    cy={padding + pt.y * cellSize}
                    r={6}
                    fill="#ffffff"
                    stroke={activeColorHex}
                    strokeWidth={2.5}
                  />
                ))}
              </g>
            )}

            {/* Hover Snap Indicator */}
            {hoverGridPos && (
              <circle
                cx={padding + hoverGridPos.x * cellSize}
                cy={padding + hoverGridPos.y * cellSize}
                r={6}
                fill={tool === 'draw' ? activeColorHex : '#3b82f6'}
                fillOpacity={0.4}
                className="pointer-events-none transition-all duration-75"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

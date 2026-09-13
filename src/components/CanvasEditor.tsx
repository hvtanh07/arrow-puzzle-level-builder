import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Arrow, EditorTool, GridSize, Point, SelectionArea, SolvabilityResult } from '../types';
import { ArrowRenderer } from './ArrowRenderer';
import {
  analyzeArrowExit,
  getDirectionVector,
  getHeadDirection,
  getReverseHeadDirection,
  getEffectiveLayer,
  cleanCollinearPoints,
} from '../utils/geometry';
import { getColorHex } from '../constants/colors';
import { sound } from '../utils/sound';
import { Check, X, ZoomIn, ZoomOut, Maximize2, Move, Sparkles } from 'lucide-react';

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
  prebuildAreas?: SelectionArea[];
  prebuildArea?: SelectionArea | null;
  onAddPrebuildArea?: (area: SelectionArea) => void;
  onRemovePrebuildArea?: (idOrIndex: string | number) => void;
  onClearPrebuildAreas?: () => void;
  onSelectPrebuildArea?: (area: SelectionArea | null) => void;
  onTriggerPrebuild?: () => void;
  sourceLevelName?: string;
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
  prebuildAreas = [],
  prebuildArea,
  onAddPrebuildArea,
  onRemovePrebuildArea,
  onClearPrebuildAreas,
  onSelectPrebuildArea,
  onTriggerPrebuild,
  sourceLevelName,
}) => {
  const effectivePrebuildAreas: SelectionArea[] =
    prebuildAreas.length > 0 ? prebuildAreas : prebuildArea ? [prebuildArea] : [];

  const totalPrebuildCells = effectivePrebuildAreas.reduce(
    (sum, a) => sum + (a.maxX - a.minX + 1) * (a.maxY - a.minY + 1),
    0
  );
  // Drawing state
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const [hoverGridPos, setHoverGridPos] = useState<Point | null>(null);

  // Prebuild drag area state
  const [dragAreaStart, setDragAreaStart] = useState<Point | null>(null);
  const [dragAreaCurrent, setDragAreaCurrent] = useState<Point | null>(null);

  // Dragging vertex state
  const [dragVertex, setDragVertex] = useState<{
    arrowId: string;
    vertexIndex: number;
    origPoints: Point[];
    hasMoved: boolean;
  } | null>(null);

  // Dragging segment (line section) state
  const [dragSegment, setDragSegment] = useState<{
    arrowId: string;
    segmentIndex: number;
    isHorizontal: boolean;
    origPoints: Point[];
    hasMoved: boolean;
  } | null>(null);

  // Dragging whole arrow state (via Move Icon only)
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
  // Tool change listener: clear drawing when switching away from draw mode
  useEffect(() => {
    if (tool !== 'draw') {
      setDrawPoints([]);
    }
    if (tool !== 'select') {
      onSelectArrowId(null);
    }
    if (tool !== 'prebuild') {
      setDragAreaStart(null);
      setDragAreaCurrent(null);
    }
  }, [tool]);

  // Drag release and commit handler
  const handleDragRelease = useCallback(() => {
    setIsPanning(false);

    if (dragVertex) {
      if (dragVertex.hasMoved) {
        const arr = arrows.find((a) => a.id === dragVertex.arrowId);
        if (arr) {
          const cleaned = cleanCollinearPoints(arr.points);
          if (cleaned.length >= 2) {
            onChangeArrows(arrows.map((a) => (a.id === arr.id ? { ...a, points: cleaned } : a)));
          } else {
            onChangeArrows(arrows.map((a) => (a.id === arr.id ? { ...a, points: dragVertex.origPoints } : a)));
          }
        }
        sound.playPop();
      }
      setDragVertex(null);
    }

    if (dragSegment) {
      if (dragSegment.hasMoved) {
        const arr = arrows.find((a) => a.id === dragSegment.arrowId);
        if (arr) {
          const cleaned = cleanCollinearPoints(arr.points);
          if (cleaned.length >= 2) {
            onChangeArrows(arrows.map((a) => (a.id === arr.id ? { ...a, points: cleaned } : a)));
          } else {
            onChangeArrows(arrows.map((a) => (a.id === arr.id ? { ...a, points: dragSegment.origPoints } : a)));
          }
        }
        sound.playPop();
      }
      setDragSegment(null);
    }

    if (dragArrow) {
      if (dragArrow.hasMoved) {
        sound.playPop();
      }
      setDragArrow(null);
    }

    if (dragAreaStart) {
      if (dragAreaCurrent) {
        const minX = Math.min(dragAreaStart.x, dragAreaCurrent.x);
        const maxX = Math.max(dragAreaStart.x, dragAreaCurrent.x);
        const minY = Math.min(dragAreaStart.y, dragAreaCurrent.y);
        const maxY = Math.max(dragAreaStart.y, dragAreaCurrent.y);
        const w = maxX - minX + 1;
        const h = maxY - minY + 1;

        if (w >= 2 || h >= 2) {
          const newArea: SelectionArea = {
            id: `area_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            minX,
            maxX,
            minY,
            maxY,
          };
          if (onAddPrebuildArea) {
            onAddPrebuildArea(newArea);
          } else if (onSelectPrebuildArea) {
            onSelectPrebuildArea(newArea);
          }
          sound.playPop();
        }
      }
      setDragAreaStart(null);
      setDragAreaCurrent(null);
    }
  }, [
    dragVertex,
    dragSegment,
    dragArrow,
    dragAreaStart,
    dragAreaCurrent,
    arrows,
    onChangeArrows,
    onAddPrebuildArea,
    onSelectPrebuildArea,
  ]);

  // Global mouseup listener for clean drag release anywhere
  useEffect(() => {
    window.addEventListener('mouseup', handleDragRelease);
    return () => window.removeEventListener('mouseup', handleDragRelease);
  }, [handleDragRelease]);

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
        if (onClearPrebuildAreas) {
          onClearPrebuildAreas();
        } else if (onSelectPrebuildArea) {
          onSelectPrebuildArea(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawPoints, activeColorId, hoverGridPos, tool, onClearPrebuildAreas, onSelectPrebuildArea]);

  // Active dragging area (while user is actively dragging the mouse on canvas)
  const activeDragArea: SelectionArea | null =
    dragAreaStart && dragAreaCurrent
      ? {
          minX: Math.min(dragAreaStart.x, dragAreaCurrent.x),
          maxX: Math.max(dragAreaStart.x, dragAreaCurrent.x),
          minY: Math.min(dragAreaStart.y, dragAreaCurrent.y),
          maxY: Math.max(dragAreaStart.y, dragAreaCurrent.y),
        }
      : null;

  // Handle Arrow Mouse Down (Select mode: select ONLY, does NOT drag arrow)
  const handleArrowMouseDown = (arrow: Arrow, e: React.MouseEvent) => {
    if (tool !== 'select') return;
    if (e.button !== 0) return; // Left mouse button only

    e.stopPropagation();
    onSelectArrowId(arrow.id);
  };

  // Handle Move Handle Mouse Down (Select mode: ONLY way to drag whole arrow)
  const handleMoveHandleMouseDown = (arrow: Arrow, e: React.MouseEvent) => {
    if (tool !== 'select') return;
    if (e.button !== 0) return;

    e.stopPropagation();
    e.preventDefault();

    const { gx, gy } = clientToGrid(e);
    setDragArrow({
      arrowId: arrow.id,
      startMouse: { x: gx, y: gy },
      origPoints: arrow.points.map((p) => ({ ...p })),
      hasMoved: false,
    });
  };

  // Handle Segment Mouse Down (Select mode: drag line section along perpendicular axis)
  const handleSegmentMouseDown = (arrow: Arrow, segmentIndex: number, e: React.MouseEvent) => {
    if (tool !== 'select') return;
    if (e.button !== 0) return;

    e.stopPropagation();
    e.preventDefault();

    const pA = arrow.points[segmentIndex];
    const pB = arrow.points[segmentIndex + 1];
    const isHorizontal = Math.abs(pA.y - pB.y) < 1;

    setDragSegment({
      arrowId: arrow.id,
      segmentIndex,
      isHorizontal,
      origPoints: arrow.points.map((p) => ({ ...p })),
      hasMoved: false,
    });
  };

  // Handle Vertex Drag Start (Select mode: drag endpoint or corner)
  const handleVertexDragStart = (arrow: Arrow, vertexIndex: number, e: React.MouseEvent) => {
    if (tool !== 'select') return;
    if (e.button !== 0) return;

    e.stopPropagation();
    e.preventDefault();

    setDragVertex({
      arrowId: arrow.id,
      vertexIndex,
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
      return;
    }

    // Prebuild mode: start dragging selection rectangle
    if (tool === 'prebuild' && e.button === 0) {
      const { gx, gy } = clientToGrid(e);
      setDragAreaStart({ x: gx, y: gy });
      setDragAreaCurrent({ x: gx, y: gy });
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

    // If dragging prebuild selection rectangle
    if (tool === 'prebuild' && dragAreaStart) {
      setDragAreaCurrent({ x: gx, y: gy });
      return;
    }

    // 1. If dragging single vertex handle in select mode (Strictly 90 degrees!)
    if (dragVertex && tool === 'select') {
      const arrow = arrows.find((a) => a.id === dragVertex.arrowId);
      if (!arrow) return;

      const { vertexIndex, origPoints } = dragVertex;
      const newPoints = origPoints.map((p) => ({ ...p }));
      const n = newPoints.length;

      if (vertexIndex === 0) {
        // Tail point
        const p0 = newPoints[0];
        const p1 = newPoints[1];
        const isHoriz = Math.abs(p0.y - p1.y) < 1;

        if (isHoriz) {
          const clampedX = Math.max(0, Math.min(gridSize.width - 1, gx));
          if (clampedX !== p0.x) {
            newPoints[0].x = clampedX;
            setDragVertex((prev) => (prev ? { ...prev, hasMoved: true } : null));
            onChangeArrows(arrows.map((a) => (a.id === dragVertex.arrowId ? { ...a, points: newPoints } : a)));
          }
        } else {
          const clampedY = Math.max(0, Math.min(gridSize.height - 1, gy));
          if (clampedY !== p0.y) {
            newPoints[0].y = clampedY;
            setDragVertex((prev) => (prev ? { ...prev, hasMoved: true } : null));
            onChangeArrows(arrows.map((a) => (a.id === dragVertex.arrowId ? { ...a, points: newPoints } : a)));
          }
        }
      } else if (vertexIndex === n - 1) {
        // Head point
        const pn1 = newPoints[n - 1];
        const pn2 = newPoints[n - 2];
        const isHoriz = Math.abs(pn1.y - pn2.y) < 1;

        if (isHoriz) {
          const clampedX = Math.max(0, Math.min(gridSize.width - 1, gx));
          if (clampedX !== pn1.x) {
            newPoints[n - 1].x = clampedX;
            setDragVertex((prev) => (prev ? { ...prev, hasMoved: true } : null));
            onChangeArrows(arrows.map((a) => (a.id === dragVertex.arrowId ? { ...a, points: newPoints } : a)));
          }
        } else {
          const clampedY = Math.max(0, Math.min(gridSize.height - 1, gy));
          if (clampedY !== pn1.y) {
            newPoints[n - 1].y = clampedY;
            setDragVertex((prev) => (prev ? { ...prev, hasMoved: true } : null));
            onChangeArrows(arrows.map((a) => (a.id === dragVertex.arrowId ? { ...a, points: newPoints } : a)));
          }
        }
      } else {
        // Interior corner vertex (0 < vertexIndex < n - 1)
        const k = vertexIndex;
        const prevP = newPoints[k - 1];
        const clampedX = Math.max(0, Math.min(gridSize.width - 1, gx));
        const clampedY = Math.max(0, Math.min(gridSize.height - 1, gy));

        const segPrevHoriz = Math.abs(prevP.y - newPoints[k].y) < 1;
        if (segPrevHoriz) {
          // Segment k-1 is horizontal (adjusts Y to clampedY)
          // Segment k is vertical (adjusts X to clampedX)
          newPoints[k - 1].y = clampedY;
          newPoints[k].y = clampedY;
          newPoints[k].x = clampedX;
          newPoints[k + 1].x = clampedX;
        } else {
          // Segment k-1 is vertical (adjusts X to clampedX)
          // Segment k is horizontal (adjusts Y to clampedY)
          newPoints[k - 1].x = clampedX;
          newPoints[k].x = clampedX;
          newPoints[k].y = clampedY;
          newPoints[k + 1].y = clampedY;
        }

        setDragVertex((prev) => (prev ? { ...prev, hasMoved: true } : null));
        onChangeArrows(arrows.map((a) => (a.id === dragVertex.arrowId ? { ...a, points: newPoints } : a)));
      }
      return;
    }

    // 2. If dragging line section (segment) in select mode (Strictly 90 degrees!)
    if (dragSegment && tool === 'select') {
      const arrow = arrows.find((a) => a.id === dragSegment.arrowId);
      if (!arrow) return;

      const { segmentIndex, isHorizontal, origPoints } = dragSegment;
      const newPoints = origPoints.map((p) => ({ ...p }));
      const pA = newPoints[segmentIndex];
      const pB = newPoints[segmentIndex + 1];

      if (isHorizontal) {
        // Horizontal segment moves along Y
        const newY = Math.max(0, Math.min(gridSize.height - 1, gy));
        if (pA.y !== newY || pB.y !== newY) {
          newPoints[segmentIndex].y = newY;
          newPoints[segmentIndex + 1].y = newY;
          setDragSegment((prev) => (prev ? { ...prev, hasMoved: true } : null));
          onChangeArrows(arrows.map((a) => (a.id === dragSegment.arrowId ? { ...a, points: newPoints } : a)));
        }
      } else {
        // Vertical segment moves along X
        const newX = Math.max(0, Math.min(gridSize.width - 1, gx));
        if (pA.x !== newX || pB.x !== newX) {
          newPoints[segmentIndex].x = newX;
          newPoints[segmentIndex + 1].x = newX;
          setDragSegment((prev) => (prev ? { ...prev, hasMoved: true } : null));
          onChangeArrows(arrows.map((a) => (a.id === dragSegment.arrowId ? { ...a, points: newPoints } : a)));
        }
      }
      return;
    }

    // 3. If dragging whole arrow in select mode (via Move Icon)
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
    handleDragRelease();
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
      const movedAny =
        Boolean(dragArrow?.hasMoved) ||
        Boolean(dragSegment?.hasMoved) ||
        Boolean(dragVertex?.hasMoved);
      if (!movedAny) {
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

      {/* Prebuild active banner */}
      {tool === 'prebuild' && (
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md z-10 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>
              <b>Prebuild Mode:</b> Drag on canvas to mark multiple areas to fill with style from <b>{sourceLevelName || 'Previous Level'}</b>.
              {effectivePrebuildAreas.length > 0 && ` (${effectivePrebuildAreas.length} area${effectivePrebuildAreas.length > 1 ? 's' : ''} marked, ${totalPrebuildCells} cells)`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {effectivePrebuildAreas.length > 0 && onTriggerPrebuild && (
              <button
                onClick={onTriggerPrebuild}
                className="px-3 py-1 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg font-bold shadow-xs text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-indigo-600" />
                Fill {effectivePrebuildAreas.length > 1 ? `All ${effectivePrebuildAreas.length} Areas` : 'Area'} with Style
              </button>
            )}
            {effectivePrebuildAreas.length > 0 && (
              <button
                onClick={() => {
                  if (onClearPrebuildAreas) onClearPrebuildAreas();
                  else if (onSelectPrebuildArea) onSelectPrebuildArea(null);
                }}
                className="px-2 py-1 text-indigo-200 hover:text-white rounded-lg cursor-pointer flex items-center gap-1 text-[11px]"
                title="Clear All Marked Areas (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
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
        ) : tool === 'prebuild' ? (
          <span>
            <b>Prebuild Mode:</b> Drag to mark multiple areas • Click <b>✕</b> to remove an area
          </span>
        ) : (
          <span>
            <b>Select Mode:</b> Click to select • Drag <b>✥ Move Handle</b> for whole arrow • Drag line / points to adjust
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
            className={tool === 'draw' || tool === 'prebuild' ? 'cursor-crosshair block' : 'cursor-default block'}
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
              Array.from({ length: gridSize.height }).map((_, row) => {
                const inDragArea =
                  activeDragArea &&
                  col >= activeDragArea.minX &&
                  col <= activeDragArea.maxX &&
                  row >= activeDragArea.minY &&
                  row <= activeDragArea.maxY;

                const inAnyPrebuild =
                  Boolean(inDragArea) ||
                  effectivePrebuildAreas.some(
                    (area) =>
                      col >= area.minX &&
                      col <= area.maxX &&
                      row >= area.minY &&
                      row <= area.maxY
                  );

                return (
                  <circle
                    key={`dot-${col}-${row}`}
                    cx={padding + col * cellSize}
                    cy={padding + row * cellSize}
                    r={inAnyPrebuild ? 4.5 : 3}
                    fill={inAnyPrebuild ? '#6366f1' : '#cbd5e1'}
                    className="pointer-events-none transition-all"
                  />
                );
              })
            )}

            {/* Prebuild Selection Boxes (Multiple Areas) */}
            {effectivePrebuildAreas.map((area, idx) => (
              <g key={area.id || `prebuild-${idx}`}>
                {/* Translucent fill & glowing dashed border */}
                <rect
                  x={padding + area.minX * cellSize - cellSize * 0.42}
                  y={padding + area.minY * cellSize - cellSize * 0.42}
                  width={(area.maxX - area.minX) * cellSize + cellSize * 0.84}
                  height={(area.maxY - area.minY) * cellSize + cellSize * 0.84}
                  rx={14}
                  fill="#6366f1"
                  fillOpacity={0.14}
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  className="pointer-events-none"
                />

                {/* Dimension & Status Badge with Remove button */}
                <g
                  transform={`translate(${
                    padding + area.minX * cellSize - cellSize * 0.42
                  }, ${
                    Math.max(8, padding + area.minY * cellSize - cellSize * 0.42 - 24)
                  })`}
                >
                  <rect
                    x={0}
                    y={0}
                    width={100}
                    height={22}
                    rx={11}
                    fill="#4f46e5"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(79, 70, 229, 0.35))' }}
                  />
                  <text
                    x={40}
                    y={15}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    className="pointer-events-none"
                  >
                    #{idx + 1}: {area.maxX - area.minX + 1}×{area.maxY - area.minY + 1}
                  </text>
                  {/* Remove Area (X) button inside the badge */}
                  <g
                    transform="translate(84, 11)"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemovePrebuildArea) {
                        onRemovePrebuildArea(area.id || idx);
                      } else if (onSelectPrebuildArea) {
                        onSelectPrebuildArea(null);
                      }
                    }}
                  >
                    <circle r={7} fill="#3730a3" />
                    <path
                      d="M -2.5 -2.5 L 2.5 2.5 M 2.5 -2.5 L -2.5 2.5"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                    <title>Remove this area</title>
                  </g>
                </g>
              </g>
            ))}

            {/* Currently Dragging Area Box */}
            {activeDragArea && (
              <g className="pointer-events-none">
                <rect
                  x={padding + activeDragArea.minX * cellSize - cellSize * 0.42}
                  y={padding + activeDragArea.minY * cellSize - cellSize * 0.42}
                  width={(activeDragArea.maxX - activeDragArea.minX) * cellSize + cellSize * 0.84}
                  height={(activeDragArea.maxY - activeDragArea.minY) * cellSize + cellSize * 0.84}
                  rx={14}
                  fill="#818cf8"
                  fillOpacity={0.2}
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                />
                <g
                  transform={`translate(${
                    padding + activeDragArea.minX * cellSize - cellSize * 0.42
                  }, ${
                    Math.max(8, padding + activeDragArea.minY * cellSize - cellSize * 0.42 - 24)
                  })`}
                >
                  <rect x={0} y={0} width={92} height={20} rx={10} fill="#6366f1" />
                  <text x={46} y={14} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                    {activeDragArea.maxX - activeDragArea.minX + 1} × {activeDragArea.maxY - activeDragArea.minY + 1} Area
                  </text>
                </g>
              </g>
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
                const isDraggingThis =
                  dragArrow?.arrowId === arr.id ||
                  dragSegment?.arrowId === arr.id ||
                  dragVertex?.arrowId === arr.id;

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
                        if (!dragArrow?.hasMoved && !dragSegment?.hasMoved && !dragVertex?.hasMoved) {
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
                    onMoveHandleMouseDown={(e) => {
                      if (tool === 'select') {
                        handleMoveHandleMouseDown(arr, e);
                      }
                    }}
                    onSegmentMouseDown={(segIdx, e) => {
                      if (tool === 'select') {
                        handleSegmentMouseDown(arr, segIdx, e);
                      }
                    }}
                    onVertexDragStart={(idx, e) => {
                      if (tool === 'select') {
                        handleVertexDragStart(arr, idx, e);
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

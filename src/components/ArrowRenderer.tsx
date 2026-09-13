import React from 'react';
import { Arrow, Direction, Point } from '../types';
import { getDirectionVector, getHeadDirection, getReverseHeadDirection } from '../utils/geometry';
import { getColorHex } from '../constants/colors';

interface ArrowRendererProps {
  arrow: Arrow;
  cellSize: number;
  padding: number;
  isSelected?: boolean;
  isDeadlocked?: boolean;
  isHinted?: boolean;
  isBlockedTap?: boolean;
  isEscaping?: boolean;
  isTargetForRemoval?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onArrowMouseDown?: (e: React.MouseEvent) => void;
  onMoveHandleMouseDown?: (e: React.MouseEvent) => void;
  onSegmentMouseDown?: (segmentIndex: number, e: React.MouseEvent) => void;
  onVertexDragStart?: (vertexIndex: number, e: React.MouseEvent) => void;
  showHandles?: boolean;
  isDragging?: boolean;
  interactive?: boolean;
}

export const ArrowRenderer: React.FC<ArrowRendererProps> = ({
  arrow,
  cellSize,
  padding,
  isSelected = false,
  isDeadlocked = false,
  isHinted = false,
  isBlockedTap = false,
  isEscaping = false,
  isTargetForRemoval = false,
  onClick,
  onArrowMouseDown,
  onMoveHandleMouseDown,
  onSegmentMouseDown,
  onVertexDragStart,
  showHandles = false,
  isDragging = false,
  interactive = true,
}) => {
  if (arrow.points.length < 2) return null;

  const toPx = (p: Point) => ({
    x: padding + p.x * cellSize,
    y: padding + p.y * cellSize,
  });

  const pxPoints = arrow.points.map(toPx);
  const headPoint = pxPoints[pxPoints.length - 1];
  const dir = getHeadDirection(arrow);
  const dirVec = getDirectionVector(dir);

  // SVG path for the body
  const pathD = pxPoints.reduce((acc, pt, index) => {
    return index === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Calculate forward arrowhead points
  const headSize = cellSize * 0.44;
  const perpX = -dirVec.y;
  const perpY = dirVec.x;

  const tipX = headPoint.x;
  const tipY = headPoint.y;
  const baseX = tipX - dirVec.x * headSize;
  const baseY = tipY - dirVec.y * headSize;

  const leftX = baseX + perpX * (headSize * 0.7);
  const leftY = baseY + perpY * (headSize * 0.7);
  const rightX = baseX - perpX * (headSize * 0.7);
  const rightY = baseY - perpY * (headSize * 0.7);

  const arrowheadD = `M ${tipX} ${tipY} L ${leftX} ${leftY} Q ${baseX} ${baseY} ${rightX} ${rightY} Z`;

  // Element 1: Calculate reverse arrowhead points for double-headed arrows
  let revArrowheadD = '';
  if (arrow.isDoubleHeaded) {
    const revDir = getReverseHeadDirection(arrow);
    const revVec = getDirectionVector(revDir);
    const tailPoint = pxPoints[0];

    const revTipX = tailPoint.x;
    const revTipY = tailPoint.y;
    const revBaseX = revTipX - revVec.x * headSize;
    const revBaseY = revTipY - revVec.y * headSize;

    const revPerpX = -revVec.y;
    const revPerpY = revVec.x;

    const revLeftX = revBaseX + revPerpX * (headSize * 0.7);
    const revLeftY = revBaseY + revPerpY * (headSize * 0.7);
    const revRightX = revBaseX - revPerpX * (headSize * 0.7);
    const revRightY = revBaseY - revPerpY * (headSize * 0.7);

    revArrowheadD = `M ${revTipX} ${revTipY} L ${revLeftX} ${revLeftY} Q ${revBaseX} ${revBaseY} ${revRightX} ${revRightY} Z`;
  }

  // Calculate midpoint along the polyline path for the move icon
  let totalLength = 0;
  const segLengths: number[] = [];
  for (let i = 0; i < pxPoints.length - 1; i++) {
    const len = Math.hypot(pxPoints[i + 1].x - pxPoints[i].x, pxPoints[i + 1].y - pxPoints[i].y);
    segLengths.push(len);
    totalLength += len;
  }
  const halfLength = totalLength / 2;
  let accumulated = 0;
  let moveHandlePos = pxPoints[0];
  for (let i = 0; i < segLengths.length; i++) {
    if (accumulated + segLengths[i] >= halfLength - 0.001) {
      const ratio = segLengths[i] > 0 ? (halfLength - accumulated) / segLengths[i] : 0;
      moveHandlePos = {
        x: pxPoints[i].x + (pxPoints[i + 1].x - pxPoints[i].x) * ratio,
        y: pxPoints[i].y + (pxPoints[i + 1].y - pxPoints[i].y) * ratio,
      };
      break;
    }
    accumulated += segLengths[i];
  }

  // Midpoint vertex pixel for linked badge
  const midIndex = Math.floor(pxPoints.length / 2);
  const midPoint = pxPoints[midIndex];

  const strokeWidth = cellSize * 0.32;

  // Determine stroke color & effects
  const baseColor = getColorHex(arrow.color);

  const cursorStyle = !interactive
    ? 'default'
    : isDragging
    ? 'grabbing'
    : isSelected
    ? 'default'
    : onClick
    ? 'pointer'
    : 'default';

  return (
    <g
      className={`transition-transform ${isDragging || isEscaping ? '' : 'duration-300'} ${
        isBlockedTap ? 'animate-shake' : ''
      } ${isEscaping || !interactive ? 'pointer-events-none' : ''}`}
      style={{
        cursor: cursorStyle,
        transformOrigin: `${headPoint.x}px ${headPoint.y}px`,
        filter: isDragging ? 'drop-shadow(0 14px 24px rgba(0, 0, 0, 0.35))' : undefined,
      }}
      onClick={interactive && !isEscaping ? onClick : undefined}
      onMouseDown={interactive && !isEscaping ? onArrowMouseDown : undefined}
    >
      {/* Outer Selection/Deadlock/Hint/Removal Glow */}
      {(isSelected || isDeadlocked || isHinted || isTargetForRemoval) && (
        <>
          <path
            d={pathD}
            fill="none"
            stroke={isDeadlocked ? '#ef4444' : isTargetForRemoval ? '#f43f5e' : isHinted ? '#eab308' : '#3b82f6'}
            strokeWidth={strokeWidth + 10}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={0.45}
            className={isHinted || isTargetForRemoval ? 'animate-pulse' : ''}
          />
          <path
            d={arrowheadD}
            fill={isDeadlocked ? '#ef4444' : isTargetForRemoval ? '#f43f5e' : isHinted ? '#eab308' : '#3b82f6'}
            fillOpacity={0.45}
          />
          {arrow.isDoubleHeaded && revArrowheadD && (
            <path
              d={revArrowheadD}
              fill={isDeadlocked ? '#ef4444' : isTargetForRemoval ? '#f43f5e' : isHinted ? '#eab308' : '#3b82f6'}
              fillOpacity={0.45}
            />
          )}
        </>
      )}

      {/* Main Arrow Body with Drop Shadow */}
      <path
        d={pathD}
        fill="none"
        stroke={baseColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter:
            typeof arrow.layer === 'number' && arrow.layer > 0
              ? 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.28))'
              : 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.12))',
        }}
      />

      {/* Main Forward Arrow Head */}
      <path
        d={arrowheadD}
        fill={baseColor}
        style={{
          filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.12))',
        }}
      />

      {/* Element 1: Reverse Arrow Head for Double-Headed Arrows */}
      {arrow.isDoubleHeaded && revArrowheadD && (
        <path
          d={revArrowheadD}
          fill={baseColor}
          style={{
            filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.12))',
          }}
        />
      )}

      {/* Inner highlight for 3D look */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255, 255, 255, 0.28)"
        strokeWidth={strokeWidth * 0.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Element 2: Linked Arrow Badge */}
      {arrow.linkedGroupId && (
        <g transform={`translate(${midPoint.x}, ${midPoint.y})`} className="pointer-events-none">
          <circle
            r={cellSize * 0.2}
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth={2}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
          />
          <path
            d="M-4 -1.5 C-5.5 -1.5 -6.5 -0.5 -6.5 1 C-6.5 2.5 -5.5 3.5 -4 3.5 L-1.5 3.5 C0 3.5 1 2.5 1 1 M4 1.5 C5.5 1.5 6.5 0.5 6.5 -1 C6.5 -2.5 5.5 -3.5 4 -3.5 L1.5 -3.5 C0 -3.5 -1 -2.5 -1 -1 M-2 0 L2 0"
            stroke="#ffffff"
            strokeWidth={1.4}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}

      {/* Element 3: Layer indicator badge (when layer > 0 in builder) */}
      {showHandles && typeof arrow.layer === 'number' && arrow.layer > 0 && (
        <g
          transform={`translate(${midPoint.x + cellSize * 0.28}, ${midPoint.y - cellSize * 0.28})`}
          className="pointer-events-none"
        >
          <circle r={8} fill="#3b82f6" stroke="#ffffff" strokeWidth={1.5} />
          <text textAnchor="middle" dy={3} fill="#ffffff" fontSize={9} fontWeight="bold">
            {arrow.layer}
          </text>
        </g>
      )}

      {/* Line Section (Segment) Drag Handles (When selected in Builder mode) */}
      {showHandles &&
        isSelected &&
        !isDragging &&
        pxPoints.slice(0, -1).map((ptA, k) => {
          const ptB = pxPoints[k + 1];
          const isHoriz = Math.abs(ptA.y - ptB.y) < 1;
          const segMidX = (ptA.x + ptB.x) / 2;
          const segMidY = (ptA.y + ptB.y) / 2;
          const cursorClass = isHoriz ? 'cursor-row-resize' : 'cursor-col-resize';

          // Check if segment midpoint is right where the move handle sits (e.g. 2-point arrows)
          const isAtMoveHandle =
            pxPoints.length <= 2 &&
            Math.hypot(segMidX - moveHandlePos.x, segMidY - moveHandlePos.y) < 10;

          return (
            <g key={`seg-${k}`}>
              {/* Wide transparent hit area along the segment line */}
              <line
                x1={ptA.x}
                y1={ptA.y}
                x2={ptB.x}
                y2={ptB.y}
                stroke="transparent"
                strokeWidth={strokeWidth + 14}
                className={`${cursorClass} hover:stroke-blue-400/30 transition-colors`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onSegmentMouseDown?.(k, e);
                }}
              >
                <title>{isHoriz ? 'Drag line section up / down' : 'Drag line section left / right'}</title>
              </line>

              {/* Visual grip bar at segment midpoint (shown when not colliding with move handle) */}
              {!isAtMoveHandle && (
                <g
                  transform={`translate(${segMidX}, ${segMidY})`}
                  className={`${cursorClass} group transition-colors`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onSegmentMouseDown?.(k, e);
                  }}
                >
                  {isHoriz ? (
                    <>
                      <rect
                        x={-11}
                        y={-5}
                        width={22}
                        height={10}
                        rx={5}
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        className="group-hover:stroke-blue-700 group-hover:fill-blue-50 transition-colors"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                      />
                      <line x1={-6} y1={-2} x2={6} y2={-2} stroke="#3b82f6" strokeWidth={1.2} strokeLinecap="round" className="group-hover:stroke-blue-700" />
                      <line x1={-6} y1={2} x2={6} y2={2} stroke="#3b82f6" strokeWidth={1.2} strokeLinecap="round" className="group-hover:stroke-blue-700" />
                    </>
                  ) : (
                    <>
                      <rect
                        x={-5}
                        y={-11}
                        width={10}
                        height={22}
                        rx={5}
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        className="group-hover:stroke-blue-700 group-hover:fill-blue-50 transition-colors"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                      />
                      <line x1={-2} y1={-6} x2={-2} y2={6} stroke="#3b82f6" strokeWidth={1.2} strokeLinecap="round" className="group-hover:stroke-blue-700" />
                      <line x1={2} y1={-6} x2={2} y2={6} stroke="#3b82f6" strokeWidth={1.2} strokeLinecap="round" className="group-hover:stroke-blue-700" />
                    </>
                  )}
                  <title>{isHoriz ? 'Drag line section up / down' : 'Drag line section left / right'}</title>
                </g>
              )}
            </g>
          );
        })}

      {/* Dedicated Move Icon Handle (Only way to drag the whole arrow) */}
      {showHandles && isSelected && !isDragging && (
        <g
          transform={`translate(${moveHandlePos.x}, ${moveHandlePos.y})`}
          className="cursor-move group"
          onMouseDown={(e) => {
            e.stopPropagation();
            onMoveHandleMouseDown?.(e);
          }}
        >
          {/* Circular badge */}
          <circle
            r={15}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth={2.5}
            className="group-hover:stroke-blue-700 group-hover:fill-blue-50 transition-colors"
            style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))' }}
          />
          {/* 4-way move cross vector icon */}
          <path
            d="M 0 -8.5 L -3 -5.5 L -1.2 -5.5 L -1.2 -1.2 L -5.5 -1.2 L -5.5 -3 L -8.5 0 L -5.5 3 L -5.5 1.2 L -1.2 1.2 L -1.2 5.5 L -3 5.5 L 0 8.5 L 3 5.5 L 1.2 5.5 L 1.2 1.2 L 5.5 1.2 L 5.5 3 L 8.5 0 L 5.5 -3 L 5.5 -1.2 L 1.2 -1.2 L 1.2 -5.5 L 3 -5.5 Z"
            fill="#2563eb"
            className="group-hover:fill-blue-700 transition-colors"
          />
          <title>Click and drag to move entire arrow</title>
        </g>
      )}

      {/* Vertex Drag Handles (Builder mode only when selected and not dragging) */}
      {showHandles &&
        isSelected &&
        !isDragging &&
        pxPoints.map((pt, idx) => {
          let vertexCursor = 'cursor-move';
          let vertexTitle = 'Drag corner';
          if (idx === 0) {
            const isHoriz = Math.abs(pxPoints[0].y - pxPoints[1]?.y) < 1;
            vertexCursor = isHoriz ? 'cursor-col-resize' : 'cursor-row-resize';
            vertexTitle = isHoriz ? 'Drag tail horizontally' : 'Drag tail vertically';
          } else if (idx === pxPoints.length - 1) {
            const isHoriz = Math.abs(pxPoints[idx].y - pxPoints[idx - 1]?.y) < 1;
            vertexCursor = isHoriz ? 'cursor-col-resize' : 'cursor-row-resize';
            vertexTitle = isHoriz ? 'Drag head horizontally' : 'Drag head vertically';
          }

          return (
            <circle
              key={`vert-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={strokeWidth * 0.42}
              className={`fill-white stroke-blue-600 stroke-2 hover:fill-blue-500 hover:stroke-blue-700 transition-colors ${vertexCursor}`}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onVertexDragStart?.(idx, e);
              }}
            >
              <title>{vertexTitle}</title>
            </circle>
          );
        })}
    </g>
  );
};

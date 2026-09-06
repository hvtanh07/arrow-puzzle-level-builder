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

  // Midpoint pixel for linked badge
  const midIndex = Math.floor(pxPoints.length / 2);
  const midPoint = pxPoints[midIndex];

  const strokeWidth = cellSize * 0.32;

  // Determine stroke color & effects
  const baseColor = getColorHex(arrow.color);

  const cursorStyle = !interactive
    ? 'default'
    : isDragging
    ? 'grabbing'
    : onArrowMouseDown
    ? 'grab'
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

      {/* Vertex Drag Handles (Builder mode only when selected and not dragging) */}
      {showHandles &&
        isSelected &&
        !isDragging &&
        pxPoints.map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r={strokeWidth * 0.45}
            className="fill-white stroke-blue-600 stroke-2 hover:fill-blue-500 hover:scale-125 transition-all cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              e.stopPropagation();
              onVertexDragStart?.(idx, e);
            }}
          />
        ))}
    </g>
  );
};

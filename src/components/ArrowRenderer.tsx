import React from 'react';
import { Arrow, Direction, Point } from '../types';
import { getDirectionVector, getHeadDirection } from '../utils/geometry';
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
  onVertexDragStart?: (vertexIndex: number, e: React.MouseEvent) => void;
  showHandles?: boolean;
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
  onVertexDragStart,
  showHandles = false,
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

  // Calculate arrowhead points
  const headSize = cellSize * 0.44;
  const perpX = -dirVec.y;
  const perpY = dirVec.x;

  // Arrowhead triangle
  const tipX = headPoint.x;
  const tipY = headPoint.y;
  const baseX = tipX - dirVec.x * headSize;
  const baseY = tipY - dirVec.y * headSize;

  const leftX = baseX + perpX * (headSize * 0.7);
  const leftY = baseY + perpY * (headSize * 0.7);
  const rightX = baseX - perpX * (headSize * 0.7);
  const rightY = baseY - perpY * (headSize * 0.7);

  const arrowheadD = `M ${tipX} ${tipY} L ${leftX} ${leftY} Q ${baseX} ${baseY} ${rightX} ${rightY} Z`;

  const strokeWidth = cellSize * 0.32;

  // Determine stroke color & effects
  const baseColor = getColorHex(arrow.color);

  return (
    <g
      className={`transition-transform duration-300 ${
        isBlockedTap ? 'animate-shake' : ''
      } ${isEscaping ? 'transition-all duration-500 opacity-0 -translate-y-12' : ''}`}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transformOrigin: `${headPoint.x}px ${headPoint.y}px`,
      }}
      onClick={onClick}
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
          filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.12))',
        }}
      />

      {/* Main Arrow Head */}
      <path
        d={arrowheadD}
        fill={baseColor}
        style={{
          filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.12))',
        }}
      />

      {/* Inner highlight for 3D look */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255, 255, 255, 0.28)"
        strokeWidth={strokeWidth * 0.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Vertex Drag Handles (Builder mode only when selected) */}
      {showHandles &&
        isSelected &&
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

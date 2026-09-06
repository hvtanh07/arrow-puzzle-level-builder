import React, { useState } from 'react';
import { Arrow, SolvabilityResult } from '../types';
import { getColorHex } from '../constants/colors';
import { CheckCircle2, AlertTriangle, AlertCircle, PlayCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface LiveSolvabilityBadgeProps {
  result: SolvabilityResult;
  arrows: Arrow[];
  onPreviewSolution?: () => void;
  isPreviewing?: boolean;
}

export const LiveSolvabilityBadge: React.FC<LiveSolvabilityBadgeProps> = ({
  result,
  arrows,
  onPreviewSolution,
  isPreviewing = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const arrowMap = new Map(arrows.map((a) => [a.id, a]));

  const getBadgeStyle = () => {
    if (arrows.length === 0) {
      return {
        bg: 'bg-slate-100 border-slate-300 text-slate-600',
        icon: <AlertCircle className="w-4 h-4 text-slate-500" />,
        title: 'Empty Level',
      };
    }
    if (result.hasOverlaps) {
      return {
        bg: 'bg-amber-50 border-amber-300 text-amber-800 shadow-amber-100',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        title: `${result.overlaps.length} Overlap(s)`,
      };
    }
    if (result.isSolvable) {
      return {
        bg: 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-emerald-100',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        title: `Solvable (${result.stepOrder.length} steps)`,
      };
    }
    return {
      bg: 'bg-rose-50 border-rose-300 text-rose-800 shadow-rose-100',
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      title: 'Deadlock Detected',
    };
  };

  const badge = getBadgeStyle();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-semibold shadow-sm transition-all hover:brightness-95 active:scale-95 ${badge.bg}`}
        title="Click for solvability details"
      >
        {badge.icon}
        <span>{badge.title}</span>
        {arrows.length > 0 && (
          isOpen ? <ChevronUp className="w-3.5 h-3.5 opacity-60" /> : <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && arrows.length > 0 && (
        <div className="absolute top-full mt-2 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Solvability Analysis
            </h4>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                result.isSolvable
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {result.isSolvable ? 'PASSED' : 'DEADLOCKED'}
            </span>
          </div>

          <p className="text-xs text-slate-600 my-3 leading-relaxed">
            {result.message}
          </p>

          {/* Overlaps warning */}
          {result.hasOverlaps && (
            <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <div className="font-semibold mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Overlapping Arrows:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {result.overlaps.map((ov, i) => (
                  <li key={i}>
                    <span className="font-mono">{ov.arrow1Id}</span> & <span className="font-mono">{ov.arrow2Id}</span> share point ({ov.point.x}, {ov.point.y})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Solution Path */}
          {result.isSolvable && result.stepOrder.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Escape Order ({result.stepOrder.length} taps):
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                {result.stepOrder.map((arrowId, idx) => {
                  const arrow = arrowMap.get(arrowId);
                  return (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs"
                    >
                      <span className="text-[10px] font-bold text-slate-400 w-3.5 text-center">
                        {idx + 1}.
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getColorHex(arrow?.color) }}
                      />
                      <span className="font-mono text-[11px] truncate max-w-[80px]">
                        {arrowId}
                      </span>
                    </div>
                  );
                })}
              </div>

              {onPreviewSolution && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onPreviewSolution();
                  }}
                  disabled={isPreviewing}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-98"
                >
                  <PlayCircle className="w-4 h-4" />
                  {isPreviewing ? 'Previewing Solution...' : 'Auto-Solve Preview'}
                </button>
              )}
            </div>
          )}

          {/* Deadlock details */}
          {!result.isSolvable && result.deadlockedArrowIds.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-rose-700">
                Trapped Arrows ({result.deadlockedArrowIds.length}):
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-rose-50/50 rounded-xl border border-rose-100 text-xs">
                {result.deadlockedArrowIds.map((id) => {
                  const blockers = result.blockingGraph[id] || [];
                  const arrow = arrowMap.get(id);
                  return (
                    <div key={id} className="flex items-start gap-1.5 text-[11px]">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0"
                        style={{ backgroundColor: getColorHex(arrow?.color) }}
                      />
                      <div>
                        <span className="font-mono font-bold text-slate-700">{id}</span>
                        {blockers.length > 0 ? (
                          <span className="text-slate-500"> is blocked by <span className="font-mono font-semibold text-rose-600">{blockers.join(', ')}</span></span>
                        ) : (
                          <span className="text-slate-500"> is blocked</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

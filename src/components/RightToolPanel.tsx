import React from 'react';
import { Arrow, EditorTool, GridSize } from '../types';
import { COLOR_TYPES, getColorId } from '../constants/colors';
import {
  Pencil,
  MousePointer,
  Trash2,
  Copy,
  FlipHorizontal,
  Eye,
  EyeOff,
  Grid,
  RotateCcw,
  Undo,
  Redo,
  Check,
  Palette,
  Wrench,
  Hash,
} from 'lucide-react';

interface RightToolPanelProps {
  tool: EditorTool;
  onSelectTool: (t: EditorTool) => void;
  activeColorId: number;
  onSelectColorId: (id: number) => void;
  selectedArrow: Arrow | null;
  onReverseArrow: () => void;
  onDuplicateArrow: () => void;
  onDeleteArrow: () => void;
  gridSize: GridSize;
  onChangeGridSize: (size: GridSize) => void;
  showRays: boolean;
  onToggleRays: () => void;
  showCoords: boolean;
  onToggleCoords: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClearBoard: () => void;
  arrowCount: number;
}

export const RightToolPanel: React.FC<RightToolPanelProps> = ({
  tool,
  onSelectTool,
  activeColorId,
  onSelectColorId,
  selectedArrow,
  onReverseArrow,
  onDuplicateArrow,
  onDeleteArrow,
  gridSize,
  onChangeGridSize,
  showRays,
  onToggleRays,
  showCoords,
  onToggleCoords,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearBoard,
  arrowCount,
}) => {
  return (
    <aside className="w-72 sm:w-80 h-full bg-white border-l border-slate-200 flex flex-col shrink-0 z-20 shadow-xs select-none overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Level Inspector</h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-25"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-25"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Tool Mode Selection */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Tool
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectTool('draw')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                tool === 'draw'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Pencil className="w-4 h-4" />
              <span>Draw (D)</span>
            </button>

            <button
              onClick={() => onSelectTool('select')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                tool === 'select'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <MousePointer className="w-4 h-4" />
              <span>Select (S)</span>
            </button>
          </div>
        </div>

        {/* 8 Colors Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              Colors (8 Types)
            </label>
            <span className="text-[11px] text-slate-400 font-mono">ID: {activeColorId}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {COLOR_TYPES.map((c) => {
              const isSelected = activeColorId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectColorId(c.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs bg-blue-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 shadow-2xs relative"
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 truncate">{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold px-1 rounded bg-slate-100">
                      {c.id}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Arrow Properties */}
        {selectedArrow && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200/60">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-amber-600" />
                {selectedArrow.id}
              </span>
              <span className="text-[10px] font-mono text-amber-700">
                {selectedArrow.points.length} points
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={onReverseArrow}
                className="flex flex-col items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-amber-100 text-amber-800 rounded-xl text-[11px] font-semibold border border-amber-200 transition-colors shadow-2xs"
                title="Reverse Direction"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-amber-600" />
                <span>Flip</span>
              </button>

              <button
                onClick={onDuplicateArrow}
                className="flex flex-col items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-amber-100 text-amber-800 rounded-xl text-[11px] font-semibold border border-amber-200 transition-colors shadow-2xs"
                title="Duplicate Arrow"
              >
                <Copy className="w-3.5 h-3.5 text-amber-600" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={onDeleteArrow}
                className="flex flex-col items-center justify-center gap-1 py-1.5 px-2 bg-white hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-semibold border border-rose-200 transition-colors shadow-2xs"
                title="Delete Arrow"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* Grid Size Configuration: Manual X and Y inputs */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Grid className="w-3.5 h-3.5 text-slate-400" />
            Grid Size (X & Y)
          </label>

          {/* Width (X) and Height (Y) inputs */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Width (X / Cols)
              </span>
              <div className="flex items-center justify-between mt-1">
                <button
                  onClick={() => onChangeGridSize({ ...gridSize, width: Math.max(3, gridSize.width - 1) })}
                  className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-xs active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={gridSize.width}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 3 && val <= 30) {
                      onChangeGridSize({ ...gridSize, width: val });
                    }
                  }}
                  className="w-12 text-center font-bold text-sm bg-transparent outline-none text-slate-800"
                />
                <button
                  onClick={() => onChangeGridSize({ ...gridSize, width: Math.min(30, gridSize.width + 1) })}
                  className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-xs active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Height (Y / Rows)
              </span>
              <div className="flex items-center justify-between mt-1">
                <button
                  onClick={() => onChangeGridSize({ ...gridSize, height: Math.max(3, gridSize.height - 1) })}
                  className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-xs active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={gridSize.height}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 3 && val <= 30) {
                      onChangeGridSize({ ...gridSize, height: val });
                    }
                  }}
                  className="w-12 text-center font-bold text-sm bg-transparent outline-none text-slate-800"
                />
                <button
                  onClick={() => onChangeGridSize({ ...gridSize, height: Math.min(30, gridSize.height + 1) })}
                  className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-xs active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1">
            {[
              { label: '6×6', w: 6, h: 6 },
              { label: '7×7', w: 7, h: 7 },
              { label: '8×8', w: 8, h: 8 },
              { label: '8×9 (Game)', w: 8, h: 9 },
              { label: '10×10', w: 10, h: 10 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => onChangeGridSize({ width: preset.w, height: preset.h })}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                  gridSize.width === preset.w && gridSize.height === preset.h
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggles & Helpers */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Display Options
          </label>
          <div className="space-y-2">
            <button
              onClick={onToggleRays}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                showRays
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {showRays ? <Eye className="w-4 h-4 text-indigo-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                <span>Escape Trajectories</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  showRays ? 'bg-indigo-200/60 text-indigo-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {showRays ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={onToggleCoords}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                showCoords
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <span>Coordinate Labels</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  showCoords ? 'bg-blue-200/60 text-blue-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {showCoords ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Clear Board Action */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onClearBoard}
            disabled={arrowCount === 0}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 text-xs font-bold transition-all disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Clear Board Canvas</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

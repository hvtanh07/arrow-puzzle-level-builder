import React, { useState } from 'react';
import { Level } from '../types';
import { solveLevel } from '../utils/solver';
import { exportLevelToJson, exportAllLevelsToJson, importLevelFromJson } from '../utils/jsonHandler';
import { sound } from '../utils/sound';
import {
  Plus,
  Play,
  Pencil,
  Trash2,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Search,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  FolderDown,
  X,
  Layers,
} from 'lucide-react';

interface LeftLevelPanelProps {
  levels: Level[];
  currentLevelId: string;
  onSelectLevel: (levelId: string) => void;
  onPlayLevel: (levelId: string) => void;
  onCreateLevel: () => void;
  onDuplicateLevel: (levelId: string) => void;
  onDeleteLevel: (levelId: string) => void;
  onRenameLevel: (levelId: string, newName: string) => void;
  onRestoreDefaults: () => void;
  onImportLevels: (imported: Level | Level[]) => void;
}

export const LeftLevelPanel: React.FC<LeftLevelPanelProps> = ({
  levels,
  currentLevelId,
  onSelectLevel,
  onPlayLevel,
  onCreateLevel,
  onDuplicateLevel,
  onDeleteLevel,
  onRenameLevel,
  onRestoreDefaults,
  onImportLevels,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Export Modal state
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [exportTitle, setExportTitle] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const filteredLevels = levels.filter((lvl) =>
    lvl.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportSingle = (level: Level) => {
    sound.playClick();
    const json = exportLevelToJson(level);
    setExportTitle(`Export: ${level.name}`);
    setExportJson(json);
  };

  const handleExportAll = () => {
    sound.playClick();
    const json = exportAllLevelsToJson(levels);
    setExportTitle(`Export All Levels (${levels.length} levels)`);
    setExportJson(json);
  };

  const handleCopyExport = () => {
    if (!exportJson) return;
    navigator.clipboard.writeText(exportJson);
    setCopied(true);
    sound.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadExport = () => {
    if (!exportJson) return;
    sound.playClick();
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportTitle.includes('All') ? 'arrow_levels_pack.json' : 'level.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDoImport = () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError('Please paste JSON data to import');
      return;
    }

    const res = importLevelFromJson(importText);
    if (!res.success) {
      setImportError(res.error || 'Failed to parse JSON');
      return;
    }

    sound.playClick();
    if (res.levels) {
      onImportLevels(res.levels);
    } else if (res.level) {
      onImportLevels(res.level);
    }

    setIsImportModalOpen(false);
    setImportText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  return (
    <aside className="w-72 sm:w-80 h-full bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-xs select-none">
      {/* Panel Top Title */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-800 text-sm">Levels</h3>
          <span className="text-[11px] bg-slate-200/80 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">
            {levels.length}
          </span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onCreateLevel();
          }}
          className="flex items-center gap-1 py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition-all active:scale-95"
          title="Create New Level"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Quick Search & JSON Actions */}
      <div className="p-3 border-b border-slate-100 flex flex-col gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search levels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-all border border-slate-200"
            title="Import Level JSON"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          <button
            onClick={handleExportAll}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-all border border-slate-200"
            title="Export All to JSON"
          >
            <FolderDown className="w-3.5 h-3.5" />
            <span>Export All</span>
          </button>
        </div>
      </div>

      {/* Scrollable Level List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredLevels.map((lvl) => {
          const isCurrent = lvl.id === currentLevelId;
          const solv = solveLevel(lvl.arrows, lvl.gridSize);

          return (
            <div
              key={lvl.id}
              onClick={() => {
                if (!isCurrent) {
                  sound.playClick();
                  onSelectLevel(lvl.id);
                }
              }}
              className={`group flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              {/* Top Row: Title & Solvability Badge */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex-1 min-w-0">
                  {editingId === lvl.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onRenameLevel(lvl.id, editName);
                            setEditingId(null);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        className="px-1.5 py-0.5 text-xs font-bold border rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          onRenameLevel(lvl.id, editName);
                          setEditingId(null);
                        }}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold text-xs truncate ${
                          isCurrent ? 'text-blue-900' : 'text-slate-800'
                        }`}
                      >
                        {lvl.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(lvl.id);
                          setEditName(lvl.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 transition-opacity"
                        title="Rename Level"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-slate-500">
                      {lvl.gridSize.width}×{lvl.gridSize.height}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {lvl.arrows.length} arrows
                    </span>
                  </div>
                </div>

                {/* Solvability Badge */}
                <div
                  className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    solv.isSolvable
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                  title={solv.message}
                >
                  {solv.isSolvable ? (
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  ) : (
                    <AlertTriangle className="w-2.5 h-2.5" />
                  )}
                  <span>{solv.isSolvable ? 'Solvable' : 'Deadlock'}</span>
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    onPlayLevel(lvl.id);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs"
                  title="Play Test this level"
                >
                  <Play className="w-2.5 h-2.5 fill-white" />
                  <span>Play</span>
                </button>

                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleExportSingle(lvl)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Export JSON"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDuplicateLevel(lvl.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Duplicate Level"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onDeleteLevel(lvl.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete Level"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-center">
        <button
          onClick={onRestoreDefaults}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-600 font-semibold transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Restore 10 Premade Levels</span>
        </button>
      </div>

      {/* Export JSON Modal */}
      {exportJson && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">{exportTitle}</h4>
              </div>
              <button
                onClick={() => setExportJson(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-2">
              Minimal JSON format containing only level parameters and arrow definitions.
            </p>

            <textarea
              readOnly
              value={exportJson}
              rows={12}
              className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            />

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={handleCopyExport}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={handleDownloadExport}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download .json</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-800 text-sm">Import Level JSON</h4>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-2">
              Paste single level JSON or full level pack JSON, or select a file.
            </p>

            <div className="mb-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <textarea
              placeholder="Paste level JSON here..."
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError(null);
              }}
              rows={10}
              className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            />

            {importError && (
              <div className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl">
                {importError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError(null);
                }}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleDoImport}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Validate & Import</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

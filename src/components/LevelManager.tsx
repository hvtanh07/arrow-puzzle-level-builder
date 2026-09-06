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
  X,
  Search,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  FolderDown,
} from 'lucide-react';

interface LevelManagerProps {
  isOpen: boolean;
  onClose: () => void;
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

export const LevelManager: React.FC<LevelManagerProps> = ({
  isOpen,
  onClose,
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Level Management</h3>
            <p className="text-xs text-slate-500">{levels.length} levels stored</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onCreateLevel();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>New Level</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all border border-slate-200"
              title="Import JSON"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>

            <button
              onClick={handleExportAll}
              className="flex items-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all border border-slate-200"
              title="Export All to JSON"
            >
              <FolderDown className="w-4 h-4" />
              <span>Export All</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search levels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Level List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
          {filteredLevels.map((lvl) => {
            const isCurrent = lvl.id === currentLevelId;
            const solv = solveLevel(lvl.arrows, lvl.gridSize);

            return (
              <div
                key={lvl.id}
                className={`pt-2.5 first:pt-0 group flex flex-col p-3 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-300'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {/* Level Title & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === lvl.id ? (
                      <div className="flex items-center gap-1">
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
                          className="px-2 py-0.5 text-xs font-bold border rounded-lg w-full"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            onRenameLevel(lvl.id, editName);
                            setEditingId(null);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 truncate">
                          {lvl.name}
                        </span>
                        <button
                          onClick={() => {
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

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        {lvl.gridSize.width}×{lvl.gridSize.height} grid
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {lvl.arrows.length} arrows
                      </span>
                    </div>
                  </div>

                  {/* Solvability Badge */}
                  <div
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      solv.isSolvable
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {solv.isSolvable ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    <span>{solv.isSolvable ? 'Solvable' : 'Deadlock'}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        sound.playClick();
                        onSelectLevel(lvl.id);
                        onClose();
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{isCurrent ? 'Editing' : 'Edit'}</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playClick();
                        onPlayLevel(lvl.id);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Play</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleExportSingle(lvl)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Export JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDuplicateLevel(lvl.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Duplicate Level"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteLevel(lvl.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete Level"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onRestoreDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore 10 Premade Levels</span>
          </button>
        </div>
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
    </div>
  );
};

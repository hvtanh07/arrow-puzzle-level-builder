import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Arrow, EditorTool, GridSize, Level, SelectionArea } from './types';
import { PREMADE_LEVELS } from './data/premadeLevels';
import { CanvasEditor } from './components/CanvasEditor';
import { LeftLevelPanel } from './components/LeftLevelPanel';
import { RightToolPanel } from './components/RightToolPanel';
import { PlayTestView } from './components/PlayTestView';
import { LiveSolvabilityBadge } from './components/LiveSolvabilityBadge';
import { solveLevel } from './utils/solver';
import { sound } from './utils/sound';
import { analyzeLevelStyle } from './utils/styleAnalyzer';
import { generateStyledArrowsForMultipleAreas } from './utils/prebuildGenerator';
import {
  Play,
  Pencil,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';

const STORAGE_KEY = 'arrow_levels_v3';

export const App: React.FC = () => {
  // Level manager state
  const [levels, setLevels] = useState<Level[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved levels:', e);
      }
    }
    // Check previous versions to preserve any custom user levels, while updating premade levels
    const oldSaved = localStorage.getItem('arrow_levels_v2') || localStorage.getItem('arrow_levels');
    if (oldSaved) {
      try {
        const oldParsed: Level[] = JSON.parse(oldSaved);
        if (Array.isArray(oldParsed) && oldParsed.length > 0) {
          const customLevels = oldParsed.filter((ol) => !PREMADE_LEVELS.some((pl) => pl.id === ol.id));
          return [...PREMADE_LEVELS, ...customLevels];
        }
      } catch (e) {
        console.error('Failed to parse old saved levels:', e);
      }
    }
    return PREMADE_LEVELS;
  });

  const [currentLevelId, setCurrentLevelId] = useState<string>(() => {
    return levels[0]?.id || 'level-1';
  });

  const [mode, setMode] = useState<'builder' | 'playtest'>('builder');

  // Editor states (shared between Canvas and Right Inspector)
  const [tool, setTool] = useState<EditorTool>('draw');
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [activeColorId, setActiveColorId] = useState<number>(1); // Blue = 1
  const [showRays, setShowRays] = useState<boolean>(false);
  const [showCoords, setShowCoords] = useState<boolean>(true);

  // Prebuild Areas state & style reference level
  const [prebuildAreas, setPrebuildAreas] = useState<SelectionArea[]>([]);
  const [referenceLevelId, setReferenceLevelId] = useState<string>('');

  // Interactive Arrow Linking Mode (Element 2)
  const [linkingSourceArrowId, setLinkingSourceArrowId] = useState<string | null>(null);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto-solve preview state
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewArrows, setPreviewArrows] = useState<Arrow[] | null>(null);

  // Save to localStorage whenever levels change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
  }, [levels]);

  // Current active level object
  const currentLevel = useMemo(() => {
    return levels.find((l) => l.id === currentLevelId) || levels[0] || PREMADE_LEVELS[0];
  }, [levels, currentLevelId]);

  const currentIndex = levels.findIndex((l) => l.id === currentLevel.id);
  const prevLevel = currentIndex > 0 ? levels[currentIndex - 1] : null;

  // Initialize reference level default to the previous level
  useEffect(() => {
    const idx = levels.findIndex((l) => l.id === currentLevelId);
    if (idx > 0) {
      setReferenceLevelId(levels[idx - 1].id);
    } else if (levels.length > 1) {
      setReferenceLevelId(levels[1].id);
    } else {
      setReferenceLevelId(levels[0]?.id || '');
    }
    setPrebuildAreas([]);
    setLinkingSourceArrowId(null);
  }, [currentLevelId, levels]);

  useEffect(() => {
    setLinkingSourceArrowId(null);
  }, [mode]);

  // Reference level object used for style analysis
  const referenceLevel = useMemo(() => {
    return levels.find((l) => l.id === referenceLevelId) || prevLevel || currentLevel;
  }, [levels, referenceLevelId, prevLevel, currentLevel]);

  // Style profile of the reference level
  const styleProfile = useMemo(() => {
    if (!referenceLevel) return null;
    return analyzeLevelStyle(referenceLevel);
  }, [referenceLevel]);

  // Selected arrow object
  const selectedArrow = useMemo(() => {
    return currentLevel.arrows.find((a) => a.id === selectedArrowId) || null;
  }, [currentLevel.arrows, selectedArrowId]);

  // Active arrows to display
  const displayArrows = previewArrows !== null ? previewArrows : currentLevel.arrows;

  // Live Solvability Calculation
  const solvability = useMemo(() => {
    return solveLevel(currentLevel.arrows, currentLevel.gridSize);
  }, [currentLevel.arrows, currentLevel.gridSize]);

  // History stack for Undo/Redo
  const [history, setHistory] = useState<Arrow[][]>([currentLevel.arrows]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Reset history and selection when switching levels
  useEffect(() => {
    setHistory([currentLevel.arrows]);
    setHistoryIndex(0);
    setPreviewArrows(null);
    setIsPreviewing(false);
    setSelectedArrowId(null);
  }, [currentLevelId]);

  // Trigger procedural prebuild fill across all marked areas
  const handleTriggerPrebuild = () => {
    if (prebuildAreas.length === 0) return;
    if (!styleProfile) return;

    sound.playClick();
    const result = generateStyledArrowsForMultipleAreas({
      areas: prebuildAreas,
      existingArrows: currentLevel.arrows,
      gridSize: currentLevel.gridSize,
      style: styleProfile,
    });

    if (result.success) {
      sound.playVictory();
      updateCurrentLevelArrows(result.arrows);
      setPrebuildAreas([]);
    } else {
      sound.playWhoosh();
      alert(result.message);
    }
  };

  const handleAddPrebuildArea = (area: SelectionArea) => {
    setPrebuildAreas((prev) => [
      ...prev,
      {
        ...area,
        id: area.id || `area_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      },
    ]);
  };

  const handleRemovePrebuildArea = (idOrIndex: string | number) => {
    sound.playPop();
    setPrebuildAreas((prev) =>
      typeof idOrIndex === 'number'
        ? prev.filter((_, idx) => idx !== idOrIndex)
        : prev.filter((a, idx) => (a.id ? a.id !== idOrIndex : idx !== Number(idOrIndex)))
    );
  };

  const handleClearPrebuildAreas = () => {
    setPrebuildAreas([]);
  };

  const updateCurrentLevelArrows = (newArrows: Arrow[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newArrows);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);

    setLevels((prev) =>
      prev.map((lvl) => (lvl.id === currentLevel.id ? { ...lvl, arrows: newArrows } : lvl))
    );
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      sound.playClick();
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      const arrows = history[newIdx];
      setLevels((prev) =>
        prev.map((lvl) => (lvl.id === currentLevel.id ? { ...lvl, arrows } : lvl))
      );
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      sound.playClick();
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      const arrows = history[newIdx];
      setLevels((prev) =>
        prev.map((lvl) => (lvl.id === currentLevel.id ? { ...lvl, arrows } : lvl))
      );
    }
  };

  const updateCurrentLevelGridSize = (newSize: GridSize) => {
    sound.playClick();
    setLevels((prev) =>
      prev.map((lvl) => (lvl.id === currentLevel.id ? { ...lvl, gridSize: newSize } : lvl))
    );
  };

  // Reverse selected arrow
  const handleReverseArrow = () => {
    if (!selectedArrow) return;
    sound.playClick();
    const reversed = [...selectedArrow.points].reverse();
    updateCurrentLevelArrows(
      currentLevel.arrows.map((a) =>
        a.id === selectedArrow.id ? { ...a, points: reversed } : a
      )
    );
  };

  // Duplicate selected arrow
  const handleDuplicateArrow = () => {
    if (!selectedArrow) return;
    sound.playClick();
    const shifted = selectedArrow.points.map((p) => ({
      x: Math.min(currentLevel.gridSize.width - 1, p.x + 1),
      y: Math.min(currentLevel.gridSize.height - 1, p.y + 1),
    }));
    const newArrow: Arrow = {
      id: `arrow_${Date.now().toString(36).substr(-4)}`,
      color: selectedArrow.color,
      points: shifted,
    };
    updateCurrentLevelArrows([...currentLevel.arrows, newArrow]);
    setSelectedArrowId(newArrow.id);
  };

  // Delete selected arrow
  const handleDeleteArrow = () => {
    if (!selectedArrowId) return;
    sound.playClick();
    const toDelete = currentLevel.arrows.find((a) => a.id === selectedArrowId);
    if (toDelete?.linkedGroupId) {
      const oldGroupId = toDelete.linkedGroupId;
      const remaining = currentLevel.arrows.filter(
        (a) => a.id !== selectedArrowId && a.linkedGroupId === oldGroupId
      );
      if (remaining.length <= 1) {
        updateCurrentLevelArrows(
          currentLevel.arrows
            .filter((a) => a.id !== selectedArrowId)
            .map((a) => (a.linkedGroupId === oldGroupId ? { ...a, linkedGroupId: undefined } : a))
        );
        setSelectedArrowId(null);
        setLinkingSourceArrowId(null);
        return;
      }
    }
    updateCurrentLevelArrows(currentLevel.arrows.filter((a) => a.id !== selectedArrowId));
    setSelectedArrowId(null);
    setLinkingSourceArrowId(null);
  };

  // Element 1: Toggle double-headed arrow
  const handleToggleDoubleHeaded = () => {
    if (!selectedArrow) return;
    sound.playClick();
    updateCurrentLevelArrows(
      currentLevel.arrows.map((a) =>
        a.id === selectedArrow.id ? { ...a, isDoubleHeaded: !a.isDoubleHeaded } : a
      )
    );
  };

  // Element 2: Interactive Arrow Linking Handlers
  const handleStartLinking = (sourceArrowId: string) => {
    sound.playClick();
    setTool('select');
    setLinkingSourceArrowId(sourceArrowId);
    setSelectedArrowId(sourceArrowId);
  };

  const handleCancelLinking = () => {
    sound.playClick();
    setLinkingSourceArrowId(null);
  };

  const handleCompleteLinking = (targetArrowId: string) => {
    if (!linkingSourceArrowId || linkingSourceArrowId === targetArrowId) return;
    sound.playClick();

    const sourceArrow = currentLevel.arrows.find((a) => a.id === linkingSourceArrowId);
    const targetArrow = currentLevel.arrows.find((a) => a.id === targetArrowId);
    if (!sourceArrow || !targetArrow) {
      setLinkingSourceArrowId(null);
      return;
    }

    const groupId =
      targetArrow.linkedGroupId ||
      sourceArrow.linkedGroupId ||
      `link_${Date.now().toString(36).substr(-4)}`;

    updateCurrentLevelArrows(
      currentLevel.arrows.map((a) => {
        if (a.id === sourceArrow.id || a.id === targetArrow.id) {
          return { ...a, linkedGroupId: groupId };
        }
        return a;
      })
    );
    setLinkingSourceArrowId(null);
  };

  // Direct Link / Unlink arrow
  const handleLinkArrow = (targetArrowId: string | null) => {
    if (!selectedArrow) return;
    sound.playClick();
    if (!targetArrowId) {
      const oldGroupId = selectedArrow.linkedGroupId;
      if (oldGroupId) {
        const remaining = currentLevel.arrows.filter(
          (a) => a.linkedGroupId === oldGroupId && a.id !== selectedArrow.id
        );
        if (remaining.length <= 1) {
          updateCurrentLevelArrows(
            currentLevel.arrows.map((a) =>
              a.linkedGroupId === oldGroupId ? { ...a, linkedGroupId: undefined } : a
            )
          );
          setLinkingSourceArrowId(null);
          return;
        }
      }
      updateCurrentLevelArrows(
        currentLevel.arrows.map((a) =>
          a.id === selectedArrow.id ? { ...a, linkedGroupId: undefined } : a
        )
      );
      setLinkingSourceArrowId(null);
      return;
    }

    const targetArrow = currentLevel.arrows.find((a) => a.id === targetArrowId);
    if (!targetArrow) return;

    const groupId =
      targetArrow.linkedGroupId ||
      selectedArrow.linkedGroupId ||
      `link_${Date.now().toString(36).substr(-4)}`;

    updateCurrentLevelArrows(
      currentLevel.arrows.map((a) => {
        if (a.id === selectedArrow.id || a.id === targetArrow.id) {
          return { ...a, linkedGroupId: groupId };
        }
        return a;
      })
    );
    setLinkingSourceArrowId(null);
  };

  // Element 3: Layer adjustments
  const handleChangeLayer = (delta: number, isAbsolute: boolean = false) => {
    if (!selectedArrow) return;
    sound.playClick();
    const curLayer = selectedArrow.layer ?? 0;
    const newLayer = isAbsolute ? delta : Math.max(0, curLayer + delta);
    updateCurrentLevelArrows(
      currentLevel.arrows.map((a) =>
        a.id === selectedArrow.id ? { ...a, layer: newLayer } : a
      )
    );
  };

  const handleBringToFront = () => {
    if (!selectedArrow) return;
    sound.playClick();
    const maxLayer = Math.max(0, ...currentLevel.arrows.map((a) => a.layer ?? 0));
    handleChangeLayer(maxLayer + 1, true);
  };

  const handleSendToBack = () => {
    if (!selectedArrow) return;
    sound.playClick();
    handleChangeLayer(0, true);
  };

  // Clear canvas
  const handleClearBoard = () => {
    if (currentLevel.arrows.length > 0 && confirm('Clear all arrows from this level?')) {
      sound.playClick();
      updateCurrentLevelArrows([]);
      setSelectedArrowId(null);
    }
  };

  // Color change: if an arrow is selected, change its color; also set active color
  const handleSelectColorId = (id: number) => {
    setActiveColorId(id);
    if (selectedArrowId) {
      sound.playClick();
      updateCurrentLevelArrows(
        currentLevel.arrows.map((a) =>
          a.id === selectedArrowId ? { ...a, color: id } : a
        )
      );
    }
  };

  // Create new level
  const handleCreateLevel = () => {
    const newId = `level_${Date.now().toString(36)}`;
    const newLvl: Level = {
      id: newId,
      name: `Level ${levels.length + 1}`,
      gridSize: { width: 8, height: 8 },
      arrows: [],
    };
    setLevels([...levels, newLvl]);
    setCurrentLevelId(newId);
    setMode('builder');
  };

  // Duplicate level
  const handleDuplicateLevel = (levelId: string) => {
    const src = levels.find((l) => l.id === levelId);
    if (!src) return;

    const dupId = `level_${Date.now().toString(36)}`;
    const dupLvl: Level = {
      ...src,
      id: dupId,
      name: `${src.name} (Copy)`,
      arrows: src.arrows.map((a) => ({
        ...a,
        id: `arrow_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 3)}`,
        points: a.points.map((p) => ({ ...p })),
      })),
    };
    setLevels([...levels, dupLvl]);
    setCurrentLevelId(dupId);
  };

  // Delete level
  const handleDeleteLevel = (levelId: string) => {
    if (levels.length <= 1) {
      alert('Cannot delete the last remaining level.');
      return;
    }
    if (confirm('Are you sure you want to delete this level?')) {
      const filtered = levels.filter((l) => l.id !== levelId);
      setLevels(filtered);
      if (currentLevelId === levelId) {
        setCurrentLevelId(filtered[0].id);
      }
    }
  };

  // Rename level
  const handleRenameLevel = (levelId: string, newName: string) => {
    if (!newName.trim()) return;
    setLevels((prev) =>
      prev.map((l) => (l.id === levelId ? { ...l, name: newName.trim() } : l))
    );
  };

  // Restore defaults
  const handleRestoreDefaults = () => {
    if (confirm('Restore the original 10 premade levels? (Custom levels will be replaced)')) {
      setLevels(PREMADE_LEVELS);
      setCurrentLevelId('level-9');
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Import JSON levels
  const handleImportLevels = (imported: Level | Level[]) => {
    if (Array.isArray(imported)) {
      setLevels(imported);
      if (imported.length > 0) {
        setCurrentLevelId(imported[0].id);
      }
    } else {
      const existingIdx = levels.findIndex((l) => l.id === imported.id);
      if (existingIdx >= 0) {
        const updated = [...levels];
        updated[existingIdx] = imported;
        setLevels(updated);
      } else {
        setLevels([...levels, imported]);
      }
      setCurrentLevelId(imported.id);
    }
  };

  // Auto-Solve Preview
  const handlePreviewSolution = () => {
    if (!solvability.isSolvable || solvability.stepOrder.length === 0 || isPreviewing) return;

    setIsPreviewing(true);
    const original = [...currentLevel.arrows];
    setPreviewArrows(original);

    let remaining = [...original];
    let step = 0;

    const interval = setInterval(() => {
      if (step < solvability.stepOrder.length) {
        const arrowToEscapeId = solvability.stepOrder[step];
        remaining = remaining.filter((a) => a.id !== arrowToEscapeId);
        setPreviewArrows([...remaining]);
        sound.playWhoosh();
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setPreviewArrows(null);
          setIsPreviewing(false);
          sound.playVictory();
        }, 600);
      }
    }, 450);
  };

  // Next level helper
  const hasNextLevel = currentIndex < levels.length - 1;
  const handleNextLevel = () => {
    if (hasNextLevel) {
      setCurrentLevelId(levels[currentIndex + 1].id);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedArrowId) {
          e.preventDefault();
          handleDeleteArrow();
        }
      } else if (e.key.toLowerCase() === 'd') {
        setTool('draw');
      } else if (e.key.toLowerCase() === 's') {
        setTool('select');
      } else if (e.key.toLowerCase() === 'b') {
        setTool('prebuild');
      } else if (e.key === ' ' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setMode((prev) => (prev === 'builder' ? 'playtest' : 'builder'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArrowId, historyIndex, history]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-800">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-2xs z-30 shrink-0">
        {/* Left: Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-800 tracking-tight leading-tight">
              ARROW LEVEL BUILDER
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              Studio & Playtest
            </span>
          </div>
        </div>

        {/* Center: Mode Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => {
              sound.playClick();
              setMode('builder');
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'builder'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Builder</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setMode('playtest');
            }}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'playtest'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Test</span>
          </button>
        </div>

        {/* Right: Live Solvability Pill & Sound */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LiveSolvabilityBadge
            result={solvability}
            arrows={currentLevel.arrows}
            onPreviewSolution={handlePreviewSolution}
            isPreviewing={isPreviewing}
          />

          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              sound.enabled = next;
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Workspace: 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 1. Left Panel: Persistent Level List (Always Shown) */}
        <LeftLevelPanel
          levels={levels}
          currentLevelId={currentLevelId}
          onSelectLevel={(id) => {
            setCurrentLevelId(id);
            setMode('builder');
          }}
          onPlayLevel={(id) => {
            setCurrentLevelId(id);
            setMode('playtest');
          }}
          onCreateLevel={handleCreateLevel}
          onDuplicateLevel={handleDuplicateLevel}
          onDeleteLevel={handleDeleteLevel}
          onRenameLevel={handleRenameLevel}
          onRestoreDefaults={handleRestoreDefaults}
          onImportLevels={handleImportLevels}
        />

        {/* 2. Center: Canvas Editor or Play Test */}
        <main className="flex-1 h-full overflow-hidden relative">
          {mode === 'builder' ? (
            <CanvasEditor
              gridSize={currentLevel.gridSize}
              arrows={displayArrows}
              solvability={solvability}
              onChangeArrows={updateCurrentLevelArrows}
              tool={tool}
              selectedArrowId={selectedArrowId}
              onSelectArrowId={setSelectedArrowId}
              activeColorId={activeColorId}
              showRays={showRays}
              showCoords={showCoords}
              onPlayTest={() => setMode('playtest')}
              prebuildAreas={prebuildAreas}
              onAddPrebuildArea={handleAddPrebuildArea}
              onRemovePrebuildArea={handleRemovePrebuildArea}
              onClearPrebuildAreas={handleClearPrebuildAreas}
              onTriggerPrebuild={handleTriggerPrebuild}
              sourceLevelName={referenceLevel?.name}
              linkingSourceArrowId={linkingSourceArrowId}
              onCompleteLinking={handleCompleteLinking}
              onCancelLinking={handleCancelLinking}
            />
          ) : (
            <PlayTestView
              level={currentLevel}
              onBackToEditor={() => setMode('builder')}
              onNextLevel={handleNextLevel}
              hasNextLevel={hasNextLevel}
            />
          )}
        </main>

        {/* 3. Right Panel: Persistent Level Modification Inspector */}
        <RightToolPanel
          tool={tool}
          onSelectTool={setTool}
          activeColorId={activeColorId}
          onSelectColorId={handleSelectColorId}
          selectedArrow={selectedArrow}
          onReverseArrow={handleReverseArrow}
          onDuplicateArrow={handleDuplicateArrow}
          onDeleteArrow={handleDeleteArrow}
          gridSize={currentLevel.gridSize}
          onChangeGridSize={updateCurrentLevelGridSize}
          showRays={showRays}
          onToggleRays={() => setShowRays(!showRays)}
          showCoords={showCoords}
          onToggleCoords={() => setShowCoords(!showCoords)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onClearBoard={handleClearBoard}
          arrowCount={currentLevel.arrows.length}
          allArrows={currentLevel.arrows}
          onToggleDoubleHeaded={handleToggleDoubleHeaded}
          onLinkArrow={handleLinkArrow}
          onChangeLayer={handleChangeLayer}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          prebuildAreas={prebuildAreas}
          onRemovePrebuildArea={handleRemovePrebuildArea}
          onClearPrebuildAreas={handleClearPrebuildAreas}
          onTriggerPrebuild={handleTriggerPrebuild}
          allLevels={levels}
          currentLevelIndex={currentIndex}
          referenceLevelId={referenceLevelId}
          onSelectReferenceLevelId={setReferenceLevelId}
          styleProfile={styleProfile}
          linkingSourceArrowId={linkingSourceArrowId}
          onStartLinking={handleStartLinking}
          onCancelLinking={handleCancelLinking}
        />
      </div>
    </div>
  );
};

export default App;

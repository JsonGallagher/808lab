import { useState, useCallback, useMemo } from 'react';
import { exportToWAV } from './audio/wavExport';
import { generateRandomParams } from './utils/randomize';
import { Desktop } from './components/desktop';
import {
  SynthWindow,
  EffectsWindow,
  OutputWindow,
  PresetsWindow,
  AboutWindow,
} from './components/windows';
import { CablesManager, CablesOverlay } from './components/Cables';
import { useAudioEngine } from './hooks/useAudioEngine';
import { usePresets } from './hooks/usePresets';
import type { Menu, Preset } from './types';

import './styles/retro.css';
import './styles/windows.css';
import './styles/controls.css';

type WindowId = 'synth' | 'effects' | 'output' | 'presets' | 'about';

interface WindowStates {
  [key: string]: {
    isVisible: boolean;
    zIndex: number;
  };
}

const INITIAL_WINDOW_STATES: WindowStates = {
  synth: { isVisible: true, zIndex: 1 },
  effects: { isVisible: true, zIndex: 2 },
  output: { isVisible: true, zIndex: 3 },
  presets: { isVisible: true, zIndex: 4 },
  about: { isVisible: false, zIndex: 0 },
};

function App() {
  const [windowStates, setWindowStates] = useState<WindowStates>(INITIAL_WINDOW_STATES);
  const [focusedWindow, setFocusedWindow] = useState<WindowId>('synth');
  const [maxZIndex, setMaxZIndex] = useState(5);

  const {
    isPlaying,
    params,
    waveformData,
    fftData,
    triggerTime,
    currentTime,
    trigger,
    updateSynth,
    updateSubOscillator,
    updateNoiseLayer,
    updatePitchEnvelope,
    updateAmpEnvelope,
    updateDistortion,
    updateFilter,
    updateFilterEnvelope,
    updateCompressor,
    updateEQ,
    updateReverb,
    updateLimiter,
    updateMasterVolume,
    loadPreset,
    reset,
    setEffectsConnected,
    renderPreview,
  } = useAudioEngine();

  // Cables manager for modular patching
  const cablesManager = useMemo(
    () => new CablesManager((connected) => setEffectsConnected(connected)),
    [setEffectsConnected]
  );

  const {
    presets,
    currentPresetId,
    savePreset,
    deletePreset,
    importPreset,
    exportPreset,
    setCurrentPreset,
    clearCurrentPreset,
  } = usePresets(params);

  // Window management
  const handleFocusWindow = useCallback((id: WindowId) => {
    setFocusedWindow(id);
    setMaxZIndex((prev) => prev + 1);
    setWindowStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], zIndex: maxZIndex + 1 },
    }));
  }, [maxZIndex]);

  const handleCloseWindow = useCallback((id: WindowId) => {
    setWindowStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], isVisible: false },
    }));
  }, []);

  const handleShowWindow = useCallback((id: WindowId) => {
    setMaxZIndex((prev) => prev + 1);
    setWindowStates((prev) => ({
      ...prev,
      [id]: { isVisible: true, zIndex: maxZIndex + 1 },
    }));
    setFocusedWindow(id);
  }, [maxZIndex]);

  // Preset handling
  const handleLoadPreset = useCallback((preset: Preset) => {
    loadPreset(preset.params);
    setCurrentPreset(preset);
  }, [loadPreset, setCurrentPreset]);

  const handleReset = useCallback(() => {
    reset();
    clearCurrentPreset();
  }, [reset, clearCurrentPreset]);

  // Randomize parameters
  const handleRandomize = useCallback(() => {
    const randomParams = generateRandomParams();
    loadPreset(randomParams);
    clearCurrentPreset();
  }, [loadPreset, clearCurrentPreset]);

  // WAV Export
  const handleExport = useCallback(async () => {
    try {
      const samples = await renderPreview();
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      exportToWAV(samples, `808lab-${timestamp}.wav`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [renderPreview]);

  // Menu definitions
  const menus: Menu[] = [
    {
      label: 'File',
      items: [
        { label: 'New', shortcut: '⌘N', action: handleReset },
        { separator: true },
        { label: 'Export WAV...', shortcut: '⌘E', action: handleExport },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Reset All', action: handleReset },
      ],
    },
    {
      label: 'Window',
      items: [
        {
          label: 'Synthesizer',
          action: () => handleShowWindow('synth'),
        },
        {
          label: 'Effects',
          action: () => handleShowWindow('effects'),
        },
        {
          label: 'Output',
          action: () => handleShowWindow('output'),
        },
        {
          label: 'Presets',
          action: () => handleShowWindow('presets'),
        },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'About 808Lab...', action: () => handleShowWindow('about') },
        { separator: true },
        { label: 'Trigger Sound', shortcut: 'Space', disabled: true },
      ],
    },
  ];

  const getWindowState = (id: WindowId) => ({
    isVisible: windowStates[id].isVisible,
    isFocused: focusedWindow === id,
    zIndex: windowStates[id].zIndex,
  });

  return (
    <Desktop menus={menus}>
      <SynthWindow
        params={params}
        isPlaying={isPlaying}
        waveformData={waveformData}
        fftData={fftData}
        triggerTime={triggerTime}
        currentTime={currentTime}
        onTrigger={trigger}
        onUpdateSynth={updateSynth}
        onUpdateSubOscillator={updateSubOscillator}
        onUpdateNoiseLayer={updateNoiseLayer}
        onUpdatePitchEnvelope={updatePitchEnvelope}
        onUpdateAmpEnvelope={updateAmpEnvelope}
        windowState={getWindowState('synth')}
        onClose={() => handleCloseWindow('synth')}
        onFocus={() => handleFocusWindow('synth')}
        cablesManager={cablesManager}
      />

      <EffectsWindow
        params={params}
        onUpdateDistortion={updateDistortion}
        onUpdateFilter={updateFilter}
        onUpdateFilterEnvelope={updateFilterEnvelope}
        onUpdateCompressor={updateCompressor}
        onUpdateEQ={updateEQ}
        onUpdateReverb={updateReverb}
        windowState={getWindowState('effects')}
        onClose={() => handleCloseWindow('effects')}
        onFocus={() => handleFocusWindow('effects')}
        cablesManager={cablesManager}
      />

      <CablesOverlay manager={cablesManager} isPulsing={isPlaying} />

      <OutputWindow
        masterVolume={params.masterVolume}
        limiter={params.limiter}
        onUpdateMasterVolume={updateMasterVolume}
        onUpdateLimiter={updateLimiter}
        onExport={handleExport}
        onReset={handleReset}
        onRenderPreview={renderPreview}
        windowState={getWindowState('output')}
        onClose={() => handleCloseWindow('output')}
        onFocus={() => handleFocusWindow('output')}
      />

      <PresetsWindow
        presets={presets}
        currentPresetId={currentPresetId}
        onLoadPreset={handleLoadPreset}
        onSavePreset={savePreset}
        onDeletePreset={deletePreset}
        onImportPreset={importPreset}
        onExportPreset={exportPreset}
        onRandomize={handleRandomize}
        windowState={getWindowState('presets')}
        onClose={() => handleCloseWindow('presets')}
        onFocus={() => handleFocusWindow('presets')}
      />

      <AboutWindow
        windowState={getWindowState('about')}
        onClose={() => handleCloseWindow('about')}
        onFocus={() => handleFocusWindow('about')}
      />
    </Desktop>
  );
}

export default App;

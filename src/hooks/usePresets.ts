import { useState, useCallback, useEffect } from 'react';
import type { Preset, Sound808Params } from '../types';
import { DEFAULT_PRESETS } from '../presets/defaults';

const STORAGE_KEY = '808lab-presets';

export function usePresets(currentParams: Sound808Params) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(null);

  // Load presets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with default presets (defaults first)
        const userPresets = parsed.filter(
          (p: Preset) => !DEFAULT_PRESETS.some((d) => d.id === p.id)
        );
        setPresets([...DEFAULT_PRESETS, ...userPresets]);
      } catch {
        setPresets(DEFAULT_PRESETS);
      }
    } else {
      setPresets(DEFAULT_PRESETS);
    }
  }, []);

  // Save user presets to localStorage
  const saveToStorage = useCallback((updatedPresets: Preset[]) => {
    // Only save user presets (not defaults)
    const userPresets = updatedPresets.filter(
      (p) => !DEFAULT_PRESETS.some((d) => d.id === p.id)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets));
  }, []);

  // Save current parameters as a new preset
  const savePreset = useCallback((name: string) => {
    const newPreset: Preset = {
      id: `user-${Date.now()}`,
      name,
      category: 'User',
      params: { ...currentParams },
      createdAt: Date.now(),
    };

    setPresets((prev) => {
      const updated = [...prev, newPreset];
      saveToStorage(updated);
      return updated;
    });

    setCurrentPresetId(newPreset.id);
    return newPreset;
  }, [currentParams, saveToStorage]);

  // Import preset from JSON
  const importPreset = useCallback((jsonString: string): Preset | null => {
    try {
      const imported = JSON.parse(jsonString);
      // Validate basic structure
      if (!imported.name || !imported.params) {
        return null;
      }
      const newPreset: Preset = {
        id: `imported-${Date.now()}`,
        name: imported.name,
        category: 'User',
        params: imported.params,
        createdAt: Date.now(),
      };

      setPresets((prev) => {
        const updated = [...prev, newPreset];
        saveToStorage(updated);
        return updated;
      });

      return newPreset;
    } catch {
      return null;
    }
  }, [saveToStorage]);

  // Export preset to JSON
  const exportPreset = useCallback((presetId: string): string | null => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return null;

    const exportData = {
      name: preset.name,
      category: preset.category,
      params: preset.params,
    };
    return JSON.stringify(exportData, null, 2);
  }, [presets]);

  // Delete a preset
  const deletePreset = useCallback((id: string) => {
    // Don't allow deleting default presets
    if (DEFAULT_PRESETS.some((p) => p.id === id)) {
      return;
    }

    setPresets((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveToStorage(updated);
      return updated;
    });

    if (currentPresetId === id) {
      setCurrentPresetId(null);
    }
  }, [currentPresetId, saveToStorage]);

  // Set current preset (when loaded)
  const setCurrentPreset = useCallback((preset: Preset) => {
    setCurrentPresetId(preset.id);
  }, []);

  // Clear current preset selection
  const clearCurrentPreset = useCallback(() => {
    setCurrentPresetId(null);
  }, []);

  return {
    presets,
    currentPresetId,
    savePreset,
    deletePreset,
    importPreset,
    exportPreset,
    setCurrentPreset,
    clearCurrentPreset,
  };
}

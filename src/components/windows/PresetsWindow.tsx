import { useState, useRef } from 'react';
import { Window } from '../desktop';
import { RetroButton, RetroInput, RetroSelect } from '../controls';
import type { Preset, PresetCategory } from '../../types';

interface PresetsWindowProps {
  presets: Preset[];
  currentPresetId: string | null;
  onLoadPreset: (preset: Preset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
  onImportPreset: (json: string) => Preset | null;
  onExportPreset: (id: string) => string | null;
  onRandomize: () => void;
  windowState: {
    isVisible: boolean;
    isFocused: boolean;
    zIndex: number;
  };
  onClose: () => void;
  onFocus: () => void;
}

const CATEGORY_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Classic', label: 'Classic' },
  { value: 'Modern', label: 'Modern' },
  { value: 'Lo-Fi', label: 'Lo-Fi' },
  { value: 'Aggressive', label: 'Aggressive' },
  { value: 'Clean', label: 'Clean' },
  { value: 'User', label: 'User' },
];

export function PresetsWindow({
  presets,
  currentPresetId,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
  onImportPreset,
  onExportPreset,
  onRandomize,
  windowState,
  onClose,
  onFocus,
}: PresetsWindowProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentPresetId);
  const [newPresetName, setNewPresetName] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPresets = categoryFilter === 'All'
    ? presets
    : presets.filter((p) => p.category === categoryFilter);

  const handleLoad = () => {
    const preset = presets.find((p) => p.id === selectedId);
    if (preset) {
      onLoadPreset(preset);
    }
  };

  const handleSave = () => {
    if (newPresetName.trim()) {
      onSavePreset(newPresetName.trim());
      setNewPresetName('');
    }
  };

  const handleDelete = () => {
    if (selectedId) {
      onDeletePreset(selectedId);
      setSelectedId(null);
    }
  };

  const handleExport = () => {
    if (!selectedId) return;
    const json = onExportPreset(selectedId);
    if (json) {
      const preset = presets.find((p) => p.id === selectedId);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${preset?.name || 'preset'}.808preset.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        const imported = onImportPreset(json);
        if (imported) {
          setSelectedId(imported.id);
          setCategoryFilter('All');
        } else {
          alert('Invalid preset file');
        }
      };
      reader.readAsText(file);
    }
    // Reset input so same file can be imported again
    e.target.value = '';
  };

  // Check if selected preset is a factory preset (can't be deleted)
  const isFactoryPreset = selectedId
    ? presets.find((p) => p.id === selectedId)?.category !== 'User'
    : false;

  return (
    <Window
      id="presets"
      title="Presets"
      initialPosition={{ x: 955, y: 45 }}
      initialSize={{ width: 300, height: 340 }}
      isVisible={windowState.isVisible}
      isFocused={windowState.isFocused}
      zIndex={windowState.zIndex}
      onClose={onClose}
      onFocus={onFocus}
    >
      {/* Category filter */}
      <div className="control-row" style={{ marginBottom: '8px' }}>
        <RetroSelect
          label="Filter"
          value={categoryFilter}
          options={CATEGORY_OPTIONS}
          onChange={(cat) => setCategoryFilter(cat as PresetCategory | 'All')}
        />
      </div>

      {/* Preset list */}
      <div className="retro-listbox" style={{ height: '120px' }}>
        {filteredPresets.length === 0 ? (
          <div className="listbox-item" style={{ color: '#666' }}>
            No presets in this category
          </div>
        ) : (
          filteredPresets.map((preset) => (
            <div
              key={preset.id}
              className={`listbox-item ${selectedId === preset.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(preset.id)}
              onDoubleClick={() => onLoadPreset(preset)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{preset.name}</span>
              <span style={{
                fontSize: '9px',
                opacity: 0.7,
                marginLeft: '4px',
              }}>
                {preset.category}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Action buttons */}
      <div className="button-group" style={{ marginTop: '8px', flexWrap: 'wrap', gap: '4px' }}>
        <RetroButton onClick={handleLoad} disabled={!selectedId}>
          Load
        </RetroButton>
        <RetroButton onClick={handleDelete} disabled={!selectedId || isFactoryPreset}>
          Delete
        </RetroButton>
        <RetroButton onClick={handleImportClick}>
          Import
        </RetroButton>
        <RetroButton onClick={handleExport} disabled={!selectedId}>
          Export
        </RetroButton>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.808preset.json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <hr />

      {/* Save new preset */}
      <div style={{ marginTop: '8px' }}>
        <div className="section-title">Save New Preset</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <RetroInput
            placeholder="Preset name..."
            value={newPresetName}
            onChange={setNewPresetName}
          />
          <RetroButton onClick={handleSave} disabled={!newPresetName.trim()}>
            Save
          </RetroButton>
        </div>
      </div>

      <hr />

      {/* Randomize */}
      <RetroButton onClick={onRandomize} style={{ width: '100%' }}>
        Randomize
      </RetroButton>
    </Window>
  );
}

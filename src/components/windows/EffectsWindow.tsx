import { useState } from 'react';
import { Window } from '../desktop';
import { RetroSlider, RetroSelect, RetroCheckbox } from '../controls';
import { Jack, type CablesManager } from '../Cables';
import type { Sound808Params, WindowPosition, WindowSize } from '../../types';

// Collapsible panel component
function CollapsiblePanel({
  title,
  enabled,
  onToggleEnabled,
  expanded,
  onToggleExpanded,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div
        className="panel-title"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span
          style={{ fontFamily: 'monospace', fontSize: '10px', width: '12px' }}
          onClick={onToggleExpanded}
        >
          {expanded ? '▼' : '▶'}
        </span>
        <span onClick={(e) => e.stopPropagation()}>
          <RetroCheckbox
            label={title}
            checked={enabled}
            onChange={(val) => onToggleEnabled(val)}
          />
        </span>
        <span
          style={{ flex: 1, marginLeft: '4px' }}
          onClick={onToggleExpanded}
        />
      </div>
      {expanded && (
        <div style={{ opacity: enabled ? 1 : 0.5 }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface EffectsWindowProps {
  params: Sound808Params;
  onUpdateDistortion: (updates: Partial<Sound808Params['distortion']>) => void;
  onUpdateFilter: (updates: Partial<Sound808Params['filter']>) => void;
  onUpdateFilterEnvelope: (updates: Partial<Sound808Params['filterEnvelope']>) => void;
  onUpdateCompressor: (updates: Partial<Sound808Params['compressor']>) => void;
  onUpdateEQ: (updates: Partial<Sound808Params['eq']>) => void;
  onUpdateReverb: (updates: Partial<Sound808Params['reverb']>) => void;
  windowState: {
    isVisible: boolean;
    isFocused: boolean;
    zIndex: number;
  };
  onClose: () => void;
  onFocus: () => void;
  cablesManager: CablesManager;
  initialPosition: WindowPosition;
  initialSize: WindowSize;
}

const FILTER_TYPES = [
  { value: 'lowpass', label: 'Low Pass' },
  { value: 'highpass', label: 'High Pass' },
  { value: 'bandpass', label: 'Band Pass' },
];

const DISTORTION_TYPES = [
  { value: 'softclip', label: 'Soft Clip' },
  { value: 'hardclip', label: 'Hard Clip' },
  { value: 'tape', label: 'Tape' },
  { value: 'waveshaper', label: 'Waveshaper' },
  { value: 'bitcrush', label: 'Bitcrush' },
];

export function EffectsWindow({
  params,
  onUpdateDistortion,
  onUpdateFilter,
  onUpdateFilterEnvelope,
  onUpdateCompressor,
  onUpdateEQ,
  onUpdateReverb,
  windowState,
  onClose,
  onFocus,
  cablesManager,
  initialPosition,
  initialSize,
}: EffectsWindowProps) {
  // Collapsed state for optional sections
  const [compressorExpanded, setCompressorExpanded] = useState(false);
  const [reverbExpanded, setReverbExpanded] = useState(false);

  return (
    <Window
      id="effects"
      title="808Lab - Effects"
      initialPosition={initialPosition}
      initialSize={initialSize}
      isVisible={windowState.isVisible}
      isFocused={windowState.isFocused}
      zIndex={windowState.zIndex}
      onClose={onClose}
      onFocus={onFocus}
    >
      {/* Input Jack */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: '8px',
        padding: '4px 8px',
        borderBottom: '1px solid #000',
      }}>
        <Jack
          id="effects-input"
          type="input"
          windowId="effects"
          label="IN"
          cablesManager={cablesManager}
        />
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#666' }}>
          Connect from Synth OUT
        </span>
      </div>

      {/* Distortion */}
      <div className="panel">
        <div className="panel-title">Distortion / Saturation</div>
        <div className="control-row">
          <RetroSelect
            label="Type"
            value={params.distortion.type}
            options={DISTORTION_TYPES}
            onChange={(type) => {
              const updates: Partial<Sound808Params['distortion']> = {
                type: type as Sound808Params['distortion']['type']
              };
              // Apply bitcrush-specific defaults when switching to bitcrush
              if (type === 'bitcrush') {
                updates.drive = 0.6;
                updates.bitDepth = 2;
                updates.mix = 0.8;
              }
              onUpdateDistortion(updates);
            }}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Drive"
            value={params.distortion.drive}
            min={0}
            max={1}
            step={0.01}
            onChange={(drive) => onUpdateDistortion({ drive })}
            formatValue={(v) => Math.round(v * 100) + '%'}
          />
        </div>
        {params.distortion.type === 'bitcrush' && (
          <div className="control-row">
            <RetroSlider
              label="Bit Depth"
              value={params.distortion.bitDepth || 8}
              min={1}
              max={16}
              step={1}
              onChange={(bitDepth) => onUpdateDistortion({ bitDepth })}
              formatValue={(v) => v + ' bit'}
            />
          </div>
        )}
        <div className="control-row">
          <RetroSlider
            label="Mix"
            value={params.distortion.mix}
            min={0}
            max={1}
            step={0.01}
            onChange={(mix) => onUpdateDistortion({ mix })}
            formatValue={(v) => Math.round(v * 100) + '%'}
          />
        </div>
      </div>

      {/* Filter */}
      <div className="panel">
        <div className="panel-title">Filter</div>
        <div className="control-row">
          <RetroSelect
            label="Type"
            value={params.filter.type}
            options={FILTER_TYPES}
            onChange={(type) => onUpdateFilter({ type: type as 'lowpass' | 'highpass' | 'bandpass' })}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Frequency"
            value={params.filter.frequency}
            min={20}
            max={8000}
            step={1}
            unit=" Hz"
            onChange={(frequency) => onUpdateFilter({ frequency })}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Resonance"
            value={params.filter.resonance}
            min={0.1}
            max={20}
            step={0.1}
            onChange={(resonance) => onUpdateFilter({ resonance })}
            formatValue={(v) => v.toFixed(1)}
          />
        </div>
      </div>

      {/* Filter Envelope */}
      <div className="panel">
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RetroCheckbox
            label="Filter Envelope"
            checked={params.filterEnvelope.enabled}
            onChange={(enabled) => onUpdateFilterEnvelope({ enabled })}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Amount"
            value={params.filterEnvelope.amount}
            min={0}
            max={8000}
            step={10}
            unit=" Hz"
            onChange={(amount) => onUpdateFilterEnvelope({ amount })}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Attack"
            value={params.filterEnvelope.attack}
            min={0.001}
            max={0.5}
            step={0.001}
            onChange={(attack) => onUpdateFilterEnvelope({ attack })}
            formatValue={(v) => (v * 1000).toFixed(0) + ' ms'}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Decay"
            value={params.filterEnvelope.decay}
            min={0.01}
            max={2}
            step={0.01}
            onChange={(decay) => onUpdateFilterEnvelope({ decay })}
            formatValue={(v) => (v * 1000).toFixed(0) + ' ms'}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Sustain"
            value={params.filterEnvelope.sustain}
            min={0}
            max={1}
            step={0.01}
            onChange={(sustain) => onUpdateFilterEnvelope({ sustain })}
            formatValue={(v) => Math.round(v * 100) + '%'}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Release"
            value={params.filterEnvelope.release}
            min={0.01}
            max={2}
            step={0.01}
            onChange={(release) => onUpdateFilterEnvelope({ release })}
            formatValue={(v) => (v * 1000).toFixed(0) + ' ms'}
          />
        </div>
      </div>

      {/* EQ */}
      <div className="panel">
        <div className="panel-title">EQ</div>
        <div className="control-row">
          <RetroSlider
            label="Low"
            value={params.eq.lowGain}
            min={-12}
            max={12}
            step={0.5}
            unit=" dB"
            onChange={(lowGain) => onUpdateEQ({ lowGain })}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Mid"
            value={params.eq.midGain}
            min={-12}
            max={12}
            step={0.5}
            unit=" dB"
            onChange={(midGain) => onUpdateEQ({ midGain })}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="High"
            value={params.eq.highGain}
            min={-12}
            max={12}
            step={0.5}
            unit=" dB"
            onChange={(highGain) => onUpdateEQ({ highGain })}
          />
        </div>
      </div>

      {/* Compressor - Collapsible */}
      <CollapsiblePanel
        title="Compressor"
        enabled={params.compressor.enabled}
        onToggleEnabled={(enabled) => onUpdateCompressor({ enabled })}
        expanded={compressorExpanded}
        onToggleExpanded={() => setCompressorExpanded(!compressorExpanded)}
      >
        <div className="control-row">
          <RetroSlider
            label="Threshold"
            value={params.compressor.threshold}
            min={-60}
            max={0}
            step={1}
            unit=" dB"
            onChange={(threshold) => onUpdateCompressor({ threshold })}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Ratio"
            value={params.compressor.ratio}
            min={1}
            max={20}
            step={0.5}
            onChange={(ratio) => onUpdateCompressor({ ratio })}
            formatValue={(v) => v + ':1'}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Attack"
            value={params.compressor.attack}
            min={0.001}
            max={0.1}
            step={0.001}
            onChange={(attack) => onUpdateCompressor({ attack })}
            formatValue={(v) => (v * 1000).toFixed(0) + ' ms'}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Release"
            value={params.compressor.release}
            min={0.01}
            max={1}
            step={0.01}
            onChange={(release) => onUpdateCompressor({ release })}
            formatValue={(v) => (v * 1000).toFixed(0) + ' ms'}
          />
        </div>
      </CollapsiblePanel>

      {/* Reverb - Collapsible */}
      <CollapsiblePanel
        title="Reverb"
        enabled={params.reverb.enabled}
        onToggleEnabled={(enabled) => onUpdateReverb({ enabled })}
        expanded={reverbExpanded}
        onToggleExpanded={() => setReverbExpanded(!reverbExpanded)}
      >
        <div className="control-row">
          <RetroSlider
            label="Decay"
            value={params.reverb.decay}
            min={0.1}
            max={10}
            step={0.1}
            unit=" s"
            onChange={(decay) => onUpdateReverb({ decay })}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Pre-Delay"
            value={params.reverb.preDelay}
            min={0}
            max={0.1}
            step={0.001}
            onChange={(preDelay) => onUpdateReverb({ preDelay })}
            formatValue={(v) => (v * 1000).toFixed(0) + ' ms'}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Mix"
            value={params.reverb.mix}
            min={0}
            max={1}
            step={0.01}
            onChange={(mix) => onUpdateReverb({ mix })}
            formatValue={(v) => Math.round(v * 100) + '%'}
          />
        </div>
      </CollapsiblePanel>

    </Window>
  );
}

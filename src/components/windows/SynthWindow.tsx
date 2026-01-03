import { Window } from '../desktop';
import { RetroSlider, RetroSelect, TriggerButton, RetroCheckbox } from '../controls';
import { Waveform } from '../Waveform';
import { Jack, type CablesManager } from '../Cables';
import type { Sound808Params, WindowPosition, WindowSize } from '../../types';

interface SynthWindowProps {
  params: Sound808Params;
  isPlaying: boolean;
  waveformData: Float32Array;
  fftData: Float32Array;
  triggerTime: number;
  currentTime: number;
  onTrigger: () => void;
  onUpdateSynth: (updates: Partial<Sound808Params['synth']>) => void;
  onUpdateSubOscillator: (updates: Partial<Sound808Params['subOscillator']>) => void;
  onUpdateNoiseLayer: (updates: Partial<Sound808Params['noiseLayer']>) => void;
  onUpdatePitchEnvelope: (updates: Partial<Sound808Params['pitchEnvelope']>) => void;
  onUpdateAmpEnvelope: (updates: Partial<Sound808Params['ampEnvelope']>) => void;
  onUpdateLFO: (updates: Partial<Sound808Params['lfo']>) => void;
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

const WAVEFORMS = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
];

const CURVES = [
  { value: 'exponential', label: 'Exponential' },
  { value: 'linear', label: 'Linear' },
];

const SUB_OCTAVES = [
  { value: '-1', label: '-1 Oct' },
  { value: '-2', label: '-2 Oct' },
];

const NOISE_TYPES = [
  { value: 'white', label: 'White' },
  { value: 'pink', label: 'Pink' },
];

const LFO_DIVISIONS = [
  { value: '1/2', label: '1/2' },
  { value: '1/4', label: '1/4' },
  { value: '1/8', label: '1/8' },
  { value: '1/16', label: '1/16' },
  { value: '1/32', label: '1/32' },
];

const LFO_WAVEFORMS = [
  { value: 'sine', label: 'Sine' },
  { value: 'square', label: 'Square' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'sawtooth', label: 'Saw' },
];

export function SynthWindow({
  params,
  isPlaying,
  waveformData,
  fftData,
  triggerTime,
  currentTime,
  onTrigger,
  onUpdateSynth,
  onUpdateSubOscillator,
  onUpdateNoiseLayer,
  onUpdatePitchEnvelope,
  onUpdateAmpEnvelope,
  onUpdateLFO,
  windowState,
  onClose,
  onFocus,
  cablesManager,
  initialPosition,
  initialSize,
}: SynthWindowProps) {
  return (
    <Window
      id="synth"
      title="808Lab - Synthesizer"
      initialPosition={initialPosition}
      initialSize={initialSize}
      isVisible={windowState.isVisible}
      isFocused={windowState.isFocused}
      zIndex={windowState.zIndex}
      onClose={onClose}
      onFocus={onFocus}
    >
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Left: Trigger + Oscillator */}
        <div style={{ flex: '0 0 100px' }}>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Trigger
            {/* LED Activity Indicator */}
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                border: '1px solid #000',
                background: isPlaying ? '#000' : '#fff',
                boxShadow: isPlaying ? '0 0 6px 2px rgba(0,0,0,0.4)' : 'none',
                transition: 'all 0.05s ease-out',
              }}
            />
          </div>
          <TriggerButton
            isActive={isPlaying}
            onTrigger={onTrigger}
          />

          <div className="section-title" style={{ marginTop: '16px' }}>Oscillator</div>
          <div className="control-row">
            <RetroSelect
              label="Wave"
              value={params.synth.waveform}
              options={WAVEFORMS}
              onChange={(waveform) => onUpdateSynth({ waveform: waveform as 'sine' | 'triangle' })}
            />
          </div>
          <div className="control-row">
            <RetroSlider
              label="Velocity"
              value={params.synth.velocity}
              min={0}
              max={1}
              step={0.01}
              onChange={(velocity) => onUpdateSynth({ velocity })}
              formatValue={(v) => Math.round(v * 100) + '%'}
            />
          </div>
        </div>

        {/* Right: Envelopes */}
        <div style={{ flex: 1 }}>
          {/* Pitch Envelope */}
          <div className="panel">
            <div className="panel-title">Pitch Envelope</div>
            <div className="control-row">
              <RetroSlider
                label="Start Offset"
                value={params.pitchEnvelope.startOffset}
                min={0}
                max={48}
                step={1}
                unit=" st"
                onChange={(startOffset) => onUpdatePitchEnvelope({ startOffset })}
              />
            </div>
            <div className="control-row">
              <RetroSlider
                label="Decay"
                value={params.pitchEnvelope.decayTime}
                min={0.001}
                max={2}
                step={0.001}
                unit=" s"
                onChange={(decayTime) => onUpdatePitchEnvelope({ decayTime })}
                formatValue={(v) => v < 1 ? (v * 1000).toFixed(0) + ' ms' : v.toFixed(2) + ' s'}
              />
            </div>
            <div className="control-row">
              <RetroSelect
                label="Curve"
                value={params.pitchEnvelope.curve}
                options={CURVES}
                onChange={(curve) => onUpdatePitchEnvelope({ curve: curve as 'linear' | 'exponential' })}
              />
            </div>
          </div>

          {/* Amplitude Envelope */}
          <div className="panel">
            <div className="panel-title">Amplitude Envelope (ADSR)</div>
            <div className="control-row">
              <RetroSlider
                label="Attack"
                value={params.ampEnvelope.attack}
                min={0.001}
                max={2}
                step={0.001}
                unit=" s"
                onChange={(attack) => onUpdateAmpEnvelope({ attack })}
                formatValue={(v) => v < 1 ? (v * 1000).toFixed(0) + ' ms' : v.toFixed(2) + ' s'}
              />
            </div>
            <div className="control-row">
              <RetroSlider
                label="Decay"
                value={params.ampEnvelope.decay}
                min={0.05}
                max={2}
                step={0.01}
                unit=" s"
                onChange={(decay) => onUpdateAmpEnvelope({ decay })}
              />
            </div>
            <div className="control-row">
              <RetroSlider
                label="Sustain"
                value={params.ampEnvelope.sustain}
                min={0}
                max={1}
                step={0.01}
                onChange={(sustain) => onUpdateAmpEnvelope({ sustain })}
                formatValue={(v) => Math.round(v * 100) + '%'}
              />
            </div>
            <div className="control-row">
              <RetroSlider
                label="Release"
                value={params.ampEnvelope.release}
                min={0.01}
                max={5}
                step={0.01}
                unit=" s"
                onChange={(release) => onUpdateAmpEnvelope({ release })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sub Oscillator and Noise Layer - Side by side */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        {/* Sub Oscillator */}
        <div className="panel" style={{ flex: 1 }}>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RetroCheckbox
              label="Sub Oscillator"
              checked={params.subOscillator.enabled}
              onChange={(enabled) => onUpdateSubOscillator({ enabled })}
            />
          </div>
          <div className="control-row">
            <RetroSlider
              label="Level"
              value={params.subOscillator.level}
              min={0}
              max={1}
              step={0.01}
              onChange={(level) => onUpdateSubOscillator({ level })}
              formatValue={(v) => Math.round(v * 100) + '%'}
            />
          </div>
          <div className="control-row">
            <RetroSelect
              label="Octave"
              value={String(params.subOscillator.octave)}
              options={SUB_OCTAVES}
              onChange={(octave) => onUpdateSubOscillator({ octave: Number(octave) as -1 | -2 })}
            />
          </div>
          <div className="control-row">
            <RetroSlider
              label="Detune"
              value={params.subOscillator.detune}
              min={-50}
              max={50}
              step={1}
              unit=" cents"
              onChange={(detune) => onUpdateSubOscillator({ detune })}
            />
          </div>
        </div>

        {/* Noise Layer */}
        <div className="panel" style={{ flex: 1 }}>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RetroCheckbox
              label="Noise Layer"
              checked={params.noiseLayer.enabled}
              onChange={(enabled) => onUpdateNoiseLayer({ enabled })}
            />
          </div>
          <div className="control-row">
            <RetroSlider
              label="Level"
              value={params.noiseLayer.level}
              min={0}
              max={1}
              step={0.01}
              onChange={(level) => onUpdateNoiseLayer({ level })}
              formatValue={(v) => Math.round(v * 100) + '%'}
            />
          </div>
          <div className="control-row">
            <RetroSelect
              label="Type"
              value={params.noiseLayer.type}
              options={NOISE_TYPES}
              onChange={(type) => onUpdateNoiseLayer({ type: type as 'white' | 'pink' })}
            />
          </div>
          <div className="control-row">
            <RetroSlider
              label="Decay"
              value={params.noiseLayer.decay}
              min={0.01}
              max={0.2}
              step={0.01}
              onChange={(decay) => onUpdateNoiseLayer({ decay })}
              formatValue={(v) => (v * 1000).toFixed(0) + ' ms'}
            />
          </div>
          <div className="control-row">
            <RetroSlider
              label="Filter"
              value={params.noiseLayer.filterFreq}
              min={100}
              max={4000}
              step={10}
              unit=" Hz"
              onChange={(filterFreq) => onUpdateNoiseLayer({ filterFreq })}
            />
          </div>
        </div>
      </div>

      {/* LFO */}
      <div className="panel" style={{ marginTop: '12px' }}>
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RetroCheckbox
            label="LFO (Wobble)"
            checked={params.lfo.enabled}
            onChange={(enabled) => onUpdateLFO({ enabled })}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <div className="control-row">
              <RetroSlider
                label="BPM"
                value={params.lfo.bpm}
                min={60}
                max={200}
                step={1}
                onChange={(bpm) => onUpdateLFO({ bpm })}
              />
            </div>
            <div className="control-row">
              <RetroSelect
                label="Rate"
                value={params.lfo.division}
                options={LFO_DIVISIONS}
                onChange={(division) => onUpdateLFO({ division: division as Sound808Params['lfo']['division'] })}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="control-row">
              <RetroSlider
                label="Depth"
                value={params.lfo.depth}
                min={0}
                max={1}
                step={0.01}
                onChange={(depth) => onUpdateLFO({ depth })}
                formatValue={(v) => Math.round(v * 100) + '%'}
              />
            </div>
            <div className="control-row">
              <RetroSelect
                label="Wave"
                value={params.lfo.waveform}
                options={LFO_WAVEFORMS}
                onChange={(waveform) => onUpdateLFO({ waveform: waveform as Sound808Params['lfo']['waveform'] })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Waveform Display */}
      <div className="panel" style={{ marginTop: '12px' }}>
        <div className="panel-title">Waveform</div>
        <Waveform
          data={waveformData}
          fftData={fftData}
          width={540}
          height={180}
          triggerTime={triggerTime}
          currentTime={currentTime}
          ampEnvelope={params.ampEnvelope}
        />
      </div>

      {/* Output Jack */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: '8px',
        padding: '4px 8px',
        borderTop: '1px solid #000',
      }}>
        <Jack
          id="synth-output"
          type="output"
          windowId="synth"
          label="OUT"
          cablesManager={cablesManager}
        />
      </div>
    </Window>
  );
}

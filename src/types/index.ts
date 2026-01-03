// 808Lab Type Definitions

// Window position and size
export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowState {
  id: string;
  title: string;
  position: WindowPosition;
  size: WindowSize;
  isVisible: boolean;
  zIndex: number;
}

// Synth parameters
export interface SynthParams {
  note: string;        // e.g., "C1", "E1"
  frequency: number;   // Hz
  waveform: 'sine' | 'triangle';
  velocity: number;    // 0-1
}

// Sub oscillator for deep 808 character
export interface SubOscillatorParams {
  enabled: boolean;
  level: number;       // 0-1 mix level
  octave: -2 | -1;     // octaves below main osc
  detune: number;      // -50 to +50 cents
}

// Noise/click layer for transient punch
export interface NoiseLayerParams {
  enabled: boolean;
  type: 'white' | 'pink';
  level: number;       // 0-1
  attack: number;      // 0.001-0.01s
  decay: number;       // 0.01-0.2s
  filterFreq: number;  // Hz, lowpass cutoff
}

// Filter envelope for dynamic frequency sweep
export interface FilterEnvelopeParams {
  enabled: boolean;
  amount: number;      // Hz sweep range (0-8000)
  attack: number;      // seconds
  decay: number;       // seconds
  sustain: number;     // 0-1
  release: number;     // seconds
}

// Pitch envelope
export interface PitchEnvelopeParams {
  startOffset: number;  // semitones above target
  decayTime: number;    // seconds
  curve: 'linear' | 'exponential';
}

// Amplitude envelope (ADSR)
export interface AmpEnvelopeParams {
  attack: number;   // seconds
  decay: number;    // seconds
  sustain: number;  // 0-1
  release: number;  // seconds
}

// Effects
export interface DistortionParams {
  drive: number;       // 0-1
  type: 'softclip' | 'hardclip' | 'waveshaper' | 'tape' | 'bitcrush';
  mix: number;         // 0-1 dry/wet
  bitDepth?: number;   // 1-16 for bitcrush mode
}

export interface FilterParams {
  type: 'lowpass' | 'highpass' | 'bandpass';
  frequency: number;   // Hz
  resonance: number;   // Q factor
}

export interface CompressorParams {
  enabled: boolean;    // bypass when false
  threshold: number;   // dB
  ratio: number;       // e.g., 4:1 = 4
  attack: number;      // seconds
  release: number;     // seconds
  makeupGain: number;  // dB
}

export interface EQParams {
  lowGain: number;     // dB
  midGain: number;     // dB
  midFreq: number;     // Hz
  highGain: number;    // dB
}

export interface ReverbParams {
  enabled: boolean;
  decay: number;       // 0.1-10s room size
  preDelay: number;    // 0-0.1s
  mix: number;         // 0-1 dry/wet
}

export interface LimiterParams {
  enabled: boolean;
  threshold: number;   // -12 to 0 dB
}

// LFO for wobble/modulation effects
export interface LFOParams {
  enabled: boolean;
  bpm: number;                    // 60-200 tempo
  division: '1/2' | '1/4' | '1/8' | '1/16' | '1/32';  // note division
  waveform: 'sine' | 'square' | 'triangle' | 'sawtooth';
  depth: number;                  // 0-1 modulation amount
  target: 'filter';               // what to modulate (filter frequency for now)
}

// Complete 808 parameters
export interface Sound808Params {
  synth: SynthParams;
  subOscillator: SubOscillatorParams;
  noiseLayer: NoiseLayerParams;
  pitchEnvelope: PitchEnvelopeParams;
  ampEnvelope: AmpEnvelopeParams;
  distortion: DistortionParams;
  filter: FilterParams;
  filterEnvelope: FilterEnvelopeParams;
  compressor: CompressorParams;
  eq: EQParams;
  reverb: ReverbParams;
  limiter: LimiterParams;
  lfo: LFOParams;
  masterVolume: number; // dB
}

// Preset categories
export type PresetCategory = 'Classic' | 'Modern' | 'Lo-Fi' | 'Aggressive' | 'Clean' | 'User';

// Preset
export interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  params: Sound808Params;
  createdAt: number;
}

// Menu types
export type MenuItem = {
  label: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: false;
} | {
  separator: true;
  label?: never;
  shortcut?: never;
  action?: never;
  disabled?: never;
};

export interface Menu {
  label: string;
  items: MenuItem[];
}

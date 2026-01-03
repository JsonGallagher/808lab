import type { Preset, Sound808Params, SubOscillatorParams, NoiseLayerParams, FilterEnvelopeParams, ReverbParams, LimiterParams, LFOParams } from '../types';

// Default values for parameters
const defaultSubOscillator: SubOscillatorParams = {
  enabled: false,
  level: 0.5,
  octave: -1,
  detune: 0,
};

const defaultNoiseLayer: NoiseLayerParams = {
  enabled: false,
  type: 'white',
  level: 0.3,
  attack: 0.001,
  decay: 0.05,
  filterFreq: 800,
};

const defaultFilterEnvelope: FilterEnvelopeParams = {
  enabled: false,
  amount: 1000,
  attack: 0.001,
  decay: 0.2,
  sustain: 0.3,
  release: 0.3,
};

const defaultReverb: ReverbParams = {
  enabled: false,
  decay: 1.5,
  preDelay: 0.01,
  mix: 0.2,
};

const defaultLimiter: LimiterParams = {
  enabled: true,
  threshold: -2,
};

const defaultLFO: LFOParams = {
  enabled: false,
  bpm: 140,
  division: '1/8',
  waveform: 'sine',
  depth: 0.5,
  target: 'filter',
};

// Classic 808 sub bass
const classic808: Sound808Params = {
  synth: {
    note: 'E1',
    frequency: 41.2,
    waveform: 'sine',
    velocity: 0.8,
  },
  subOscillator: { ...defaultSubOscillator },
  noiseLayer: { ...defaultNoiseLayer },
  pitchEnvelope: {
    startOffset: 12,
    decayTime: 0.15,
    curve: 'exponential',
  },
  ampEnvelope: {
    attack: 0.001,
    decay: 0.3,
    sustain: 0.4,
    release: 0.5,
  },
  distortion: {
    drive: 0.1,
    type: 'softclip',
    mix: 0.2,
    bitDepth: 8,
  },
  filter: {
    type: 'lowpass',
    frequency: 200,
    resonance: 1,
  },
  filterEnvelope: { ...defaultFilterEnvelope },
  compressor: {
    enabled: false,
    threshold: -12,
    ratio: 4,
    attack: 0.003,
    release: 0.1,
    makeupGain: 0,
  },
  eq: {
    lowGain: 2,
    midGain: 0,
    midFreq: 400,
    highGain: -3,
  },
  reverb: { ...defaultReverb },
  limiter: { ...defaultLimiter },
  lfo: { ...defaultLFO },
  masterVolume: -6,
};

// Heavy distorted 808
const distorted808: Sound808Params = {
  synth: {
    note: 'C1',
    frequency: 32.7,
    waveform: 'sine',
    velocity: 1.0,
  },
  subOscillator: { ...defaultSubOscillator },
  noiseLayer: { ...defaultNoiseLayer, enabled: true, level: 0.2, decay: 0.03 },
  pitchEnvelope: {
    startOffset: 18,
    decayTime: 0.1,
    curve: 'exponential',
  },
  ampEnvelope: {
    attack: 0.001,
    decay: 0.5,
    sustain: 0.3,
    release: 0.4,
  },
  distortion: {
    drive: 0.7,
    type: 'hardclip',
    mix: 0.6,
    bitDepth: 8,
  },
  filter: {
    type: 'lowpass',
    frequency: 400,
    resonance: 2,
  },
  filterEnvelope: { ...defaultFilterEnvelope },
  compressor: {
    enabled: true, // Heavy compression for distorted sound
    threshold: -18,
    ratio: 8,
    attack: 0.001,
    release: 0.05,
    makeupGain: 3,
  },
  eq: {
    lowGain: 4,
    midGain: 2,
    midFreq: 400,
    highGain: -6,
  },
  reverb: { ...defaultReverb },
  limiter: { ...defaultLimiter, threshold: -6 },
  lfo: { ...defaultLFO },
  masterVolume: -8,
};

// Deep sub (minimal processing)
const deepSub: Sound808Params = {
  synth: {
    note: 'F1',
    frequency: 43.7,
    waveform: 'sine',
    velocity: 0.7,
  },
  subOscillator: { ...defaultSubOscillator, enabled: true, level: 0.7, octave: -2 },
  noiseLayer: { ...defaultNoiseLayer },
  pitchEnvelope: {
    startOffset: 6,
    decayTime: 0.2,
    curve: 'exponential',
  },
  ampEnvelope: {
    attack: 0.005,
    decay: 0.8,
    sustain: 0.5,
    release: 1.0,
  },
  distortion: {
    drive: 0,
    type: 'tape',
    mix: 0,
    bitDepth: 8,
  },
  filter: {
    type: 'lowpass',
    frequency: 120,
    resonance: 0.5,
  },
  filterEnvelope: { ...defaultFilterEnvelope },
  compressor: {
    enabled: false,
    threshold: -6,
    ratio: 2,
    attack: 0.01,
    release: 0.2,
    makeupGain: 0,
  },
  eq: {
    lowGain: 6,
    midGain: -3,
    midFreq: 400,
    highGain: -12,
  },
  reverb: { ...defaultReverb, enabled: true, decay: 2.5, mix: 0.15 },
  limiter: { ...defaultLimiter },
  lfo: { ...defaultLFO },
  masterVolume: -6,
};

// Punchy short 808
const punchy808: Sound808Params = {
  synth: {
    note: 'G1',
    frequency: 49.0,
    waveform: 'triangle',
    velocity: 0.9,
  },
  subOscillator: { ...defaultSubOscillator },
  noiseLayer: { ...defaultNoiseLayer, enabled: true, level: 0.4, decay: 0.02, filterFreq: 1200 },
  pitchEnvelope: {
    startOffset: 24,
    decayTime: 0.05,
    curve: 'exponential',
  },
  ampEnvelope: {
    attack: 0.001,
    decay: 0.15,
    sustain: 0.1,
    release: 0.2,
  },
  distortion: {
    drive: 0.3,
    type: 'softclip',
    mix: 0.4,
    bitDepth: 8,
  },
  filter: {
    type: 'lowpass',
    frequency: 300,
    resonance: 3,
  },
  filterEnvelope: { ...defaultFilterEnvelope, enabled: true, amount: 500, decay: 0.1 },
  compressor: {
    enabled: true, // Punchy needs compression
    threshold: -15,
    ratio: 6,
    attack: 0.001,
    release: 0.08,
    makeupGain: 2,
  },
  eq: {
    lowGain: 0,
    midGain: 3,
    midFreq: 400,
    highGain: 0,
  },
  reverb: { ...defaultReverb },
  limiter: { ...defaultLimiter },
  lfo: { ...defaultLFO },
  masterVolume: -6,
};

// Trap Sub - Long decay, heavy sub for trap music
const trapSub: Sound808Params = {
  synth: {
    note: 'C1',
    frequency: 32.7,
    waveform: 'sine',
    velocity: 0.85,
  },
  subOscillator: { ...defaultSubOscillator, enabled: true, level: 0.6, octave: -1 },
  noiseLayer: { ...defaultNoiseLayer, enabled: true, level: 0.15, decay: 0.02 },
  pitchEnvelope: {
    startOffset: 36,
    decayTime: 0.08,
    curve: 'exponential',
  },
  ampEnvelope: {
    attack: 0.001,
    decay: 1.2,
    sustain: 0.3,
    release: 1.5,
  },
  distortion: {
    drive: 0.15,
    type: 'tape',
    mix: 0.25,
    bitDepth: 8,
  },
  filter: {
    type: 'lowpass',
    frequency: 180,
    resonance: 1.5,
  },
  filterEnvelope: { ...defaultFilterEnvelope },
  compressor: {
    enabled: false,
    threshold: -10,
    ratio: 4,
    attack: 0.003,
    release: 0.15,
    makeupGain: 2,
  },
  eq: {
    lowGain: 4,
    midGain: -2,
    midFreq: 400,
    highGain: -6,
  },
  reverb: { ...defaultReverb },
  limiter: { ...defaultLimiter },
  lfo: { ...defaultLFO },
  masterVolume: -6,
};

// Lo-Fi - Bitcrushed retro sound
const loFi808: Sound808Params = {
  synth: {
    note: 'D1',
    frequency: 36.7,
    waveform: 'sine',
    velocity: 0.75,
  },
  subOscillator: { ...defaultSubOscillator },
  noiseLayer: { ...defaultNoiseLayer, enabled: true, type: 'pink', level: 0.25, decay: 0.04 },
  pitchEnvelope: {
    startOffset: 8,
    decayTime: 0.12,
    curve: 'exponential',
  },
  ampEnvelope: {
    attack: 0.002,
    decay: 0.4,
    sustain: 0.35,
    release: 0.6,
  },
  distortion: {
    drive: 0.5,
    type: 'bitcrush',
    mix: 0.7,
    bitDepth: 6,
  },
  filter: {
    type: 'lowpass',
    frequency: 500,
    resonance: 2,
  },
  filterEnvelope: { ...defaultFilterEnvelope },
  compressor: {
    enabled: true, // Lo-Fi benefits from compression
    threshold: -15,
    ratio: 6,
    attack: 0.005,
    release: 0.1,
    makeupGain: 3,
  },
  eq: {
    lowGain: 2,
    midGain: 4,
    midFreq: 600,
    highGain: -8,
  },
  reverb: { ...defaultReverb, enabled: true, decay: 1.0, mix: 0.1 },
  limiter: { ...defaultLimiter, threshold: -6 },
  lfo: { ...defaultLFO },
  masterVolume: -8,
};

// Smooth - Clean with subtle reverb
const smooth808: Sound808Params = {
  synth: {
    note: 'E1',
    frequency: 41.2,
    waveform: 'sine',
    velocity: 0.7,
  },
  subOscillator: { ...defaultSubOscillator, enabled: true, level: 0.4, octave: -1 },
  noiseLayer: { ...defaultNoiseLayer },
  pitchEnvelope: {
    startOffset: 10,
    decayTime: 0.18,
    curve: 'exponential',
  },
  ampEnvelope: {
    attack: 0.003,
    decay: 0.5,
    sustain: 0.45,
    release: 0.8,
  },
  distortion: {
    drive: 0.05,
    type: 'tape',
    mix: 0.1,
    bitDepth: 8,
  },
  filter: {
    type: 'lowpass',
    frequency: 150,
    resonance: 0.7,
  },
  filterEnvelope: { ...defaultFilterEnvelope },
  compressor: {
    enabled: false,
    threshold: -8,
    ratio: 2,
    attack: 0.01,
    release: 0.2,
    makeupGain: 0,
  },
  eq: {
    lowGain: 3,
    midGain: -1,
    midFreq: 400,
    highGain: -4,
  },
  reverb: { ...defaultReverb, enabled: true, decay: 2.0, preDelay: 0.02, mix: 0.25 },
  limiter: { ...defaultLimiter },
  lfo: { ...defaultLFO },
  masterVolume: -6,
};

// Synth Bass - Filter envelope sweep
const synthBass: Sound808Params = {
  synth: {
    note: 'A1',
    frequency: 55.0,
    waveform: 'triangle',
    velocity: 0.85,
  },
  subOscillator: { ...defaultSubOscillator, enabled: true, level: 0.5, octave: -1, detune: 5 },
  noiseLayer: { ...defaultNoiseLayer },
  pitchEnvelope: {
    startOffset: 4,
    decayTime: 0.1,
    curve: 'exponential',
  },
  ampEnvelope: {
    attack: 0.001,
    decay: 0.35,
    sustain: 0.5,
    release: 0.4,
  },
  distortion: {
    drive: 0.25,
    type: 'waveshaper',
    mix: 0.35,
    bitDepth: 8,
  },
  filter: {
    type: 'lowpass',
    frequency: 400,
    resonance: 4,
  },
  filterEnvelope: { ...defaultFilterEnvelope, enabled: true, amount: 2000, attack: 0.001, decay: 0.25, sustain: 0.2, release: 0.3 },
  compressor: {
    enabled: false,
    threshold: -12,
    ratio: 4,
    attack: 0.002,
    release: 0.1,
    makeupGain: 1,
  },
  eq: {
    lowGain: 2,
    midGain: 2,
    midFreq: 500,
    highGain: -2,
  },
  reverb: { ...defaultReverb },
  limiter: { ...defaultLimiter },
  lfo: { ...defaultLFO },
  masterVolume: -6,
};

// Booming - Maximum sub weight
const booming808: Sound808Params = {
  synth: {
    note: 'C1',
    frequency: 32.7,
    waveform: 'sine',
    velocity: 1.0,
  },
  subOscillator: { ...defaultSubOscillator, enabled: true, level: 0.8, octave: -2 },
  noiseLayer: { ...defaultNoiseLayer, enabled: true, level: 0.1, decay: 0.015 },
  pitchEnvelope: {
    startOffset: 24,
    decayTime: 0.12,
    curve: 'exponential',
  },
  ampEnvelope: {
    attack: 0.001,
    decay: 0.9,
    sustain: 0.4,
    release: 1.2,
  },
  distortion: {
    drive: 0.1,
    type: 'softclip',
    mix: 0.15,
    bitDepth: 8,
  },
  filter: {
    type: 'lowpass',
    frequency: 100,
    resonance: 1,
  },
  filterEnvelope: { ...defaultFilterEnvelope },
  compressor: {
    enabled: false,
    threshold: -6,
    ratio: 3,
    attack: 0.005,
    release: 0.15,
    makeupGain: 2,
  },
  eq: {
    lowGain: 8,
    midGain: -4,
    midFreq: 300,
    highGain: -12,
  },
  reverb: { ...defaultReverb },
  limiter: { ...defaultLimiter, threshold: -3 },
  lfo: { ...defaultLFO },
  masterVolume: -8,
};

// Tape Warm - Analog warmth
const tapeWarm: Sound808Params = {
  synth: {
    note: 'F1',
    frequency: 43.7,
    waveform: 'sine',
    velocity: 0.8,
  },
  subOscillator: { ...defaultSubOscillator, enabled: true, level: 0.35, octave: -1 },
  noiseLayer: { ...defaultNoiseLayer, enabled: true, type: 'pink', level: 0.08, decay: 0.03 },
  pitchEnvelope: {
    startOffset: 14,
    decayTime: 0.16,
    curve: 'exponential',
  },
  ampEnvelope: {
    attack: 0.002,
    decay: 0.45,
    sustain: 0.4,
    release: 0.6,
  },
  distortion: {
    drive: 0.4,
    type: 'tape',
    mix: 0.5,
    bitDepth: 8,
  },
  filter: {
    type: 'lowpass',
    frequency: 250,
    resonance: 1.2,
  },
  filterEnvelope: { ...defaultFilterEnvelope },
  compressor: {
    enabled: false,
    threshold: -10,
    ratio: 3,
    attack: 0.008,
    release: 0.12,
    makeupGain: 1,
  },
  eq: {
    lowGain: 3,
    midGain: 1,
    midFreq: 400,
    highGain: -5,
  },
  reverb: { ...defaultReverb, enabled: true, decay: 1.2, mix: 0.12 },
  limiter: { ...defaultLimiter },
  lfo: { ...defaultLFO },
  masterVolume: -6,
};

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'classic-808',
    name: 'Classic 808',
    category: 'Classic',
    params: classic808,
    createdAt: Date.now(),
  },
  {
    id: 'distorted-808',
    name: 'Distorted 808',
    category: 'Aggressive',
    params: distorted808,
    createdAt: Date.now(),
  },
  {
    id: 'deep-sub',
    name: 'Deep Sub',
    category: 'Clean',
    params: deepSub,
    createdAt: Date.now(),
  },
  {
    id: 'punchy-808',
    name: 'Punchy 808',
    category: 'Classic',
    params: punchy808,
    createdAt: Date.now(),
  },
  {
    id: 'trap-sub',
    name: 'Trap Sub',
    category: 'Modern',
    params: trapSub,
    createdAt: Date.now(),
  },
  {
    id: 'lo-fi-808',
    name: 'Lo-Fi 808',
    category: 'Lo-Fi',
    params: loFi808,
    createdAt: Date.now(),
  },
  {
    id: 'smooth-808',
    name: 'Smooth',
    category: 'Clean',
    params: smooth808,
    createdAt: Date.now(),
  },
  {
    id: 'synth-bass',
    name: 'Synth Bass',
    category: 'Modern',
    params: synthBass,
    createdAt: Date.now(),
  },
  {
    id: 'booming-808',
    name: 'Booming',
    category: 'Aggressive',
    params: booming808,
    createdAt: Date.now(),
  },
  {
    id: 'tape-warm',
    name: 'Tape Warm',
    category: 'Lo-Fi',
    params: tapeWarm,
    createdAt: Date.now(),
  },
];

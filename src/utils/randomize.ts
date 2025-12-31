/**
 * Random parameter generator for 808 sound exploration
 */

import type { Sound808Params } from '../types';

// Note frequencies for bass range
const NOTE_FREQUENCIES: Record<string, number> = {
  'C1': 32.7,
  'D1': 36.7,
  'E1': 41.2,
  'F1': 43.7,
  'G1': 49.0,
  'A1': 55.0,
  'B1': 61.7,
  'C2': 65.4,
};

const NOTES = Object.keys(NOTE_FREQUENCIES);

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBool(probability = 0.5): boolean {
  return Math.random() < probability;
}

/**
 * Generate random but musically sensible 808 parameters
 */
export function generateRandomParams(): Sound808Params {
  const note = randomChoice(NOTES);

  return {
    synth: {
      note,
      frequency: NOTE_FREQUENCIES[note],
      waveform: randomChoice(['sine', 'triangle'] as const),
      velocity: randomRange(0.7, 1.0),
    },

    subOscillator: {
      enabled: randomBool(0.6), // 60% chance enabled
      level: randomRange(0.3, 0.7),
      octave: randomChoice([-1, -2] as const),
      detune: randomRange(-15, 15),
    },

    noiseLayer: {
      enabled: randomBool(0.4), // 40% chance enabled
      type: randomChoice(['white', 'pink'] as const),
      level: randomRange(0.1, 0.4),
      attack: randomRange(0.001, 0.005),
      decay: randomRange(0.02, 0.1),
      filterFreq: randomRange(400, 1200),
    },

    pitchEnvelope: {
      startOffset: randomInt(6, 24),
      decayTime: randomRange(0.05, 0.25),
      curve: randomChoice(['linear', 'exponential'] as const),
    },

    ampEnvelope: {
      attack: randomRange(0.001, 0.01),
      decay: randomRange(0.15, 0.5),
      sustain: randomRange(0.2, 0.5),
      release: randomRange(0.2, 1.0),
    },

    distortion: {
      drive: randomRange(0, 0.5),
      type: randomChoice(['softclip', 'hardclip', 'waveshaper', 'tape', 'bitcrush'] as const),
      mix: randomRange(0.2, 0.5),
      bitDepth: randomInt(4, 12),
    },

    filter: {
      type: randomChoice(['lowpass', 'highpass', 'bandpass'] as const),
      frequency: randomRange(100, 800),
      resonance: randomRange(0.5, 3),
    },

    filterEnvelope: {
      enabled: randomBool(0.3), // 30% chance enabled
      amount: randomRange(500, 2000),
      attack: randomRange(0.001, 0.01),
      decay: randomRange(0.1, 0.3),
      sustain: randomRange(0.2, 0.5),
      release: randomRange(0.1, 0.4),
    },

    compressor: {
      enabled: randomBool(0.3), // 30% chance enabled
      threshold: randomRange(-24, -6),
      ratio: randomChoice([2, 4, 6, 8]),
      attack: randomRange(0.001, 0.01),
      release: randomRange(0.05, 0.2),
      makeupGain: randomRange(0, 6),
    },

    eq: {
      lowGain: randomRange(0, 6),
      midGain: randomRange(-3, 3),
      midFreq: randomRange(200, 600),
      highGain: randomRange(-6, 0),
    },

    reverb: {
      enabled: randomBool(0.25), // 25% chance enabled
      decay: randomRange(0.5, 2),
      preDelay: randomRange(0, 0.03),
      mix: randomRange(0.1, 0.3),
    },

    limiter: {
      enabled: randomBool(0.7), // 70% chance enabled
      threshold: randomRange(-6, -1),
    },

    masterVolume: randomRange(-12, -3),
  };
}

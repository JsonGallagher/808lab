import * as Tone from 'tone';
import type { Sound808Params } from '../types';

// Configure Tone.js for lower latency
// lookAhead: time in seconds to schedule ahead (lower = less latency, but more CPU)
// updateInterval: how often the scheduler runs
Tone.getContext().lookAhead = 0.01; // 10ms instead of default 100ms

// Default 808 parameters
export const DEFAULT_PARAMS: Sound808Params = {
  synth: {
    note: 'E1',
    frequency: 41.2,
    waveform: 'sine',
    velocity: 0.8,
  },
  subOscillator: {
    enabled: false,
    level: 0.5,
    octave: -1,
    detune: 0,
  },
  noiseLayer: {
    enabled: false,
    type: 'white',
    level: 0.3,
    attack: 0.001,
    decay: 0.05,
    filterFreq: 800,
  },
  pitchEnvelope: {
    startOffset: 12, // semitones (one octave up)
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
    drive: 0.2,
    type: 'softclip',
    mix: 0.3,
    bitDepth: 8,
  },
  filter: {
    type: 'lowpass',
    frequency: 200,
    resonance: 1,
  },
  filterEnvelope: {
    enabled: false,
    amount: 1000,
    attack: 0.001,
    decay: 0.2,
    sustain: 0.3,
    release: 0.3,
  },
  compressor: {
    enabled: false,
    threshold: -12,
    ratio: 4,
    attack: 0.003,
    release: 0.1,
    makeupGain: 0,
  },
  eq: {
    lowGain: 3,
    midGain: 0,
    midFreq: 400,
    highGain: -3,
  },
  reverb: {
    enabled: false,
    decay: 1.5,
    preDelay: 0.01,
    mix: 0.2,
  },
  limiter: {
    enabled: true,
    threshold: -2,
  },
  masterVolume: -6,
};

export class AudioEngine {
  // Main oscillator
  private synth: Tone.Synth | null = null;

  // Sub oscillator
  private subSynth: Tone.Synth | null = null;
  private subGain: Tone.Gain | null = null;

  // Noise layer
  private noise: Tone.Noise | null = null;
  private noiseFilter: Tone.Filter | null = null;
  private noiseEnvelope: Tone.AmplitudeEnvelope | null = null;
  private noiseGain: Tone.Gain | null = null;

  // Oscillator mix
  private oscMix: Tone.Gain | null = null;

  // Distortion (multiple types)
  private distortion: Tone.Chebyshev | null = null;
  private bitcrusher: Tone.BitCrusher | null = null;
  private waveshaper: Tone.WaveShaper | null = null;
  private distortionGain: Tone.Gain | null = null;
  private dryGain: Tone.Gain | null = null;
  private distortionMix: Tone.Gain | null = null;

  // Filter with envelope
  private filter: Tone.Filter | null = null;
  private filterEnvelope: Tone.FrequencyEnvelope | null = null;

  // Other effects
  private compressor: Tone.Compressor | null = null;
  private eq: Tone.EQ3 | null = null;
  private reverb: Tone.Reverb | null = null;
  private reverbDry: Tone.Gain | null = null;
  private reverbWet: Tone.Gain | null = null;
  private reverbMix: Tone.Gain | null = null;
  private limiter: Tone.Limiter | null = null;
  private gain: Tone.Gain | null = null;
  private analyser: Tone.Analyser | null = null;
  private fftAnalyser: Tone.Analyser | null = null;
  private bypassGain: Tone.Gain | null = null;

  private params: Sound808Params = { ...DEFAULT_PARAMS };
  private isInitialized = false;
  private isInitializing = false; // Prevent double initialization
  private effectsConnected = false;
  private triggerTime: number = 0;

  async initialize(): Promise<void> {
    // Prevent double initialization (race condition protection)
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;

    // Start audio context with low-latency hint
    await Tone.start();

    // === MAIN SYNTH ===
    this.synth = new Tone.Synth({
      oscillator: {
        type: this.params.synth.waveform,
      },
      envelope: {
        attack: this.params.ampEnvelope.attack,
        decay: this.params.ampEnvelope.decay,
        sustain: this.params.ampEnvelope.sustain,
        release: this.params.ampEnvelope.release,
      },
    });

    // === SUB OSCILLATOR ===
    this.subSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: this.params.ampEnvelope.attack,
        decay: this.params.ampEnvelope.decay,
        sustain: this.params.ampEnvelope.sustain,
        release: this.params.ampEnvelope.release,
      },
    });
    this.subGain = new Tone.Gain(
      this.params.subOscillator.enabled ? this.params.subOscillator.level : 0
    );

    // === NOISE LAYER ===
    this.noise = new Tone.Noise(this.params.noiseLayer.type);
    this.noiseFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: this.params.noiseLayer.filterFreq,
    });
    this.noiseEnvelope = new Tone.AmplitudeEnvelope({
      attack: this.params.noiseLayer.attack,
      decay: this.params.noiseLayer.decay,
      sustain: 0,
      release: 0.01,
    });
    this.noiseGain = new Tone.Gain(
      this.params.noiseLayer.enabled ? this.params.noiseLayer.level : 0
    );
    // Chain: noise → filter → envelope → gain
    this.noise.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseEnvelope);
    this.noiseEnvelope.connect(this.noiseGain);
    this.noise.start();

    // === OSCILLATOR MIX ===
    this.oscMix = new Tone.Gain(1);
    this.synth.connect(this.oscMix);
    this.subSynth.connect(this.subGain);
    this.subGain.connect(this.oscMix);
    this.noiseGain.connect(this.oscMix);

    // === DISTORTION (Multiple Types) ===
    const order = Math.max(1, Math.round(this.params.distortion.drive * 50));
    this.distortion = new Tone.Chebyshev(order);
    this.bitcrusher = new Tone.BitCrusher(this.params.distortion.bitDepth || 8);

    // Custom waveshaper curves for different saturation types
    this.waveshaper = new Tone.WaveShaper((val) => {
      // Tape-style soft saturation
      const drive = this.params.distortion.drive * 2;
      return Math.tanh(val * (1 + drive));
    }, 4096);

    this.distortionGain = new Tone.Gain(this.params.distortion.mix);
    this.dryGain = new Tone.Gain(1 - this.params.distortion.mix);
    this.distortionMix = new Tone.Gain(1);

    // === FILTER WITH ENVELOPE ===
    this.filter = new Tone.Filter({
      type: this.params.filter.type,
      frequency: this.params.filter.frequency,
      Q: this.params.filter.resonance,
    });
    this.filterEnvelope = new Tone.FrequencyEnvelope({
      attack: this.params.filterEnvelope.attack,
      decay: this.params.filterEnvelope.decay,
      sustain: this.params.filterEnvelope.sustain,
      release: this.params.filterEnvelope.release,
      baseFrequency: this.params.filter.frequency,
      octaves: Math.log2((this.params.filter.frequency + this.params.filterEnvelope.amount) / this.params.filter.frequency),
    });
    if (this.params.filterEnvelope.enabled) {
      this.filterEnvelope.connect(this.filter.frequency);
    }

    // === OTHER EFFECTS ===
    this.compressor = new Tone.Compressor({
      threshold: this.params.compressor.threshold,
      ratio: this.params.compressor.ratio,
      attack: this.params.compressor.attack,
      release: this.params.compressor.release,
    });

    this.eq = new Tone.EQ3({
      low: this.params.eq.lowGain,
      mid: this.params.eq.midGain,
      high: this.params.eq.highGain,
    });

    // === REVERB ===
    this.reverb = new Tone.Reverb({
      decay: this.params.reverb.decay,
      preDelay: this.params.reverb.preDelay,
    });
    // Pre-generate reverb impulse response (don't await - let it generate in background)
    this.reverb.generate();
    this.reverbDry = new Tone.Gain(1 - this.params.reverb.mix);
    this.reverbWet = new Tone.Gain(this.params.reverb.enabled ? this.params.reverb.mix : 0);
    this.reverbMix = new Tone.Gain(1);

    // === LIMITER ===
    this.limiter = new Tone.Limiter(this.params.limiter.threshold);

    this.gain = new Tone.Gain(Tone.dbToGain(this.params.masterVolume));
    // Smaller analyser buffers = less latency (256/128 instead of 512/256)
    this.analyser = new Tone.Analyser('waveform', 256);
    this.fftAnalyser = new Tone.Analyser('fft', 128);
    this.bypassGain = new Tone.Gain(1);

    // === SIGNAL ROUTING ===
    // Connect distortion based on type
    this.connectDistortionType(this.params.distortion.type);

    // Dry path: oscMix → dryGain → distortionMix
    this.oscMix.connect(this.dryGain);
    this.dryGain.connect(this.distortionMix);

    // Effects chain: distortionMix → filter → compressor → eq → reverbMix → limiter → gain
    this.distortionMix.chain(
      this.filter,
      this.compressor,
      this.eq
    );

    // Reverb wet/dry routing
    this.eq.connect(this.reverbDry);
    this.eq.connect(this.reverb);
    this.reverb.connect(this.reverbWet);
    this.reverbDry.connect(this.reverbMix);
    this.reverbWet.connect(this.reverbMix);

    // Limiter → master gain
    if (this.params.limiter.enabled) {
      this.reverbMix.connect(this.limiter);
      this.limiter.connect(this.gain);
    } else {
      this.reverbMix.connect(this.gain);
    }

    // Bypass path: oscMix → bypassGain → gain
    this.oscMix.connect(this.bypassGain);
    this.bypassGain.connect(this.gain);

    // Output: gain → analysers → destination
    this.gain.connect(this.analyser);
    this.gain.connect(this.fftAnalyser);
    this.analyser.connect(Tone.getDestination());

    // Mark as initialized first so setEffectsConnected works
    this.isInitialized = true;

    // Apply the current effects connection state (may have been set before init by CablesManager)
    this.setEffectsConnected(this.effectsConnected);
  }

  // Connect or disconnect effects
  setEffectsConnected(connected: boolean): void {
    // Always store the desired state (even before initialization)
    this.effectsConnected = connected;

    // Only apply routing if initialized
    if (this.isInitialized && this.distortionMix && this.bypassGain && this.gain && this.filter && this.compressor && this.eq && this.reverbMix) {
      if (connected) {
        // Effects path active, bypass muted
        try {
          this.distortionMix.disconnect();
          this.eq.disconnect();
        } catch {
          // Ignore disconnect errors
        }

        // Chain: distortionMix → filter → compressor → eq
        this.distortionMix.chain(
          this.filter,
          this.compressor,
          this.eq
        );

        // eq → reverb wet/dry → reverbMix (already connected in initialize)
        this.eq.connect(this.reverbDry!);
        this.eq.connect(this.reverb!);

        this.bypassGain.gain.value = 0;
      } else {
        // Bypass active, effects muted
        try {
          this.distortionMix.disconnect();
        } catch {
          // Ignore disconnect errors
        }
        this.bypassGain.gain.value = 1;
      }
    }
  }

  isEffectsConnected(): boolean {
    return this.effectsConnected;
  }

  // Connect the appropriate distortion type
  private connectDistortionType(type: string): void {
    if (!this.oscMix || !this.distortionGain || !this.distortionMix) return;

    // Disconnect any existing wet path from oscMix
    // Note: We reconnect fresh each time type changes
    try {
      this.distortion?.disconnect();
      this.bitcrusher?.disconnect();
      this.waveshaper?.disconnect();
    } catch {
      // Ignore disconnect errors
    }

    // Connect based on type
    switch (type) {
      case 'bitcrush':
        if (this.bitcrusher) {
          this.oscMix.connect(this.bitcrusher);
          this.bitcrusher.connect(this.distortionGain);
          this.distortionGain.connect(this.distortionMix);
        }
        break;
      case 'tape':
      case 'waveshaper':
        if (this.waveshaper) {
          // Update waveshaper curve based on type
          const drive = this.params.distortion.drive;
          if (type === 'tape') {
            // Tape saturation - warm, asymmetric
            this.waveshaper.curve = new Float32Array(4096).map((_, i) => {
              const x = (i / 4096) * 2 - 1;
              return Math.tanh(x * (1 + drive * 2)) * 0.9;
            });
          } else {
            // Generic waveshaper - more aggressive
            this.waveshaper.curve = new Float32Array(4096).map((_, i) => {
              const x = (i / 4096) * 2 - 1;
              const k = drive * 100;
              return (1 + k) * x / (1 + k * Math.abs(x));
            });
          }
          this.oscMix.connect(this.waveshaper);
          this.waveshaper.connect(this.distortionGain);
          this.distortionGain.connect(this.distortionMix);
        }
        break;
      case 'hardclip':
        if (this.waveshaper) {
          // Hard clipping
          const threshold = 1 - this.params.distortion.drive * 0.8;
          this.waveshaper.curve = new Float32Array(4096).map((_, i) => {
            const x = (i / 4096) * 2 - 1;
            return Math.max(-threshold, Math.min(threshold, x));
          });
          this.oscMix.connect(this.waveshaper);
          this.waveshaper.connect(this.distortionGain);
          this.distortionGain.connect(this.distortionMix);
        }
        break;
      case 'softclip':
      default:
        // Chebyshev polynomial distortion (default)
        if (this.distortion) {
          this.oscMix.connect(this.distortion);
          this.distortion.connect(this.distortionGain);
          this.distortionGain.connect(this.distortionMix);
        }
        break;
    }
  }

  // Trigger the 808 sound
  trigger(): void {
    if (!this.synth || !this.isInitialized) return;

    const now = Tone.now();
    this.triggerTime = now;
    const { synth, subOscillator, pitchEnvelope, ampEnvelope } = this.params;

    // Calculate frequencies
    const baseFreq = Tone.Frequency(synth.note).toFrequency();
    const startFreq = baseFreq * Math.pow(2, pitchEnvelope.startOffset / 12);

    // Calculate sub frequency (1 or 2 octaves below)
    const subOctaveMultiplier = subOscillator.octave === -2 ? 0.25 : 0.5;
    const subBaseFreq = baseFreq * subOctaveMultiplier;
    const subStartFreq = startFreq * subOctaveMultiplier;
    // Apply detune in cents
    const detuneMultiplier = Math.pow(2, subOscillator.detune / 1200);

    // Calculate note duration
    const duration = ampEnvelope.attack + ampEnvelope.decay;

    // === TRIGGER MAIN SYNTH ===
    this.synth.triggerAttack(startFreq, now, synth.velocity);

    // Pitch envelope for main synth
    if (pitchEnvelope.curve === 'exponential') {
      this.synth.frequency.exponentialRampTo(
        Math.max(baseFreq, 1),
        pitchEnvelope.decayTime,
        now
      );
    } else {
      this.synth.frequency.linearRampTo(
        baseFreq,
        pitchEnvelope.decayTime,
        now
      );
    }

    // Schedule release
    this.synth.triggerRelease(now + duration);

    // === TRIGGER SUB OSCILLATOR ===
    if (this.subSynth && subOscillator.enabled) {
      this.subSynth.triggerAttack(subStartFreq * detuneMultiplier, now, synth.velocity);

      // Pitch envelope for sub (follows main)
      if (pitchEnvelope.curve === 'exponential') {
        this.subSynth.frequency.exponentialRampTo(
          Math.max(subBaseFreq * detuneMultiplier, 1),
          pitchEnvelope.decayTime,
          now
        );
      } else {
        this.subSynth.frequency.linearRampTo(
          subBaseFreq * detuneMultiplier,
          pitchEnvelope.decayTime,
          now
        );
      }

      this.subSynth.triggerRelease(now + duration);
    }

    // === TRIGGER NOISE ENVELOPE ===
    if (this.noiseEnvelope && this.params.noiseLayer.enabled) {
      this.noiseEnvelope.triggerAttackRelease(
        this.params.noiseLayer.attack + this.params.noiseLayer.decay,
        now
      );
    }

    // === TRIGGER FILTER ENVELOPE ===
    if (this.filterEnvelope && this.params.filterEnvelope.enabled) {
      this.filterEnvelope.triggerAttackRelease(duration + ampEnvelope.release, now);
    }
  }

  // Get waveform data for visualization
  getWaveformData(): Float32Array {
    if (!this.analyser) return new Float32Array(256);
    return this.analyser.getValue() as Float32Array;
  }

  // Get FFT data for spectrum visualization
  getFFTData(): Float32Array {
    if (!this.fftAnalyser) return new Float32Array(128);
    return this.fftAnalyser.getValue() as Float32Array;
  }

  // Get trigger time for playhead
  getTriggerTime(): number {
    return this.triggerTime;
  }

  // Get current time
  getCurrentTime(): number {
    return Tone.now();
  }

  // Update synth parameters
  updateSynthParams(params: Partial<Sound808Params['synth']>): void {
    this.params.synth = { ...this.params.synth, ...params };

    if (this.synth && params.waveform) {
      this.synth.oscillator.type = params.waveform;
    }
  }

  // Update pitch envelope
  updatePitchEnvelope(params: Partial<Sound808Params['pitchEnvelope']>): void {
    this.params.pitchEnvelope = { ...this.params.pitchEnvelope, ...params };
  }

  // Update amplitude envelope
  updateAmpEnvelope(params: Partial<Sound808Params['ampEnvelope']>): void {
    this.params.ampEnvelope = { ...this.params.ampEnvelope, ...params };

    if (this.synth) {
      const { attack, decay, sustain, release } = this.params.ampEnvelope;
      this.synth.envelope.attack = attack;
      this.synth.envelope.decay = decay;
      this.synth.envelope.sustain = sustain;
      this.synth.envelope.release = release;
    }
  }

  // Update distortion
  updateDistortion(params: Partial<Sound808Params['distortion']>): void {
    this.params.distortion = { ...this.params.distortion, ...params };

    // Handle type change - reconnect the appropriate distortion
    if (params.type !== undefined) {
      this.connectDistortionType(params.type);
    }

    // Update Chebyshev order for softclip
    if (this.distortion && params.drive !== undefined) {
      const order = Math.max(1, Math.round(params.drive * 50));
      this.distortion.order = order;
    }

    // Update bitcrusher bit depth
    if (this.bitcrusher && params.bitDepth !== undefined) {
      this.bitcrusher.bits.value = params.bitDepth;
    }

    // Update waveshaper curves when drive changes
    if (params.drive !== undefined && this.params.distortion.type !== 'softclip' && this.params.distortion.type !== 'bitcrush') {
      this.connectDistortionType(this.params.distortion.type);
    }

    // Update dry/wet mix
    if (params.mix !== undefined) {
      if (this.distortionGain) this.distortionGain.gain.value = params.mix;
      if (this.dryGain) this.dryGain.gain.value = 1 - params.mix;
    }
  }

  // Update filter
  updateFilter(params: Partial<Sound808Params['filter']>): void {
    this.params.filter = { ...this.params.filter, ...params };

    if (this.filter) {
      if (params.type) this.filter.type = params.type;
      if (params.frequency !== undefined) this.filter.frequency.value = params.frequency;
      if (params.resonance !== undefined) this.filter.Q.value = params.resonance;
    }
  }

  // Update compressor
  updateCompressor(params: Partial<Sound808Params['compressor']>): void {
    this.params.compressor = { ...this.params.compressor, ...params };

    if (this.compressor) {
      const { enabled, threshold, ratio, attack, release } = this.params.compressor;

      // When disabled, set ratio to 1 (bypass)
      if (params.enabled !== undefined || params.ratio !== undefined) {
        this.compressor.ratio.value = enabled ? ratio : 1;
      }
      if (params.threshold !== undefined) this.compressor.threshold.value = threshold;
      if (params.attack !== undefined) this.compressor.attack.value = attack;
      if (params.release !== undefined) this.compressor.release.value = release;
    }
  }

  // Update EQ
  updateEQ(params: Partial<Sound808Params['eq']>): void {
    this.params.eq = { ...this.params.eq, ...params };

    if (this.eq) {
      if (params.lowGain !== undefined) this.eq.low.value = params.lowGain;
      if (params.midGain !== undefined) this.eq.mid.value = params.midGain;
      if (params.highGain !== undefined) this.eq.high.value = params.highGain;
    }
  }

  // Update reverb
  updateReverb(params: Partial<Sound808Params['reverb']>): void {
    this.params.reverb = { ...this.params.reverb, ...params };

    if (this.reverb) {
      if (params.decay !== undefined) this.reverb.decay = params.decay;
      if (params.preDelay !== undefined) this.reverb.preDelay = params.preDelay;
    }

    // Update wet/dry mix
    if (params.mix !== undefined || params.enabled !== undefined) {
      const { enabled, mix } = this.params.reverb;
      if (this.reverbWet) this.reverbWet.gain.value = enabled ? mix : 0;
      if (this.reverbDry) this.reverbDry.gain.value = 1 - (enabled ? mix : 0);
    }
  }

  // Update limiter
  updateLimiter(params: Partial<Sound808Params['limiter']>): void {
    this.params.limiter = { ...this.params.limiter, ...params };

    if (this.limiter && params.threshold !== undefined) {
      this.limiter.threshold.value = params.threshold;
    }

    // Handle enabled state - reconnect/disconnect limiter
    if (params.enabled !== undefined && this.reverbMix && this.limiter && this.gain) {
      try {
        this.reverbMix.disconnect();
        this.limiter.disconnect();
      } catch {
        // Ignore disconnect errors
      }

      if (params.enabled) {
        this.reverbMix.connect(this.limiter);
        this.limiter.connect(this.gain);
      } else {
        this.reverbMix.connect(this.gain);
      }
    }
  }

  // Update sub oscillator
  updateSubOscillator(params: Partial<Sound808Params['subOscillator']>): void {
    this.params.subOscillator = { ...this.params.subOscillator, ...params };

    if (this.subGain) {
      // Update gain based on enabled state and level
      const { enabled, level } = this.params.subOscillator;
      this.subGain.gain.value = enabled ? level : 0;
    }

    if (this.subSynth && params.detune !== undefined) {
      this.subSynth.detune.value = params.detune;
    }
  }

  // Update noise layer
  updateNoiseLayer(params: Partial<Sound808Params['noiseLayer']>): void {
    this.params.noiseLayer = { ...this.params.noiseLayer, ...params };

    if (this.noise && params.type !== undefined) {
      this.noise.type = params.type;
    }

    if (this.noiseFilter && params.filterFreq !== undefined) {
      this.noiseFilter.frequency.value = params.filterFreq;
    }

    if (this.noiseEnvelope) {
      if (params.attack !== undefined) this.noiseEnvelope.attack = params.attack;
      if (params.decay !== undefined) this.noiseEnvelope.decay = params.decay;
    }

    if (this.noiseGain) {
      const { enabled, level } = this.params.noiseLayer;
      this.noiseGain.gain.value = enabled ? level : 0;
    }
  }

  // Update filter envelope
  updateFilterEnvelope(params: Partial<Sound808Params['filterEnvelope']>): void {
    this.params.filterEnvelope = { ...this.params.filterEnvelope, ...params };

    if (this.filterEnvelope) {
      if (params.attack !== undefined) this.filterEnvelope.attack = params.attack;
      if (params.decay !== undefined) this.filterEnvelope.decay = params.decay;
      if (params.sustain !== undefined) this.filterEnvelope.sustain = params.sustain;
      if (params.release !== undefined) this.filterEnvelope.release = params.release;

      // Update octaves based on amount
      if (params.amount !== undefined && this.filter) {
        const baseFreq = this.params.filter.frequency;
        const octaves = Math.log2((baseFreq + params.amount) / baseFreq);
        this.filterEnvelope.octaves = Math.max(0.1, octaves);
      }
    }

    // Connect/disconnect filter envelope based on enabled state
    if (params.enabled !== undefined && this.filterEnvelope && this.filter) {
      if (params.enabled) {
        // Connect envelope to filter frequency
        try {
          this.filterEnvelope.connect(this.filter.frequency);
        } catch {
          // Already connected, ignore
        }
      } else {
        // Disconnect envelope from filter frequency specifically
        try {
          this.filterEnvelope.disconnect(this.filter.frequency);
        } catch {
          // Not connected or already disconnected, ignore
        }
        // Reset filter to base frequency
        this.filter.frequency.value = this.params.filter.frequency;
      }
    }
  }

  // Update master volume
  updateMasterVolume(db: number): void {
    this.params.masterVolume = db;
    if (this.gain) {
      this.gain.gain.value = Tone.dbToGain(db);
    }
  }

  // Get all current parameters
  getParams(): Sound808Params {
    return { ...this.params };
  }

  // Set all parameters at once (for loading presets)
  setParams(params: Sound808Params): void {
    this.params = { ...params };

    // Apply all parameters
    this.updateSynthParams(params.synth);
    this.updateSubOscillator(params.subOscillator);
    this.updateNoiseLayer(params.noiseLayer);
    this.updatePitchEnvelope(params.pitchEnvelope);
    this.updateAmpEnvelope(params.ampEnvelope);
    this.updateDistortion(params.distortion);
    this.updateFilter(params.filter);
    this.updateFilterEnvelope(params.filterEnvelope);
    this.updateCompressor(params.compressor);
    this.updateEQ(params.eq);
    this.updateReverb(params.reverb);
    this.updateLimiter(params.limiter);
    this.updateMasterVolume(params.masterVolume);

    // Re-establish effects connection if it was connected
    if (this.effectsConnected) {
      this.setEffectsConnected(true);
    }
  }

  // Render audio offline for preview/export
  async renderOffline(duration?: number): Promise<Float32Array> {
    const params = this.params;
    const effectsConnected = this.effectsConnected;

    // Calculate duration from envelope if not specified
    const renderDuration = duration ||
      (params.ampEnvelope.attack + params.ampEnvelope.decay + params.ampEnvelope.release + 0.1);

    // Render offline
    const buffer = await Tone.Offline(() => {
      // Create synth
      const synth = new Tone.Synth({
        oscillator: { type: params.synth.waveform },
        envelope: {
          attack: params.ampEnvelope.attack,
          decay: params.ampEnvelope.decay,
          sustain: params.ampEnvelope.sustain,
          release: params.ampEnvelope.release,
        },
      });

      // Create sub oscillator
      const subSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: params.ampEnvelope.attack,
          decay: params.ampEnvelope.decay,
          sustain: params.ampEnvelope.sustain,
          release: params.ampEnvelope.release,
        },
      });
      const subGain = new Tone.Gain(
        params.subOscillator.enabled ? params.subOscillator.level : 0
      );

      // Create noise layer
      const noise = new Tone.Noise(params.noiseLayer.type);
      const noiseFilter = new Tone.Filter({
        type: 'lowpass',
        frequency: params.noiseLayer.filterFreq,
      });
      const noiseEnvelope = new Tone.AmplitudeEnvelope({
        attack: params.noiseLayer.attack,
        decay: params.noiseLayer.decay,
        sustain: 0,
        release: 0.01,
      });
      const noiseGain = new Tone.Gain(
        params.noiseLayer.enabled ? params.noiseLayer.level : 0
      );
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseEnvelope);
      noiseEnvelope.connect(noiseGain);
      noise.start(0);

      // Mix oscillators
      const oscMix = new Tone.Gain(1);
      synth.connect(oscMix);
      subSynth.connect(subGain);
      subGain.connect(oscMix);
      noiseGain.connect(oscMix);

      // Master gain
      const masterGain = new Tone.Gain(Tone.dbToGain(params.masterVolume));

      if (effectsConnected) {
        // Create effects chain
        const order = Math.max(1, Math.round(params.distortion.drive * 50));
        const distortion = new Tone.Chebyshev(order);
        const distortionGain = new Tone.Gain(params.distortion.mix);
        const dryGain = new Tone.Gain(1 - params.distortion.mix);
        const distortionMix = new Tone.Gain(1);

        const filter = new Tone.Filter({
          type: params.filter.type,
          frequency: params.filter.frequency,
          Q: params.filter.resonance,
        });

        const compressor = new Tone.Compressor({
          threshold: params.compressor.threshold,
          ratio: params.compressor.ratio,
          attack: params.compressor.attack,
          release: params.compressor.release,
        });

        const eq = new Tone.EQ3({
          low: params.eq.lowGain,
          mid: params.eq.midGain,
          high: params.eq.highGain,
        });

        const limiter = new Tone.Limiter(params.limiter.threshold);

        // Connect distortion path
        oscMix.connect(distortion);
        distortion.connect(distortionGain);
        distortionGain.connect(distortionMix);
        oscMix.connect(dryGain);
        dryGain.connect(distortionMix);

        // Effects chain
        if (params.limiter.enabled) {
          distortionMix.chain(filter, compressor, eq, limiter, masterGain);
        } else {
          distortionMix.chain(filter, compressor, eq, masterGain);
        }
      } else {
        // Direct connection (bypass)
        oscMix.connect(masterGain);
      }

      // Connect to destination
      masterGain.toDestination();

      // Trigger the sound
      const baseFreq = Tone.Frequency(params.synth.note).toFrequency();
      const startFreq = baseFreq * Math.pow(2, params.pitchEnvelope.startOffset / 12);
      const duration = params.ampEnvelope.attack + params.ampEnvelope.decay;

      // Main synth
      synth.triggerAttack(startFreq, 0, params.synth.velocity);
      if (params.pitchEnvelope.curve === 'exponential') {
        synth.frequency.exponentialRampTo(Math.max(baseFreq, 1), params.pitchEnvelope.decayTime, 0);
      } else {
        synth.frequency.linearRampTo(baseFreq, params.pitchEnvelope.decayTime, 0);
      }
      synth.triggerRelease(duration);

      // Sub oscillator
      if (params.subOscillator.enabled) {
        const subOctaveMultiplier = params.subOscillator.octave === -2 ? 0.25 : 0.5;
        const subBaseFreq = baseFreq * subOctaveMultiplier;
        const subStartFreq = startFreq * subOctaveMultiplier;
        const detuneMultiplier = Math.pow(2, params.subOscillator.detune / 1200);

        subSynth.triggerAttack(subStartFreq * detuneMultiplier, 0, params.synth.velocity);
        if (params.pitchEnvelope.curve === 'exponential') {
          subSynth.frequency.exponentialRampTo(Math.max(subBaseFreq * detuneMultiplier, 1), params.pitchEnvelope.decayTime, 0);
        } else {
          subSynth.frequency.linearRampTo(subBaseFreq * detuneMultiplier, params.pitchEnvelope.decayTime, 0);
        }
        subSynth.triggerRelease(duration);
      }

      // Noise layer
      if (params.noiseLayer.enabled) {
        noiseEnvelope.triggerAttackRelease(params.noiseLayer.attack + params.noiseLayer.decay, 0);
      }

    }, renderDuration);

    // Convert buffer to Float32Array
    const channelData = buffer.getChannelData(0);
    return new Float32Array(channelData);
  }

  // Cleanup
  dispose(): void {
    // Main synth
    this.synth?.dispose();

    // Sub oscillator
    this.subSynth?.dispose();
    this.subGain?.dispose();

    // Noise layer
    this.noise?.dispose();
    this.noiseFilter?.dispose();
    this.noiseEnvelope?.dispose();
    this.noiseGain?.dispose();

    // Oscillator mix
    this.oscMix?.dispose();

    // Distortion (all types)
    this.distortion?.dispose();
    this.bitcrusher?.dispose();
    this.waveshaper?.dispose();
    this.distortionGain?.dispose();
    this.dryGain?.dispose();
    this.distortionMix?.dispose();

    // Filter
    this.filter?.dispose();
    this.filterEnvelope?.dispose();

    // Other effects
    this.compressor?.dispose();
    this.eq?.dispose();
    this.reverb?.dispose();
    this.reverbDry?.dispose();
    this.reverbWet?.dispose();
    this.reverbMix?.dispose();
    this.limiter?.dispose();
    this.gain?.dispose();
    this.analyser?.dispose();
    this.fftAnalyser?.dispose();
    this.bypassGain?.dispose();

    // Reset references
    this.synth = null;
    this.subSynth = null;
    this.subGain = null;
    this.noise = null;
    this.noiseFilter = null;
    this.noiseEnvelope = null;
    this.noiseGain = null;
    this.oscMix = null;
    this.distortion = null;
    this.bitcrusher = null;
    this.waveshaper = null;
    this.distortionGain = null;
    this.dryGain = null;
    this.distortionMix = null;
    this.filter = null;
    this.filterEnvelope = null;
    this.compressor = null;
    this.eq = null;
    this.reverb = null;
    this.reverbDry = null;
    this.reverbWet = null;
    this.reverbMix = null;
    this.limiter = null;
    this.gain = null;
    this.analyser = null;
    this.fftAnalyser = null;
    this.bypassGain = null;

    this.isInitialized = false;
    this.isInitializing = false;
    this.effectsConnected = false;
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();

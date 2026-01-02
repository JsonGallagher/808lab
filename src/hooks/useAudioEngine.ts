import { useState, useCallback, useEffect, useRef } from 'react';
import { audioEngine, DEFAULT_PARAMS } from '../audio/engine';
import type { Sound808Params } from '../types';

export function useAudioEngine() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [params, setParams] = useState<Sound808Params>(DEFAULT_PARAMS);
  const [waveformData, setWaveformData] = useState<Float32Array>(new Float32Array(256));
  const [fftData, setFftData] = useState<Float32Array>(new Float32Array(128));
  const [triggerTime, setTriggerTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const animationRef = useRef<number | null>(null);

  // Initialize audio engine
  const initialize = useCallback(async () => {
    if (isInitialized) return;

    await audioEngine.initialize();
    setIsInitialized(true);
  }, [isInitialized]);

  // Trigger sound
  const trigger = useCallback(async () => {
    if (!isInitialized) {
      await initialize();
    }

    setIsPlaying(true);
    audioEngine.trigger();

    // Reset playing state after sound duration
    const duration = (params.ampEnvelope.decay + params.ampEnvelope.release) * 1000;
    setTimeout(() => setIsPlaying(false), duration);
  }, [isInitialized, initialize, params.ampEnvelope]);

  // Update parameter helpers
  const updateSynth = useCallback((updates: Partial<Sound808Params['synth']>) => {
    setParams((prev) => ({
      ...prev,
      synth: { ...prev.synth, ...updates },
    }));
    audioEngine.updateSynthParams(updates);
  }, []);

  const updatePitchEnvelope = useCallback((updates: Partial<Sound808Params['pitchEnvelope']>) => {
    setParams((prev) => ({
      ...prev,
      pitchEnvelope: { ...prev.pitchEnvelope, ...updates },
    }));
    audioEngine.updatePitchEnvelope(updates);
  }, []);

  const updateAmpEnvelope = useCallback((updates: Partial<Sound808Params['ampEnvelope']>) => {
    setParams((prev) => ({
      ...prev,
      ampEnvelope: { ...prev.ampEnvelope, ...updates },
    }));
    audioEngine.updateAmpEnvelope(updates);
  }, []);

  const updateDistortion = useCallback((updates: Partial<Sound808Params['distortion']>) => {
    setParams((prev) => ({
      ...prev,
      distortion: { ...prev.distortion, ...updates },
    }));
    audioEngine.updateDistortion(updates);
  }, []);

  const updateFilter = useCallback((updates: Partial<Sound808Params['filter']>) => {
    setParams((prev) => ({
      ...prev,
      filter: { ...prev.filter, ...updates },
    }));
    audioEngine.updateFilter(updates);
  }, []);

  const updateCompressor = useCallback((updates: Partial<Sound808Params['compressor']>) => {
    setParams((prev) => ({
      ...prev,
      compressor: { ...prev.compressor, ...updates },
    }));
    audioEngine.updateCompressor(updates);
  }, []);

  const updateEQ = useCallback((updates: Partial<Sound808Params['eq']>) => {
    setParams((prev) => ({
      ...prev,
      eq: { ...prev.eq, ...updates },
    }));
    audioEngine.updateEQ(updates);
  }, []);

  const updateReverb = useCallback((updates: Partial<Sound808Params['reverb']>) => {
    setParams((prev) => ({
      ...prev,
      reverb: { ...prev.reverb, ...updates },
    }));
    audioEngine.updateReverb(updates);
  }, []);

  const updateLimiter = useCallback((updates: Partial<Sound808Params['limiter']>) => {
    setParams((prev) => ({
      ...prev,
      limiter: { ...prev.limiter, ...updates },
    }));
    audioEngine.updateLimiter(updates);
  }, []);

  const updateSubOscillator = useCallback((updates: Partial<Sound808Params['subOscillator']>) => {
    setParams((prev) => ({
      ...prev,
      subOscillator: { ...prev.subOscillator, ...updates },
    }));
    audioEngine.updateSubOscillator(updates);
  }, []);

  const updateNoiseLayer = useCallback((updates: Partial<Sound808Params['noiseLayer']>) => {
    setParams((prev) => ({
      ...prev,
      noiseLayer: { ...prev.noiseLayer, ...updates },
    }));
    audioEngine.updateNoiseLayer(updates);
  }, []);

  const updateFilterEnvelope = useCallback((updates: Partial<Sound808Params['filterEnvelope']>) => {
    setParams((prev) => ({
      ...prev,
      filterEnvelope: { ...prev.filterEnvelope, ...updates },
    }));
    audioEngine.updateFilterEnvelope(updates);
  }, []);

  const updateMasterVolume = useCallback((db: number) => {
    setParams((prev) => ({
      ...prev,
      masterVolume: db,
    }));
    audioEngine.updateMasterVolume(db);
  }, []);

  // Load preset
  const loadPreset = useCallback((presetParams: Sound808Params) => {
    setParams(presetParams);
    audioEngine.setParams(presetParams);
  }, []);

  // Reset to defaults
  const reset = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    audioEngine.setParams(DEFAULT_PARAMS);
  }, []);

  // Connect/disconnect effects chain
  const setEffectsConnected = useCallback((connected: boolean) => {
    audioEngine.setEffectsConnected(connected);
  }, []);

  // Render audio offline for preview
  const renderPreview = useCallback(async (): Promise<Float32Array> => {
    if (!isInitialized) {
      await initialize();
    }
    return audioEngine.renderOffline();
  }, [isInitialized, initialize]);

  // Waveform and FFT animation loop (throttled to ~30fps for performance)
  useEffect(() => {
    if (!isInitialized) return;

    let lastUpdate = 0;
    const targetInterval = 1000 / 30; // 30fps

    const updateAnalysers = (timestamp: number) => {
      // Throttle updates to reduce CPU usage
      if (timestamp - lastUpdate >= targetInterval) {
        lastUpdate = timestamp;

        // Create copies of arrays so React detects the change
        const waveData = audioEngine.getWaveformData();
        setWaveformData(new Float32Array(waveData));

        const fft = audioEngine.getFFTData();
        setFftData(new Float32Array(fft));

        // Update timing for playhead
        setTriggerTime(audioEngine.getTriggerTime());
        setCurrentTime(audioEngine.getCurrentTime());
      }

      animationRef.current = requestAnimationFrame(updateAnalysers);
    };

    animationRef.current = requestAnimationFrame(updateAnalysers);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized]);

  // Keyboard trigger (space bar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        trigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trigger]);

  // Eager initialization: init audio engine on first user interaction
  // This reduces latency on the first actual trigger
  useEffect(() => {
    if (isInitialized) return;

    const initOnInteraction = () => {
      if (!isInitialized) {
        initialize();
      }
    };

    // Listen for any user gesture to initialize audio early
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      window.addEventListener(event, initOnInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, initOnInteraction);
      });
    };
  }, [isInitialized, initialize]);

  // Cleanup
  useEffect(() => {
    return () => {
      audioEngine.dispose();
    };
  }, []);

  return {
    isInitialized,
    isPlaying,
    params,
    waveformData,
    fftData,
    triggerTime,
    currentTime,
    initialize,
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
  };
}

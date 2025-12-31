import { useRef, useEffect, useState, useCallback } from 'react';
import type { AmpEnvelopeParams } from '../types';

type ViewMode = 'waveform' | 'spectrum' | 'oscilloscope';

interface WaveformProps {
  data: Float32Array;
  fftData: Float32Array;
  width?: number;
  height?: number;
  triggerTime?: number;
  currentTime?: number;
  ampEnvelope?: AmpEnvelopeParams;
}

export function Waveform({
  data,
  fftData,
  width = 540,
  height = 180,
  triggerTime = 0,
  currentTime = 0,
  ampEnvelope,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('waveform');
  const [zoom, setZoom] = useState(1);

  // Oscilloscope state - rolling buffer and animation
  const oscilloscopeBufferRef = useRef<number[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastDataRef = useRef<Float32Array | null>(null);
  const scrollOffsetRef = useRef(0);

  // Calculate peak and RMS
  const peak = data ? Math.max(...Array.from(data).map(Math.abs)) : 0;
  const rms = data ? Math.sqrt(Array.from(data).reduce((sum, v) => sum + v * v, 0) / data.length) : 0;
  const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
  const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;

  // Calculate elapsed time since trigger
  const elapsed = triggerTime > 0 ? (currentTime - triggerTime) * 1000 : 0;
  const soundDuration = ampEnvelope
    ? (ampEnvelope.attack + ampEnvelope.decay + ampEnvelope.release) * 1000
    : 1000;

  // Oscilloscope animation
  const drawOscilloscope = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Buffer size = canvas width for smooth scrolling
    const bufferSize = width * 2;

    // Push new samples into buffer when data changes
    if (data && data !== lastDataRef.current) {
      lastDataRef.current = data;
      // Take samples from the data and add to buffer
      const samplesToAdd = Math.min(32, data.length);
      for (let i = 0; i < samplesToAdd; i++) {
        const idx = Math.floor((i / samplesToAdd) * data.length);
        oscilloscopeBufferRef.current.push(data[idx]);
      }
      // Trim buffer to max size
      while (oscilloscopeBufferRef.current.length > bufferSize) {
        oscilloscopeBufferRef.current.shift();
      }
    }

    // Scroll offset for smooth animation
    scrollOffsetRef.current = (scrollOffsetRef.current + 2) % 4;

    // Clear with slight fade for CRT phosphor effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, 0, width, height);

    // Draw grid (very faint for CRT look)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const x = (i / 8) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center line
    ctx.strokeStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw the oscilloscope trace
    const buffer = oscilloscopeBufferRef.current;
    if (buffer.length > 1) {
      // Main trace
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const startIdx = Math.max(0, buffer.length - width);
      for (let i = 0; i < width && (startIdx + i) < buffer.length; i++) {
        const sample = buffer[startIdx + i] || 0;
        const x = i;
        const y = ((1 - sample) / 2) * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Slight glow effect (lighter trace behind)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < width && (startIdx + i) < buffer.length; i++) {
        const sample = buffer[startIdx + i] || 0;
        const x = i;
        const y = ((1 - sample) / 2) * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    // Draw envelope overlay
    if (ampEnvelope) {
      drawEnvelopeOverlay(ctx, ampEnvelope, width, height, 1);
    }

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // Continue animation
    animationRef.current = requestAnimationFrame(drawOscilloscope);
  }, [data, width, height, ampEnvelope]);

  // Start/stop oscilloscope animation based on view mode
  useEffect(() => {
    if (viewMode === 'oscilloscope') {
      animationRef.current = requestAnimationFrame(drawOscilloscope);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [viewMode, drawOscilloscope]);

  useEffect(() => {
    // Skip for oscilloscope mode - it has its own animation loop
    if (viewMode === 'oscilloscope') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (viewMode === 'waveform') {
      drawWaveform(ctx, data, width, height, zoom, elapsed, soundDuration, ampEnvelope);
    } else if (viewMode === 'spectrum') {
      drawSpectrum(ctx, fftData, width, height, ampEnvelope);
    }

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

  }, [data, fftData, width, height, viewMode, zoom, elapsed, soundDuration, ampEnvelope]);

  return (
    <div style={{ padding: '8px' }}>
      {/* Controls row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
        gap: '8px',
      }}>
        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setViewMode('waveform')}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              border: '1px solid #000',
              background: viewMode === 'waveform' ? '#000' : '#fff',
              color: viewMode === 'waveform' ? '#fff' : '#000',
              cursor: 'pointer',
            }}
          >
            Wave
          </button>
          <button
            onClick={() => setViewMode('spectrum')}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              border: '1px solid #000',
              background: viewMode === 'spectrum' ? '#000' : '#fff',
              color: viewMode === 'spectrum' ? '#fff' : '#000',
              cursor: 'pointer',
            }}
          >
            FFT
          </button>
          <button
            onClick={() => setViewMode('oscilloscope')}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              border: '1px solid #000',
              background: viewMode === 'oscilloscope' ? '#000' : '#fff',
              color: viewMode === 'oscilloscope' ? '#fff' : '#000',
              cursor: 'pointer',
            }}
          >
            Scope
          </button>
        </div>

        {/* Zoom controls (only for waveform) */}
        {viewMode === 'waveform' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Zoom:</span>
            {[1, 2, 4, 8].map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                style={{
                  padding: '1px 4px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  border: '1px solid #000',
                  background: zoom === z ? '#000' : '#fff',
                  color: zoom === z ? '#fff' : '#000',
                  cursor: 'pointer',
                  minWidth: '20px',
                }}
              >
                {z}x
              </button>
            ))}
          </div>
        )}

        {/* Level meters */}
        <div style={{ display: 'flex', gap: '12px', fontSize: '10px', fontFamily: 'monospace' }}>
          <span><b>Peak:</b> <span style={{ display: 'inline-block', width: '52px', textAlign: 'right' }}>{peakDb > -60 ? peakDb.toFixed(1) : '-∞'} dB</span></span>
          <span><b>RMS:</b> <span style={{ display: 'inline-block', width: '52px', textAlign: 'right' }}>{rmsDb > -60 ? rmsDb.toFixed(1) : '-∞'} dB</span></span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: 'block' }}
      />

      {/* Timeline labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '2px',
        fontSize: '9px',
        color: '#666',
      }}>
        {viewMode === 'oscilloscope' ? (
          <span style={{ fontStyle: 'italic' }}>Live oscilloscope — trigger to see waveform</span>
        ) : viewMode === 'waveform' ? (
          <>
            <span>0ms</span>
            <span>{Math.round(250 / zoom)}ms</span>
            <span>{Math.round(500 / zoom)}ms</span>
            <span>{Math.round(750 / zoom)}ms</span>
            <span>{Math.round(1000 / zoom)}ms</span>
          </>
        ) : (
          <>
            <span>20</span>
            <span>50</span>
            <span>100</span>
            <span>200</span>
            <span>500</span>
            <span>1k</span>
            <span>2k</span>
            <span>5k</span>
            <span>10k</span>
            <span>20k</span>
          </>
        )}
      </div>

      {/* Peak meter bar with classic Mac dithered pattern */}
      <div style={{
        marginTop: '4px',
        height: '8px',
        background: `repeating-conic-gradient(#c0c0c0 0% 25%, #e0e0e0 0% 50%) 50% / 2px 2px`,
        border: '1px solid #000',
        position: 'relative',
      }}>
        {/* RMS level - dense dither */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${Math.min(100, Math.max(0, (rmsDb + 60) / 60 * 100))}%`,
          background: `repeating-conic-gradient(#000 0% 25%, #808080 0% 50%) 50% / 2px 2px`,
        }} />
        {/* Peak level - sparser dither */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${Math.min(100, Math.max(0, (peakDb + 60) / 60 * 100))}%`,
          background: peak > 0.9
            ? `repeating-conic-gradient(#000 0% 25%, #404040 0% 50%) 50% / 2px 2px`
            : `repeating-conic-gradient(#404040 0% 25%, #808080 0% 50%) 50% / 2px 2px`,
        }} />
        {/* Clipping indicator */}
        {peak >= 1.0 && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '4px',
            height: '100%',
            background: '#ff0000',
          }} />
        )}
      </div>
    </div>
  );
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  width: number,
  height: number,
  zoom: number,
  elapsed: number,
  soundDuration: number,
  ampEnvelope?: AmpEnvelopeParams
) {
  // Draw grid
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 1;

  // Vertical grid lines (time divisions)
  const vDivisions = 8;
  for (let i = 0; i <= vDivisions; i++) {
    const x = (i / vDivisions) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal grid lines (amplitude divisions)
  const hDivisions = 4;
  for (let i = 0; i <= hDivisions; i++) {
    const y = (i / hDivisions) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Center line (zero crossing) - darker
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Draw envelope overlay (dashed gray line)
  if (ampEnvelope) {
    drawEnvelopeOverlay(ctx, ampEnvelope, width, height, zoom);
  }

  // Draw waveform
  if (data && data.length > 0) {
    // Main waveform - black
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const samplesToShow = Math.floor(data.length / zoom);
    const sliceWidth = width / samplesToShow;

    for (let i = 0; i < samplesToShow; i++) {
      const x = i * sliceWidth;
      const y = ((1 - data[i]) / 2) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Fill area under waveform with pattern
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    for (let i = 0; i < samplesToShow; i++) {
      const x = i * sliceWidth;
      const y = ((1 - data[i]) / 2) * height;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height / 2);
    ctx.closePath();

    // Diagonal line fill pattern
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;
    const spacing = 4;
    for (let i = -height; i < width + height; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }
    ctx.restore();

    // Draw peak indicator lines
    let peak = 0;
    for (let i = 0; i < samplesToShow; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }

    if (peak > 0.01) {
      const peakY = ((1 - peak) / 2) * height;
      const peakYNeg = ((1 + peak) / 2) * height;

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      ctx.beginPath();
      ctx.moveTo(0, peakY);
      ctx.lineTo(width, peakY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, peakYNeg);
      ctx.lineTo(width, peakYNeg);
      ctx.stroke();

      ctx.setLineDash([]);
    }
  }

  // Draw playhead
  if (elapsed > 0 && elapsed < soundDuration) {
    const playheadX = (elapsed / (1000 / zoom)) * width;
    if (playheadX <= width) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead triangle
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX - 4, -6);
      ctx.lineTo(playheadX + 4, -6);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  fftData: Float32Array,
  width: number,
  height: number,
  ampEnvelope?: AmpEnvelopeParams
) {
  // Logarithmic frequency scale settings
  const minFreq = 20;    // 20 Hz - lowest audible
  const maxFreq = 20000; // 20 kHz - highest audible
  const sampleRate = 44100; // Assumed sample rate
  const nyquist = sampleRate / 2;
  const binCount = fftData.length;

  // Helper: frequency to x position (log scale)
  const freqToX = (freq: number): number => {
    if (freq <= minFreq) return 0;
    if (freq >= maxFreq) return width;
    return (Math.log10(freq / minFreq) / Math.log10(maxFreq / minFreq)) * width;
  };

  // Helper: FFT bin index to frequency
  const binToFreq = (bin: number): number => {
    return (bin / binCount) * nyquist;
  };

  // Helper: frequency to FFT bin (for lookup)
  const freqToBin = (freq: number): number => {
    return Math.floor((freq / nyquist) * binCount);
  };

  // Draw horizontal grid lines (dB divisions)
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 1;
  const hDivisions = 6;
  for (let i = 0; i <= hDivisions; i++) {
    const y = (i / hDivisions) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw vertical grid lines at log-spaced frequencies
  const gridFreqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  ctx.strokeStyle = '#c0c0c0';
  for (const freq of gridFreqs) {
    const x = freqToX(freq);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // dB labels on left
  ctx.fillStyle = '#666666';
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  for (let i = 0; i <= hDivisions; i++) {
    const db = -i * 10; // 0 to -60 dB
    const y = (i / hDivisions) * height + 3;
    ctx.fillText(`${db}`, 2, y);
  }

  // Check if there's actual FFT data (not uninitialized zeros)
  // Real FFT data has negative dB values, uninitialized data is all zeros
  const hasData = fftData && fftData.some(v => v !== 0);

  // Draw spectrum with log frequency scale
  if (fftData && fftData.length > 0 && hasData) {
    // Draw filled area
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(0, height);

    // Sample at each pixel position
    for (let px = 0; px <= width; px++) {
      // Convert pixel to frequency (log scale)
      const freq = minFreq * Math.pow(maxFreq / minFreq, px / width);

      // Find the corresponding FFT bin
      const bin = freqToBin(freq);

      // Get dB value (with interpolation for smoothness)
      let db = -100;
      if (bin >= 0 && bin < fftData.length) {
        db = fftData[bin];
        // Simple interpolation with next bin
        if (bin + 1 < fftData.length) {
          const nextBinFreq = binToFreq(bin + 1);
          const binFreq = binToFreq(bin);
          const t = (freq - binFreq) / (nextBinFreq - binFreq);
          db = db * (1 - t) + fftData[bin + 1] * t;
        }
      }

      const normalizedHeight = Math.max(0, (db + 60) / 60);
      const barHeight = normalizedHeight * height;

      ctx.lineTo(px, height - barHeight);
    }

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Draw outline on top
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let px = 0; px <= width; px++) {
      const freq = minFreq * Math.pow(maxFreq / minFreq, px / width);
      const bin = freqToBin(freq);

      let db = -100;
      if (bin >= 0 && bin < fftData.length) {
        db = fftData[bin];
        if (bin + 1 < fftData.length) {
          const nextBinFreq = binToFreq(bin + 1);
          const binFreq = binToFreq(bin);
          const t = (freq - binFreq) / (nextBinFreq - binFreq);
          db = db * (1 - t) + fftData[bin + 1] * t;
        }
      }

      const normalizedHeight = Math.max(0, (db + 60) / 60);
      const barHeight = normalizedHeight * height;

      if (px === 0) {
        ctx.moveTo(px, height - barHeight);
      } else {
        ctx.lineTo(px, height - barHeight);
      }
    }
    ctx.stroke();

    // Highlight sub bass region (20-100 Hz) with a subtle marker
    const subBassEndX = freqToX(100);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, subBassEndX, height);
  }

  // Draw envelope overlay
  if (ampEnvelope) {
    drawEnvelopeOverlay(ctx, ampEnvelope, width, height, 1);
  }
}

// Helper function to draw envelope overlay on any view
function drawEnvelopeOverlay(
  ctx: CanvasRenderingContext2D,
  ampEnvelope: AmpEnvelopeParams,
  width: number,
  height: number,
  zoom: number
) {
  ctx.strokeStyle = '#999999';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();

  // Calculate time points for ADSR
  // Add a sustain duration for visualization (sustain is a level, not a time)
  const sustainDuration = 0.2; // Show sustain as 200ms hold
  const totalTime = ampEnvelope.attack + ampEnvelope.decay + sustainDuration + ampEnvelope.release;

  const attackEnd = (ampEnvelope.attack / totalTime) * width * zoom;
  const decayEnd = ((ampEnvelope.attack + ampEnvelope.decay) / totalTime) * width * zoom;
  const sustainEnd = ((ampEnvelope.attack + ampEnvelope.decay + sustainDuration) / totalTime) * width * zoom;
  const releaseEnd = width * zoom;

  const peakY = height * 0.1; // Top of envelope
  const sustainY = height * (1 - ampEnvelope.sustain * 0.9); // Sustain level
  const bottomY = height; // Bottom of envelope

  // Attack: 0 to peak (rising slope)
  ctx.moveTo(0, bottomY);
  ctx.lineTo(Math.min(attackEnd, width), peakY);

  // Decay: peak to sustain level (falling slope)
  if (attackEnd < width) {
    ctx.lineTo(Math.min(decayEnd, width), sustainY);

    // Sustain: horizontal line at sustain level
    if (decayEnd < width) {
      ctx.lineTo(Math.min(sustainEnd, width), sustainY);

      // Release: sustain to 0 (falling slope)
      if (sustainEnd < width) {
        ctx.lineTo(Math.min(releaseEnd, width), bottomY);
      }
    }
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

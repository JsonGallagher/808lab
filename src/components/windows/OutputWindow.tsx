import { useState, useRef, useEffect, useCallback } from 'react';
import { Window } from '../desktop';
import { RetroSlider, RetroButton, RetroCheckbox } from '../controls';
import type { Sound808Params } from '../../types';

interface OutputWindowProps {
  masterVolume: number;
  limiter: Sound808Params['limiter'];
  onUpdateMasterVolume: (db: number) => void;
  onUpdateLimiter: (updates: Partial<Sound808Params['limiter']>) => void;
  onExport: () => void;
  onReset: () => void;
  onRenderPreview: () => Promise<Float32Array>;
  windowState: {
    isVisible: boolean;
    isFocused: boolean;
    zIndex: number;
  };
  onClose: () => void;
  onFocus: () => void;
}

export function OutputWindow({
  masterVolume,
  limiter,
  onUpdateMasterVolume,
  onUpdateLimiter,
  onExport,
  onReset,
  onRenderPreview,
  windowState,
  onClose,
  onFocus,
}: OutputWindowProps) {
  const [previewData, setPreviewData] = useState<Float32Array | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGeneratePreview = useCallback(async () => {
    setIsRendering(true);
    try {
      const data = await onRenderPreview();
      setPreviewData(data);
    } catch (error) {
      console.error('Preview render failed:', error);
    }
    setIsRendering(false);
  }, [onRenderPreview]);

  // Draw preview waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !previewData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
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

    // Draw waveform
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      const dataIndex = Math.floor(i * previewData.length / width);
      const sample = previewData[dataIndex] || 0;
      const y = ((1 - sample) / 2) * height;

      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
  }, [previewData]);
  return (
    <Window
      id="output"
      title="808Lab - Output"
      initialPosition={{ x: 965, y: 405 }}
      initialSize={{ width: 280, height: 390 }}
      isVisible={windowState.isVisible}
      isFocused={windowState.isFocused}
      zIndex={windowState.zIndex}
      onClose={onClose}
      onFocus={onFocus}
    >
      <div className="panel">
        <div className="panel-title">Master</div>
        <div className="control-row">
          <RetroSlider
            label="Volume"
            value={masterVolume}
            min={-60}
            max={0}
            step={1}
            unit=" dB"
            onChange={onUpdateMasterVolume}
          />
        </div>
      </div>

      <div className="panel" style={{ marginTop: '8px' }}>
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RetroCheckbox
            label="Limiter"
            checked={limiter.enabled}
            onChange={(enabled) => onUpdateLimiter({ enabled })}
          />
        </div>
        <div className="control-row">
          <RetroSlider
            label="Threshold"
            value={limiter.threshold}
            min={-12}
            max={0}
            step={0.5}
            unit=" dB"
            onChange={(threshold) => onUpdateLimiter({ threshold })}
          />
        </div>
      </div>

      {/* Export Preview */}
      <div className="panel" style={{ marginTop: '8px' }}>
        <div className="panel-title">Export Preview</div>
        <canvas
          ref={canvasRef}
          width={248}
          height={60}
          style={{
            display: 'block',
            width: '100%',
            border: '1px solid #000',
            background: previewData ? '#fff' : '#f0f0f0',
          }}
        />
        <div style={{ marginTop: '4px' }}>
          <RetroButton
            onClick={handleGeneratePreview}
            style={{ width: '100%' }}
          >
            {isRendering ? 'Rendering...' : 'Generate Preview'}
          </RetroButton>
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <div className="section-title">Actions</div>
        <div className="button-group" style={{ flexDirection: 'column', gap: '8px' }}>
          <RetroButton onClick={onExport}>Export WAV</RetroButton>
          <RetroButton onClick={onReset}>Reset All</RetroButton>
        </div>
      </div>
    </Window>
  );
}

import { useRef, useEffect } from 'react';

interface DitheredBackgroundProps {
  width?: number;
  height?: number;
}

// Bayer 4x4 dither matrix for ordered dithering
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function DitheredBackground({ width = 1920, height = 1080 }: DitheredBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Create offscreen canvas for grayscale image
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    // Draw the grayscale pattern (concentric rings like speaker cone / Saturn)
    const centerX = width * 0.75;
    const centerY = height * 0.6;
    const maxRadius = Math.max(width, height) * 0.5;

    // Background - light gray
    offCtx.fillStyle = '#e8e8e8';
    offCtx.fillRect(0, 0, width, height);

    // Draw planet/speaker body with gradient
    const planetRadius = maxRadius * 0.4;
    const gradient = offCtx.createRadialGradient(
      centerX - planetRadius * 0.2,
      centerY - planetRadius * 0.2,
      0,
      centerX,
      centerY,
      planetRadius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#d0d0d0');
    gradient.addColorStop(0.7, '#808080');
    gradient.addColorStop(1, '#404040');

    offCtx.beginPath();
    offCtx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
    offCtx.fillStyle = gradient;
    offCtx.fill();

    // Draw concentric rings (Saturn-style / speaker cone)
    offCtx.save();

    // Clip to exclude the planet area for rings behind
    offCtx.beginPath();
    offCtx.rect(0, 0, width, height);
    offCtx.arc(centerX, centerY, planetRadius - 2, 0, Math.PI * 2, true);
    offCtx.clip();

    // Draw multiple ring bands
    const ringConfigs = [
      { inner: planetRadius * 1.3, outer: planetRadius * 1.5, brightness: 0.6 },
      { inner: planetRadius * 1.55, outer: planetRadius * 1.7, brightness: 0.45 },
      { inner: planetRadius * 1.75, outer: planetRadius * 2.1, brightness: 0.55 },
      { inner: planetRadius * 2.15, outer: planetRadius * 2.25, brightness: 0.35 },
    ];

    // Draw rings with perspective (ellipse)
    const tilt = 0.25; // Ring tilt factor

    for (const ring of ringConfigs) {
      const ringGradient = offCtx.createRadialGradient(
        centerX, centerY, ring.inner,
        centerX, centerY, ring.outer
      );
      const brightness = Math.round(ring.brightness * 255);
      const innerColor = `rgb(${brightness + 30}, ${brightness + 30}, ${brightness + 30})`;
      const outerColor = `rgb(${brightness - 20}, ${brightness - 20}, ${brightness - 20})`;

      ringGradient.addColorStop(0, innerColor);
      ringGradient.addColorStop(0.5, `rgb(${brightness}, ${brightness}, ${brightness})`);
      ringGradient.addColorStop(1, outerColor);

      offCtx.beginPath();
      offCtx.ellipse(centerX, centerY, ring.outer, ring.outer * tilt, 0, 0, Math.PI * 2);
      offCtx.ellipse(centerX, centerY, ring.inner, ring.inner * tilt, 0, Math.PI * 2, 0);
      offCtx.fillStyle = ringGradient;
      offCtx.fill('evenodd');
    }

    offCtx.restore();

    // Draw front portion of rings (in front of planet)
    offCtx.save();
    offCtx.beginPath();
    offCtx.arc(centerX, centerY, planetRadius, Math.PI * 0.95, Math.PI * 0.05, true);
    offCtx.clip();

    for (const ring of ringConfigs) {
      const brightness = Math.round(ring.brightness * 255);
      offCtx.strokeStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      offCtx.lineWidth = (ring.outer - ring.inner);
      offCtx.beginPath();
      const avgRadius = (ring.inner + ring.outer) / 2;
      offCtx.ellipse(centerX, centerY, avgRadius, avgRadius * tilt, 0, 0, Math.PI * 2);
      offCtx.stroke();
    }
    offCtx.restore();

    // Add some surface detail to planet (subtle concentric lines like speaker cone)
    offCtx.save();
    offCtx.beginPath();
    offCtx.arc(centerX, centerY, planetRadius, 0, Math.PI * 2);
    offCtx.clip();

    offCtx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    offCtx.lineWidth = 1;
    for (let r = 20; r < planetRadius; r += 15) {
      offCtx.beginPath();
      offCtx.arc(centerX, centerY, r, 0, Math.PI * 2);
      offCtx.stroke();
    }
    offCtx.restore();

    // Now apply ordered dithering
    const imageData = offCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Apply Bayer matrix dithering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // Get grayscale value (image is already grayscale)
        const gray = data[idx];

        // Get threshold from Bayer matrix
        const bayerValue = BAYER_4X4[y % 4][x % 4];
        const threshold = (bayerValue / 16) * 255;

        // Dither to black or white
        const output = gray > threshold ? 255 : 0;

        data[idx] = output;     // R
        data[idx + 1] = output; // G
        data[idx + 2] = output; // B
        // Alpha stays the same
      }
    }

    // Draw dithered result to main canvas
    ctx.putImageData(imageData, 0, 0);

  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        imageRendering: 'pixelated',
      }}
    />
  );
}

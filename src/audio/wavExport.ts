/**
 * WAV file encoding and download utilities
 */

/**
 * Encode Float32Array audio samples to WAV format
 * @param samples - Audio samples in range -1 to 1
 * @param sampleRate - Sample rate in Hz (default 44100)
 * @returns Blob containing WAV file data
 */
export function encodeWAV(samples: Float32Array, sampleRate = 44100): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const bufferSize = 44 + dataSize;

  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // Helper to write string
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // file size - 8
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write audio samples as 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Clamp to [-1, 1] and convert to 16-bit signed integer
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Trigger download of a WAV blob
 * @param blob - WAV file blob
 * @param filename - Download filename
 */
export function downloadWAV(blob: Blob, filename = '808lab-export.wav'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Render audio and download as WAV in one step
 * @param samples - Audio samples
 * @param filename - Download filename
 * @param sampleRate - Sample rate
 */
export function exportToWAV(
  samples: Float32Array,
  filename = '808lab-export.wav',
  sampleRate = 44100
): void {
  const blob = encodeWAV(samples, sampleRate);
  downloadWAV(blob, filename);
}

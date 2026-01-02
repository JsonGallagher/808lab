# 808Lab

A retro-styled 808 bass synthesizer with a classic Macintosh-inspired UI. Built with React, TypeScript, and Tone.js.

## Features

### Sound Synthesis
- **Main Oscillator** - Sine/triangle waveforms with pitch envelope control
- **Sub Oscillator** - Adds deep fundamental with octave (-1/-2) and detune controls
- **Noise/Click Layer** - White/pink noise for transient punch with decay and filter
- **Filter Envelope** - ADSR-controlled frequency sweep for dynamic tones

### Effects
- **Distortion** - Multiple saturation types: Soft Clip, Hard Clip, Tape, Waveshaper, Bitcrush
- **Filter** - Low-pass filter with resonance control
- **Compressor** - Threshold, ratio, attack, and release controls
- **3-Band EQ** - Low, mid, and high frequency adjustment
- **Reverb** - Decay time, pre-delay, and wet/dry mix
- **Limiter** - Output protection with threshold control

### Waveform Analyzer
- **Wave/FFT Toggle** - Switch between waveform and spectrum views
- **Logarithmic FFT** - Better sub-bass visualization
- **Zoom Controls** - 1x, 2x, 4x, 8x zoom levels
- **Playhead Animation** - Visual playback indicator
- **Envelope Overlay** - ADSR shape visualization
- **Peak/RMS Meter** - dB readouts with clipping indicator

### Presets
- **10 Factory Presets** - Classic 808, Distorted 808, Deep Sub, Punchy 808, Trap Sub, Lo-Fi 808, Smooth, Synth Bass, Booming, Tape Warm
- **Categories** - Classic, Modern, Lo-Fi, Aggressive, Clean, User
- **Import/Export** - Save and load presets as JSON files
- **Randomize** - Generate random parameter variations

### Visual Design
- Classic Macintosh-style window chrome and controls
- Modular cable patching with wiggle animations
- LED activity indicators
- Dithered meter bars with checkerboard patterns
- Window zoom animations

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Trigger sounds** - Click the Trigger button or press Space
2. **Shape your tone** - Adjust oscillator, envelope, and filter parameters
3. **Add effects** - Connect the synth to effects using the modular cables
4. **Export** - Render and download your sound as a WAV file
5. **Save presets** - Store your favorite sounds for later

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tone.js** - Web Audio synthesis

## License

MIT

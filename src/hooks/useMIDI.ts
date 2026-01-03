import { useEffect, useState, useCallback, useRef } from 'react';

// MIDI note number to note name conversion
// MIDI note 24 = C1, 36 = C2, 48 = C3, etc.
function midiNoteToName(noteNumber: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(noteNumber / 12) - 1;
  const noteName = noteNames[noteNumber % 12];
  return `${noteName}${octave}`;
}

interface UseMIDIOptions {
  onNoteOn: (note: string, velocity: number) => void;
  onNoteOff: (note: string) => void;
}

interface UseMIDIReturn {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  error: string | null;
  requestAccess: () => void;
}

export function useMIDI({ onNoteOn, onNoteOff }: UseMIDIOptions): UseMIDIReturn {
  const [isSupported] = useState(() => 'requestMIDIAccess' in navigator);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);

  // Use refs for callbacks to avoid re-attaching listeners
  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);

  useEffect(() => {
    onNoteOnRef.current = onNoteOn;
    onNoteOffRef.current = onNoteOff;
  }, [onNoteOn, onNoteOff]);

  // Handle MIDI messages
  const handleMIDIMessage = useCallback((event: MIDIMessageEvent) => {
    const [status, noteNumber, velocity] = event.data || [];

    // Note On: status 144-159 (0x90-0x9F), velocity > 0
    // Note Off: status 128-143 (0x80-0x8F), or Note On with velocity 0
    const command = status & 0xf0;

    if (command === 0x90 && velocity > 0) {
      // Note On
      const noteName = midiNoteToName(noteNumber);
      const normalizedVelocity = velocity / 127;
      onNoteOnRef.current(noteName, normalizedVelocity);
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      // Note Off
      const noteName = midiNoteToName(noteNumber);
      onNoteOffRef.current(noteName);
    }
  }, []);

  // Setup MIDI input listeners
  const setupInputs = useCallback((access: MIDIAccess) => {
    let connectedDevice: string | null = null;

    access.inputs.forEach((input) => {
      input.onmidimessage = handleMIDIMessage;
      if (!connectedDevice) {
        connectedDevice = input.name || 'MIDI Device';
      }
    });

    setIsConnected(access.inputs.size > 0);
    setDeviceName(connectedDevice);
  }, [handleMIDIMessage]);

  // Handle device connect/disconnect
  useEffect(() => {
    if (!midiAccess) return;

    const handleStateChange = () => {
      setupInputs(midiAccess);
    };

    midiAccess.onstatechange = handleStateChange;

    return () => {
      midiAccess.onstatechange = null;
    };
  }, [midiAccess, setupInputs]);

  // Request MIDI access
  const requestAccess = useCallback(async () => {
    if (!isSupported) {
      setError('Web MIDI not supported in this browser');
      return;
    }

    try {
      const access = await navigator.requestMIDIAccess();
      setMidiAccess(access);
      setupInputs(access);
      setError(null);
    } catch (err) {
      setError('MIDI access denied');
      console.error('MIDI access error:', err);
    }
  }, [isSupported, setupInputs]);

  // Auto-request access on mount if supported
  useEffect(() => {
    if (isSupported) {
      requestAccess();
    }
  }, [isSupported, requestAccess]);

  return {
    isSupported,
    isConnected,
    deviceName,
    error,
    requestAccess,
  };
}

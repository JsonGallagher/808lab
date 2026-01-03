import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Window } from '../desktop';
import { useMIDI } from '../../hooks/useMIDI';
import type { WindowPosition, WindowSize } from '../../types';

interface KeyboardWindowProps {
  onNoteOn: (note: string) => void;
  onNoteOff: () => void;
  isPlaying: boolean;
  isAudioReady: boolean;
  windowState: {
    isVisible: boolean;
    isFocused: boolean;
    zIndex: number;
  };
  onClose: () => void;
  onFocus: () => void;
  initialPosition: WindowPosition;
  initialSize: WindowSize;
}

const DEFAULT_NOTE = 'C2';

// 36 keys: 3 octaves from C1 to B3
const OCTAVES = [1, 2, 3];
const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_NOTES: Record<string, string | null> = {
  'C': 'C#',
  'D': 'D#',
  'E': null, // No black key after E
  'F': 'F#',
  'G': 'G#',
  'A': 'A#',
  'B': null, // No black key after B
};

// Keyboard mapping: computer keys to notes
const KEY_MAP: Record<string, string> = {
  // Bottom row: C1-B1
  'z': 'C1', 's': 'C#1', 'x': 'D1', 'd': 'D#1', 'c': 'E1',
  'v': 'F1', 'g': 'F#1', 'b': 'G1', 'h': 'G#1', 'n': 'A1', 'j': 'A#1', 'm': 'B1',
  // Top row: C2-B2
  'q': 'C2', '2': 'C#2', 'w': 'D2', '3': 'D#2', 'e': 'E2',
  'r': 'F2', '5': 'F#2', 't': 'G2', '6': 'G#2', 'y': 'A2', '7': 'A#2', 'u': 'B2',
  // Extended: C3-B3
  'i': 'C3', '9': 'C#3', 'o': 'D3', '0': 'D#3', 'p': 'E3',
  '[': 'F3', '=': 'F#3', ']': 'G3',
};

interface KeyProps {
  note: string;
  isBlack: boolean;
  isPressed: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

function Key({ note, isBlack, isPressed, onMouseDown, onMouseUp, onMouseLeave }: KeyProps) {
  const baseStyle: React.CSSProperties = isBlack ? {
    width: '24px',
    height: '80px',
    background: isPressed ? '#444' : '#000',
    border: '1px solid #000',
    borderRadius: '0 0 3px 3px',
    position: 'absolute',
    zIndex: 2,
    cursor: 'pointer',
    boxShadow: isPressed
      ? 'inset 0 0 5px rgba(255,255,255,0.2)'
      : '2px 2px 3px rgba(0,0,0,0.4)',
    transition: 'background 0.05s, box-shadow 0.05s',
  } : {
    width: '36px',
    height: '120px',
    background: isPressed ? '#ddd' : '#fff',
    border: '1px solid #000',
    borderRadius: '0 0 4px 4px',
    position: 'relative',
    zIndex: 1,
    cursor: 'pointer',
    boxShadow: isPressed
      ? 'inset 0 2px 5px rgba(0,0,0,0.2)'
      : '2px 2px 3px rgba(0,0,0,0.2)',
    transition: 'background 0.05s, box-shadow 0.05s',
  };

  return (
    <div
      style={baseStyle}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {!isBlack && (
        <span style={{
          position: 'absolute',
          bottom: '6px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px',
          fontWeight: 'bold',
          color: '#666',
          userSelect: 'none',
        }}>
          {note}
        </span>
      )}
    </div>
  );
}

export function KeyboardWindow({
  onNoteOn: onNoteOnProp,
  onNoteOff: onNoteOffProp,
  isPlaying,
  isAudioReady,
  windowState,
  onClose,
  onFocus,
  initialPosition,
  initialSize,
}: KeyboardWindowProps) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [triggeredFromKeyboard, setTriggeredFromKeyboard] = useState(false);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const prevIsPlaying = useRef(isPlaying);

  // MIDI input handling
  const handleMIDINoteOn = useCallback((note: string) => {
    setPressedKeys(prev => new Set(prev).add(note));
    setTriggeredFromKeyboard(true);
    onNoteOnProp(note);
  }, [onNoteOnProp]);

  const handleMIDINoteOff = useCallback((note: string) => {
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    // Only trigger release if this was the last key held
    if (pressedKeys.size === 1 && pressedKeys.has(note)) {
      onNoteOffProp();
    }
  }, [pressedKeys, onNoteOffProp]);

  const { isConnected, deviceName } = useMIDI({
    onNoteOn: handleMIDINoteOn,
    onNoteOff: handleMIDINoteOff,
  });

  // Reset keyboard trigger flag when sound finishes
  useEffect(() => {
    if (prevIsPlaying.current && !isPlaying) {
      setTriggeredFromKeyboard(false);
    }
    prevIsPlaying.current = isPlaying;
  }, [isPlaying]);

  // Check if a note should appear pressed (either from keyboard or external trigger)
  const isNotePressed = useCallback((note: string) => {
    if (pressedKeys.has(note)) return true;
    // If playing via space bar/button (not keyboard), light up default note
    if (isPlaying && !triggeredFromKeyboard && note === DEFAULT_NOTE) return true;
    return false;
  }, [pressedKeys, isPlaying, triggeredFromKeyboard]);

  const handleNoteOn = useCallback((note: string) => {
    setPressedKeys(prev => new Set(prev).add(note));
    setTriggeredFromKeyboard(true);
    onNoteOnProp(note);
  }, [onNoteOnProp]);

  const handleNoteOff = useCallback((note: string) => {
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
    // Only trigger release if no keys are still held
    if (pressedKeys.size === 1 && pressedKeys.has(note)) {
      onNoteOffProp();
    }
  }, [pressedKeys, onNoteOffProp]);

  // Computer keyboard input
  useEffect(() => {
    if (!keyboardEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      // Don't capture if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const note = KEY_MAP[e.key.toLowerCase()];
      if (note && !pressedKeys.has(note)) {
        e.preventDefault();
        handleNoteOn(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = KEY_MAP[e.key.toLowerCase()];
      if (note) {
        handleNoteOff(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyboardEnabled, pressedKeys, handleNoteOn, handleNoteOff]);

  // Build keyboard layout
  const renderOctave = (octave: number) => {
    const keys: React.ReactNode[] = [];
    let whiteKeyIndex = 0;

    WHITE_NOTES.forEach((note) => {
      const fullNote = `${note}${octave}`;
      const blackNote = BLACK_NOTES[note];
      const blackFullNote = blackNote ? `${blackNote}${octave}` : null;

      // White key
      keys.push(
        <div key={fullNote} style={{ position: 'relative', display: 'inline-block' }}>
          <Key
            note={fullNote}
            isBlack={false}
            isPressed={isNotePressed(fullNote)}
            onMouseDown={() => handleNoteOn(fullNote)}
            onMouseUp={() => handleNoteOff(fullNote)}
            onMouseLeave={() => handleNoteOff(fullNote)}
          />
          {/* Black key positioned on top */}
          {blackFullNote && (
            <div style={{
              position: 'absolute',
              left: '22px',
              top: 0,
            }}>
              <Key
                note={blackFullNote}
                isBlack={true}
                isPressed={isNotePressed(blackFullNote)}
                onMouseDown={() => handleNoteOn(blackFullNote)}
                onMouseUp={() => handleNoteOff(blackFullNote)}
                onMouseLeave={() => handleNoteOff(blackFullNote)}
              />
            </div>
          )}
        </div>
      );
      whiteKeyIndex++;
    });

    return keys;
  };

  return (
    <Window
      id="keyboard"
      title="Keyboard"
      initialPosition={initialPosition}
      initialSize={initialSize}
      isVisible={windowState.isVisible}
      isFocused={windowState.isFocused}
      zIndex={windowState.zIndex}
      onClose={onClose}
      onFocus={onFocus}
    >
      <div style={{ padding: '8px', userSelect: 'none' }}>
        <div style={{
          fontSize: '10px',
          color: '#666',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setKeyboardEnabled(!keyboardEnabled)}
              style={{
                padding: '2px 6px',
                fontSize: '9px',
                fontWeight: 'bold',
                background: keyboardEnabled ? '#000' : '#ccc',
                color: keyboardEnabled ? '#fff' : '#666',
                border: '1px solid #000',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              {keyboardEnabled ? 'ON' : 'OFF'}
            </button>
            {!isAudioReady && <strong style={{ color: '#000' }}>Click to enable audio. </strong>}
            <span style={{ color: keyboardEnabled ? '#000' : '#999' }}>
              Keys: Z-M, Q-U, I-]
            </span>
          </span>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: isConnected ? '#000' : '#999',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#000' : '#ccc',
              border: '1px solid #666',
            }} />
            {isConnected ? `MIDI: ${deviceName}` : 'No MIDI'}
          </span>
        </div>
        <div style={{
          display: 'flex',
          background: '#333',
          padding: '8px 8px 0 8px',
          borderRadius: '4px',
          border: '2px solid #000',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          overflowX: 'auto',
        }}>
          {OCTAVES.map(octave => (
            <div key={octave} style={{ display: 'flex' }}>
              {renderOctave(octave)}
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

import { Window } from '../desktop';
import { RetroButton } from '../controls';

interface AboutWindowProps {
  windowState: {
    isVisible: boolean;
    isFocused: boolean;
    zIndex: number;
  };
  onClose: () => void;
  onFocus: () => void;
}

export function AboutWindow({
  windowState,
  onClose,
  onFocus,
}: AboutWindowProps) {
  return (
    <Window
      id="about"
      title="About 808Lab"
      initialPosition={{ x: 400, y: 200 }}
      initialSize={{ width: 260, height: 220 }}
      isVisible={windowState.isVisible}
      isFocused={windowState.isFocused}
      zIndex={windowState.zIndex}
      onClose={onClose}
      onFocus={onFocus}
      resizable={false}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        padding: '12px',
      }}>
        {/* Logo box */}
        <div style={{
          border: '2px solid var(--black)',
          padding: '8px 16px',
          marginBottom: '12px',
          fontWeight: 'bold',
          fontSize: '14px',
        }}>
          808Lab
        </div>

        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
          808Lab v1.0
        </div>

        <div style={{ fontSize: '10px', lineHeight: '1.5', marginBottom: '16px' }}>
          An 808 bass synthesizer<br />
          with Intermedia-style UI
        </div>

        <div style={{ fontSize: '9px', color: '#666', marginBottom: '16px' }}>
          Built with React + Tone.js
        </div>

        <RetroButton onClick={onClose} style={{ minWidth: '80px' }}>
          OK
        </RetroButton>
      </div>
    </Window>
  );
}

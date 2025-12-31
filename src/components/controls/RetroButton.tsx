import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface RetroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'small';
  children: ReactNode;
}

export function RetroButton({
  variant = 'default',
  children,
  className = '',
  ...props
}: RetroButtonProps) {
  const variantClass = variant === 'primary' ? 'primary' : variant === 'small' ? 'small' : '';

  return (
    <button
      className={`retro-button ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Special trigger button for playing sounds
interface TriggerButtonProps {
  label?: string;
  keyHint?: string;
  isActive?: boolean;
  onTrigger: () => void;
}

export function TriggerButton({
  label = 'PLAY',
  keyHint = 'Space',
  isActive = false,
  onTrigger,
}: TriggerButtonProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <button
        className={`trigger-button ${isActive ? 'active' : ''}`}
        onClick={onTrigger}
        onMouseDown={(e) => e.preventDefault()}
      >
        {label}
      </button>
      {keyHint && <div className="key-hint">[{keyHint}]</div>}
    </div>
  );
}

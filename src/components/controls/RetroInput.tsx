import type { InputHTMLAttributes } from 'react';
import { useCallback } from 'react';

interface RetroInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  inline?: boolean;
  small?: boolean;
}

export function RetroInput({
  label,
  value,
  onChange,
  inline = false,
  small = false,
  ...props
}: RetroInputProps) {
  return (
    <div className={inline ? 'control-inline' : ''}>
      {label && <span className="label">{label}:</span>}
      <input
        className={`retro-input ${small ? 'small' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );
}

// Number input with up/down buttons
interface RetroNumberInputProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  inline?: boolean;
}

export function RetroNumberInput({
  label,
  value,
  min = -Infinity,
  max = Infinity,
  step = 1,
  onChange,
  inline = false,
}: RetroNumberInputProps) {
  const increment = useCallback(() => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  }, [value, max, step, onChange]);

  const decrement = useCallback(() => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  }, [value, min, step, onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    }
  }, [min, max, onChange]);

  return (
    <div className={inline ? 'control-inline' : ''}>
      {label && <span className="label">{label}:</span>}
      <div className="retro-number">
        <input
          type="number"
          className="retro-input small"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
        />
        <div className="retro-number-buttons">
          <button className="retro-number-btn" onClick={increment}>+</button>
          <button className="retro-number-btn" onClick={decrement}>-</button>
        </div>
      </div>
    </div>
  );
}

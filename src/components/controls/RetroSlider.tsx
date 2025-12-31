import { useState, useCallback, useRef, useEffect } from 'react';

interface RetroSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  orientation?: 'horizontal' | 'vertical';
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export function RetroSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  orientation = 'horizontal',
  showValue = true,
  formatValue,
}: RetroSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  // Track if value is being changed externally (preset load) vs by user drag
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Detect external value changes (not from dragging)
    if (!isDragging && value !== prevValueRef.current) {
      setIsAnimating(true);
      // Reset animation flag after transition completes
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value, isDragging]);

  const calculateValue = useCallback((clientX: number, clientY: number) => {
    if (!trackRef.current) return value;

    const rect = trackRef.current.getBoundingClientRect();
    let ratio: number;

    if (orientation === 'horizontal') {
      ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    } else {
      ratio = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    }

    const rawValue = min + ratio * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  }, [min, max, step, value, orientation]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    const newValue = calculateValue(e.clientX, e.clientY);
    onChange(newValue);
  }, [calculateValue, onChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newValue = calculateValue(e.clientX, e.clientY);
    onChange(newValue);
  }, [isDragging, calculateValue, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Smart default formatting based on step size
  const getDefaultFormat = (val: number): string => {
    // Determine decimal places from step
    const stepStr = step.toString();
    const decimalIdx = stepStr.indexOf('.');
    const decimals = decimalIdx === -1 ? 0 : Math.min(stepStr.length - decimalIdx - 1, 2);
    return val.toFixed(decimals) + unit;
  };

  const displayValue = formatValue
    ? formatValue(value)
    : getDefaultFormat(value);

  return (
    <div className={`retro-slider ${orientation}`}>
      <span className="slider-label">{label}:</span>
      <div
        ref={trackRef}
        className="slider-track"
        onMouseDown={handleMouseDown}
      >
        <div
          className="slider-fill"
          style={{
            ...(orientation === 'horizontal'
              ? { width: `${percentage}%` }
              : { height: `${percentage}%` }),
            transition: isAnimating ? 'all 0.25s ease-out' : 'none',
          }}
        />
        <div
          className="slider-thumb"
          style={{
            ...(orientation === 'horizontal'
              ? { left: `${percentage}%` }
              : { bottom: `${percentage}%` }),
            transition: isAnimating ? 'all 0.25s ease-out' : 'none',
          }}
        />
      </div>
      {showValue && <span className="slider-value">{displayValue}</span>}
    </div>
  );
}

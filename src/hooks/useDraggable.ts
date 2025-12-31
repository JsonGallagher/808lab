import { useState, useCallback, useRef, useEffect } from 'react';
import type { WindowPosition } from '../types';

interface UseDraggableProps {
  initialPosition: WindowPosition;
  onPositionChange?: (position: WindowPosition) => void;
}

export function useDraggable({ initialPosition, onPositionChange }: UseDraggableProps) {
  const [position, setPosition] = useState<WindowPosition>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<WindowPosition>({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag on left click
    if (e.button !== 0) return;

    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    e.preventDefault();
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const newPosition = {
      x: e.clientX - dragOffset.current.x,
      y: Math.max(20, e.clientY - dragOffset.current.y), // Keep below menubar
    };

    setPosition(newPosition);
    onPositionChange?.(newPosition);
  }, [isDragging, onPositionChange]);

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

  return {
    position,
    setPosition,
    isDragging,
    handleMouseDown,
  };
}

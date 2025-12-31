import type { ReactNode } from 'react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useDraggable } from '../../hooks/useDraggable';
import type { WindowPosition, WindowSize } from '../../types';

// Classic Mac zoom animation - expanding/contracting rectangle outlines
interface ZoomAnimationProps {
  startRect: { x: number; y: number; width: number; height: number };
  endRect: { x: number; y: number; width: number; height: number };
  isOpening: boolean;
  onComplete: () => void;
}

function ZoomAnimation({ startRect, endRect, isOpening, onComplete }: ZoomAnimationProps) {
  const [frame, setFrame] = useState(0);
  const totalFrames = 6;
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 150; // 150ms total animation

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const currentFrame = Math.floor(progress * totalFrames);

      setFrame(currentFrame);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [onComplete]);

  // Generate intermediate rectangles
  const rects = [];
  for (let i = 0; i <= frame; i++) {
    const t = i / totalFrames;
    // Use ease-out for opening, ease-in for closing
    const eased = isOpening
      ? 1 - Math.pow(1 - t, 2) // ease-out
      : t * t; // ease-in

    const x = startRect.x + (endRect.x - startRect.x) * eased;
    const y = startRect.y + (endRect.y - startRect.y) * eased;
    const width = startRect.width + (endRect.width - startRect.width) * eased;
    const height = startRect.height + (endRect.height - startRect.height) * eased;

    rects.push({ x, y, width, height, key: i });
  }

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    >
      {rects.map((rect) => (
        <rect
          key={rect.key}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill="none"
          stroke="#000"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}

interface WindowProps {
  id: string;
  title: string;
  initialPosition: WindowPosition;
  initialSize: WindowSize;
  minSize?: WindowSize;
  isVisible: boolean;
  isFocused: boolean;
  zIndex: number;
  onClose: () => void;
  onFocus: () => void;
  onPositionChange?: (position: WindowPosition) => void;
  onSizeChange?: (size: WindowSize) => void;
  children: ReactNode;
  resizable?: boolean;
  showStatusBar?: boolean;
  statusText?: string;
}

export function Window({
  title,
  initialPosition,
  initialSize,
  minSize = { width: 150, height: 100 },
  isVisible,
  isFocused,
  zIndex,
  onClose,
  onFocus,
  onPositionChange,
  onSizeChange,
  children,
  resizable = true,
  showStatusBar = false,
  statusText = '',
}: WindowProps) {
  const { position, isDragging, handleMouseDown } = useDraggable({
    initialPosition,
    onPositionChange,
  });

  const [size, setSize] = useState<WindowSize>(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Zoom animation state
  const [animationState, setAnimationState] = useState<'none' | 'opening' | 'closing' | 'visible'>('none');
  const [showWindow, setShowWindow] = useState(false);
  const prevVisibleRef = useRef(isVisible);
  const hasInitializedRef = useRef(false);

  // Handle visibility changes with zoom animation
  useEffect(() => {
    // Skip animation on initial mount - just show windows directly
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (isVisible) {
        setShowWindow(true);
        setAnimationState('visible');
      }
      prevVisibleRef.current = isVisible;
      return;
    }

    if (isVisible && !prevVisibleRef.current) {
      // Opening: show zoom animation first
      setAnimationState('opening');
      setShowWindow(false);
    } else if (!isVisible && prevVisibleRef.current) {
      // Closing: show zoom animation while window is still visible
      setAnimationState('closing');
    }

    prevVisibleRef.current = isVisible;
  }, [isVisible]);

  const handleAnimationComplete = useCallback(() => {
    if (animationState === 'opening') {
      setShowWindow(true);
      setAnimationState('visible');
    } else if (animationState === 'closing') {
      setShowWindow(false);
      setAnimationState('none');
    }
  }, [animationState]);

  const handleWindowClick = useCallback(() => {
    onFocus();
  }, [onFocus]);

  // Resize handlers
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  }, [size]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      const newWidth = Math.max(minSize.width, resizeStartRef.current.width + deltaX);
      const newHeight = Math.max(minSize.height, resizeStartRef.current.height + deltaY);

      setSize({ width: newWidth, height: newHeight });
      onSizeChange?.({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minSize, onSizeChange]);

  // Calculate zoom animation rectangles
  // Origin point is center of screen (like classic Mac menubar origin)
  const menuBarOrigin = { x: window.innerWidth / 2, y: 20, width: 8, height: 8 };
  const windowRect = { x: position.x, y: position.y, width: size.width, height: size.height };

  // Render zoom animation if animating
  const renderZoomAnimation = () => {
    if (animationState === 'opening') {
      return (
        <ZoomAnimation
          startRect={menuBarOrigin}
          endRect={windowRect}
          isOpening={true}
          onComplete={handleAnimationComplete}
        />
      );
    }
    if (animationState === 'closing') {
      return (
        <ZoomAnimation
          startRect={windowRect}
          endRect={menuBarOrigin}
          isOpening={false}
          onComplete={handleAnimationComplete}
        />
      );
    }
    return null;
  };

  // Don't render if not visible and not animating
  if (!showWindow && animationState !== 'opening' && animationState !== 'closing') {
    return null;
  }

  return (
    <>
      {renderZoomAnimation()}
      {showWindow && (
        <div
          className={`window ${isFocused ? 'focused' : ''}`}
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            zIndex,
            cursor: isDragging ? 'grabbing' : undefined,
          }}
          onMouseDown={handleWindowClick}
        >
          {/* Title Bar */}
          <div className="title-bar" onMouseDown={handleMouseDown}>
            <div className="close-box" onClick={onClose} />
            <div className="window-title">{title}</div>
          </div>

          {/* Content Area */}
          <div className="window-content">
            {children}
          </div>

          {/* Status Bar */}
          {showStatusBar && (
            <div className="status-bar">{statusText}</div>
          )}

          {/* Resize Handle */}
          {resizable && (
            <div
              className="resize-handle"
              onMouseDown={handleResizeMouseDown}
              style={{ cursor: 'se-resize' }}
            />
          )}
        </div>
      )}
    </>
  );
}

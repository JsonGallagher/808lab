import { useState, useEffect, useRef } from 'react';

export interface JackPosition {
  id: string;
  x: number;
  y: number;
  type: 'input' | 'output';
  windowId: string;
}

export interface Connection {
  id: string;
  from: string; // jack id
  to: string;   // jack id
}

// Helper to get point on quadratic bezier curve
function getPointOnQuadraticBezier(t: number, p0: {x: number, y: number}, p1: {x: number, y: number}, p2: {x: number, y: number}) {
  const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x;
  const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y;
  return { x, y };
}

// Simple cable rendering component
interface CableProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  onClick?: () => void;
  isActive?: boolean;
  isPulsing?: boolean;
}

function Cable({ x1, y1, x2, y2, onClick, isActive = true, isPulsing = false }: CableProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [wiggleOffset, setWiggleOffset] = useState(0);
  const [pulsePosition, setPulsePosition] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const pulseRef = useRef<number | null>(null);

  // Subtle wiggle animation on hover - like a gently disturbed wire
  useEffect(() => {
    if (isHovered) {
      let startTime: number | null = null;
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        // Gentle decay over ~800ms
        const decay = Math.exp(-elapsed / 800);
        // Subtle, slow oscillation - like a wire settling
        const wiggle = Math.sin(elapsed / 80) * 4 * decay;
        setWiggleOffset(wiggle);

        if (decay > 0.02) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setWiggleOffset(0);
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setWiggleOffset(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered]);

  // Pulse animation when audio triggers
  useEffect(() => {
    if (isPulsing) {
      let startTime: number | null = null;
      const animatePulse = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const duration = 300; // Pulse travels in 300ms
        const t = Math.min(elapsed / duration, 1);

        setPulsePosition(t);

        if (t < 1) {
          pulseRef.current = requestAnimationFrame(animatePulse);
        } else {
          setPulsePosition(null);
        }
      };
      pulseRef.current = requestAnimationFrame(animatePulse);
    }

    return () => {
      if (pulseRef.current) {
        cancelAnimationFrame(pulseRef.current);
      }
    };
  }, [isPulsing]);

  // Calculate control points for a nice curve
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const sag = Math.min(dist * 0.3, 80); // Cable sag

  // Add wiggle to the control point
  const controlX = midX + wiggleOffset;
  const controlY = midY + sag;
  const path = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;

  // Calculate pulse dot position
  let pulsePoint = null;
  if (pulsePosition !== null) {
    pulsePoint = getPointOnQuadraticBezier(
      pulsePosition,
      { x: x1, y: y1 },
      { x: controlX, y: controlY },
      { x: x2, y: y2 }
    );
  }

  return (
    <g
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible wider hit area for easier hovering */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        strokeLinecap="round"
      />
      {/* Cable shadow */}
      <path
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={5}
        strokeLinecap="round"
        transform="translate(2, 2)"
      />
      {/* Main cable */}
      <path
        d={path}
        fill="none"
        stroke={isActive ? '#000000' : '#808080'}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Cable highlight */}
      <path
        d={path}
        fill="none"
        stroke={isActive ? '#404040' : '#a0a0a0'}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={isActive ? 'none' : '4 4'}
      />
      {/* Pulse dot traveling along cable */}
      {pulsePoint && (
        <>
          {/* Glow effect */}
          <circle
            cx={pulsePoint.x}
            cy={pulsePoint.y}
            r={8}
            fill="white"
            opacity={0.5}
          />
          {/* Main pulse dot */}
          <circle
            cx={pulsePoint.x}
            cy={pulsePoint.y}
            r={5}
            fill="white"
            stroke="black"
            strokeWidth={1}
          />
        </>
      )}
    </g>
  );
}

// Jack component for connection points
interface JackProps {
  id: string;
  type: 'input' | 'output';
  windowId: string;
  label?: string;
  onConnect?: (connected: boolean) => void;
  cablesManager: CablesManager;
}

export function Jack({ id, type, windowId, label, cablesManager }: JackProps) {
  const jackRef = useRef<HTMLDivElement>(null);

  // Update position when mounted and on window move
  useEffect(() => {
    const updatePosition = () => {
      if (jackRef.current) {
        const rect = jackRef.current.getBoundingClientRect();
        cablesManager.updateJackPosition(id, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    };

    updatePosition();

    // Update position periodically (for window dragging)
    const interval = setInterval(updatePosition, 50);

    cablesManager.registerJack({
      id,
      type,
      windowId,
      x: 0,
      y: 0,
    });

    return () => {
      clearInterval(interval);
      cablesManager.unregisterJack(id);
    };
  }, [id, type, windowId, cablesManager]);

  const isConnected = cablesManager.isConnected(id);
  const isDragging = cablesManager.draggingFrom === id;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isConnected && type === 'input') {
      // Disconnect existing connection
      const conn = cablesManager.connections.find(c => c.to === id);
      if (conn) {
        cablesManager.disconnect(conn.id);
      }
    } else {
      cablesManager.startDragging(id);
    }
  };

  return (
    <div
      className="jack-container"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        flexDirection: type === 'output' ? 'row' : 'row-reverse',
      }}
    >
      {label && <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{label}</span>}
      <div
        ref={jackRef}
        className={`jack ${type} ${isConnected ? 'connected' : ''} ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '2px solid #000',
          background: isConnected ? '#000' : '#fff',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {/* Inner hole */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: isConnected ? '#fff' : '#000',
        }} />
      </div>
    </div>
  );
}

// Cables manager class
export class CablesManager {
  jacks: Map<string, JackPosition> = new Map();
  connections: Connection[] = [];
  draggingFrom: string | null = null;
  dragPosition: { x: number; y: number } | null = null;
  private listeners: Set<() => void> = new Set();
  private onConnectionChange?: (connected: boolean) => void;
  private autoConnectPending = true;

  constructor(onConnectionChange?: (connected: boolean) => void) {
    this.onConnectionChange = onConnectionChange;
  }

  // Auto-connect synth to effects on startup
  tryAutoConnect(): void {
    if (!this.autoConnectPending) return;

    const hasOutput = this.jacks.has('synth-output');
    const hasInput = this.jacks.has('effects-input');

    if (hasOutput && hasInput) {
      this.connect('synth-output', 'effects-input');
      this.autoConnectPending = false;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  registerJack(jack: JackPosition) {
    this.jacks.set(jack.id, jack);
    this.notify();
    // Try auto-connect when both jacks are registered
    this.tryAutoConnect();
  }

  unregisterJack(id: string) {
    this.jacks.delete(id);
    this.notify();
  }

  updateJackPosition(id: string, x: number, y: number) {
    const jack = this.jacks.get(id);
    if (jack) {
      jack.x = x;
      jack.y = y;
      this.notify();
    }
  }

  startDragging(jackId: string) {
    this.draggingFrom = jackId;
    this.notify();
  }

  stopDragging() {
    this.draggingFrom = null;
    this.dragPosition = null;
    this.notify();
  }

  updateDragPosition(x: number, y: number) {
    this.dragPosition = { x, y };
    this.notify();
  }

  connect(fromId: string, toId: string) {
    const fromJack = this.jacks.get(fromId);
    const toJack = this.jacks.get(toId);

    if (!fromJack || !toJack) return;
    if (fromJack.type === toJack.type) return; // Can't connect same types

    // Ensure from is output and to is input
    const [outputId, inputId] = fromJack.type === 'output'
      ? [fromId, toId]
      : [toId, fromId];

    // Check if already connected
    if (this.connections.some(c => c.from === outputId && c.to === inputId)) return;

    // Remove existing connection to input
    this.connections = this.connections.filter(c => c.to !== inputId);

    this.connections.push({
      id: `${outputId}-${inputId}`,
      from: outputId,
      to: inputId,
    });

    this.onConnectionChange?.(true);
    this.notify();
  }

  disconnect(connectionId: string) {
    this.connections = this.connections.filter(c => c.id !== connectionId);
    this.onConnectionChange?.(this.connections.length > 0);
    this.notify();
  }

  isConnected(jackId: string): boolean {
    return this.connections.some(c => c.from === jackId || c.to === jackId);
  }

  hasEffectsConnection(): boolean {
    return this.connections.some(c =>
      (c.from === 'synth-output' && c.to === 'effects-input')
    );
  }
}

// SVG overlay for rendering cables
interface CablesOverlayProps {
  manager: CablesManager;
  isPulsing?: boolean;
}

export function CablesOverlay({ manager, isPulsing = false }: CablesOverlayProps) {
  const [, forceUpdate] = useState({});
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    return manager.subscribe(() => forceUpdate({}));
  }, [manager]);

  // Increment pulse key when isPulsing becomes true to trigger new animation
  useEffect(() => {
    if (isPulsing) {
      setPulseKey(k => k + 1);
    }
  }, [isPulsing]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (manager.draggingFrom) {
        manager.updateDragPosition(e.clientX, e.clientY);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (manager.draggingFrom) {
        // Check if we're over a jack
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const jackEl = target?.closest('.jack');

        if (jackEl) {
          // Find the jack ID from the registered jacks
          for (const [id, jack] of manager.jacks) {
            const dist = Math.sqrt(
              (jack.x - e.clientX) ** 2 + (jack.y - e.clientY) ** 2
            );
            if (dist < 20 && id !== manager.draggingFrom) {
              manager.connect(manager.draggingFrom, id);
              break;
            }
          }
        }
        manager.stopDragging();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [manager]);

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {/* Render existing connections */}
      {manager.connections.map(conn => {
        const fromJack = manager.jacks.get(conn.from);
        const toJack = manager.jacks.get(conn.to);

        if (!fromJack || !toJack) return null;

        return (
          <g key={conn.id} style={{ pointerEvents: 'auto' }}>
            <Cable
              key={`${conn.id}-${pulseKey}`}
              x1={fromJack.x}
              y1={fromJack.y}
              x2={toJack.x}
              y2={toJack.y}
              onClick={() => manager.disconnect(conn.id)}
              isPulsing={isPulsing && pulseKey > 0}
            />
          </g>
        );
      })}

      {/* Render dragging cable */}
      {manager.draggingFrom && manager.dragPosition && (() => {
        const fromJack = manager.jacks.get(manager.draggingFrom);
        if (!fromJack) return null;

        return (
          <Cable
            x1={fromJack.x}
            y1={fromJack.y}
            x2={manager.dragPosition.x}
            y2={manager.dragPosition.y}
            isActive={false}
          />
        );
      })()}
    </svg>
  );
}

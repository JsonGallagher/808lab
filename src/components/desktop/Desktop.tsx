import { type ReactNode, useState, useEffect } from 'react';
import { MenuBar } from './MenuBar';
import { DitheredBackground } from './DitheredBackground';
import type { Menu } from '../../types';

interface DesktopProps {
  menus: Menu[];
  children: ReactNode;
}

export function Desktop({ menus, children }: DesktopProps) {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div className="desktop">
      <DitheredBackground width={dimensions.width} height={dimensions.height} />
      <MenuBar menus={menus} />
      {children}
    </div>
  );
}

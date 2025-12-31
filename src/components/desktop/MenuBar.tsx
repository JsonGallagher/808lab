import { useState, useCallback, useEffect, useRef } from 'react';
import type { Menu, MenuItem } from '../../types';

interface MenuBarProps {
  menus: Menu[];
}

export function MenuBar({ menus }: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = useCallback((menuLabel: string) => {
    setActiveMenu(activeMenu === menuLabel ? null : menuLabel);
  }, [activeMenu]);

  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.disabled || item.separator) return;
    item.action?.();
    setActiveMenu(null);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeMenu]);

  return (
    <div className="menubar" ref={menuBarRef}>
      {menus.map((menu) => (
        <div
          key={menu.label}
          className={`menubar-item ${activeMenu === menu.label ? 'active' : ''}`}
          onClick={() => handleMenuClick(menu.label)}
        >
          {menu.label}
          {activeMenu === menu.label && (
            <div className="menu-dropdown">
              {menu.items.map((item, index) =>
                item.separator ? (
                  <div key={index} className="menu-separator" />
                ) : (
                  <div
                    key={item.label}
                    className={`menu-item ${item.disabled ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="menu-shortcut">{item.shortcut}</span>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

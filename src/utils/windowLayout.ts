import type { WindowPosition, WindowSize } from '../types';

interface WindowLayout {
  position: WindowPosition;
  size: WindowSize;
}

// Window configurations with their proper sizes (to fit all content without scrollbars)
// These match the original hardcoded sizes from each window component
const WINDOW_CONFIGS: Record<string, WindowSize> = {
  synth: { width: 580, height: 870 },
  effects: { width: 300, height: 645 },
  presets: { width: 300, height: 340 },
  output: { width: 280, height: 390 },
  keyboard: { width: 815, height: 210 },
};

// Layout constants
const MENU_BAR_HEIGHT = 25;
const MARGIN = 40;
const MIN_GAP = 20;
const MAX_GAP = 120;

/**
 * Calculate smart window positions based on viewport size.
 * Layout: Synth (left) | Effects (middle) | Presets/Output stacked (right)
 * Windows spread out more on larger screens.
 */
export function calculateWindowLayout(
  viewportWidth: number,
  _viewportHeight: number
): Record<string, WindowLayout> {
  const configs = WINDOW_CONFIGS;

  // Calculate minimum width needed (with minimum gaps)
  const rightColumnWidth = Math.max(configs.presets.width, configs.output.width);
  const minTotalWidth =
    configs.synth.width + MIN_GAP +
    configs.effects.width + MIN_GAP +
    rightColumnWidth;

  // Calculate available extra space and distribute it between gaps
  const availableWidth = viewportWidth - (MARGIN * 2);
  const extraSpace = Math.max(0, availableWidth - minTotalWidth);

  // Distribute extra space between the 2 gaps (synth-effects and effects-right column)
  // Cap the gap at MAX_GAP to prevent windows from being too far apart
  const dynamicGap = Math.min(MAX_GAP, MIN_GAP + (extraSpace / 2));

  // Calculate total width with dynamic gaps
  const totalContentWidth =
    configs.synth.width + dynamicGap +
    configs.effects.width + dynamicGap +
    rightColumnWidth;

  // Calculate starting X to center the layout horizontally
  const startX = Math.max(MARGIN, (viewportWidth - totalContentWidth) / 2);

  // Calculate starting Y (below menu bar with margin)
  const startY = MENU_BAR_HEIGHT + MARGIN;

  const layouts: Record<string, WindowLayout> = {};

  // Synth window - leftmost, primary window
  layouts.synth = {
    position: {
      x: startX,
      y: startY
    },
    size: configs.synth,
  };

  // Effects window - to the right of synth, staggered down slightly
  layouts.effects = {
    position: {
      x: startX + configs.synth.width + dynamicGap,
      y: startY + 20
    },
    size: configs.effects,
  };

  // Right column X position (to the right of effects)
  const rightColumnX = startX + configs.synth.width + dynamicGap + configs.effects.width + dynamicGap;

  // Presets window - top right, slight stagger for visual interest
  layouts.presets = {
    position: {
      x: rightColumnX + 10,
      y: startY + 10
    },
    size: configs.presets,
  };

  // Output window - below presets
  layouts.output = {
    position: {
      x: rightColumnX + 20,
      y: startY + configs.presets.height + MIN_GAP + 25
    },
    size: configs.output,
  };

  // Keyboard window - near bottom of screen, centered horizontally
  layouts.keyboard = {
    position: {
      x: Math.max(MARGIN, (viewportWidth - configs.keyboard.width) / 2),
      y: startY + configs.synth.height + MIN_GAP + 100
    },
    size: configs.keyboard,
  };

  return layouts;
}

/**
 * Get the layout for a specific window
 */
export function getWindowLayout(
  windowId: string,
  viewportWidth: number,
  viewportHeight: number
): WindowLayout {
  const layouts = calculateWindowLayout(viewportWidth, viewportHeight);
  return layouts[windowId] || {
    position: { x: MARGIN, y: MENU_BAR_HEIGHT + MARGIN },
    size: WINDOW_CONFIGS[windowId] || { width: 300, height: 400 },
  };
}

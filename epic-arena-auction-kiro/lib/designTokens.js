/**
 * designTokens.js
 * Central source of truth for all design system values
 * Colors, spacing, typography, shadows, border-radius, animations
 */

export const COLORS = {
  // Primary Colors
  primary: {
    50: '#F0F7FF',
    100: '#E0EFFE',
    200: '#BDE3FE',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0066CC',
    600: '#0052A3',
    700: '#003D7A',
    800: '#002851',
    900: '#001428',
  },

  // Neutral Colors (Gray scale)
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    offline: '#F97316',
  },

  // Sports Brand Colors
  gold: '#FFB81C',
  danger: '#DC143C',
  turf: '#1F7A4D',

  // Team Colors (8 Franchises)
  teams: {
    1: { primary: '#E63946', secondary: '#A4161A', name: 'Raksha' },
    2: { primary: '#1D3557', secondary: '#457B9D', name: 'Singapore Sixers' },
    3: { primary: '#F77F00', secondary: '#FCBF49', name: 'Habiba Hunters' },
    4: { primary: '#06A77D', secondary: '#2D6A4F', name: 'Annur Falcons' },
    5: { primary: '#8B5A8E', secondary: '#D4A5D4', name: 'Trivorn Strikers' },
    6: { primary: '#FF006E', secondary: '#FB5607', name: 'Thunder Wolves' },
    7: { primary: '#2A9D8F', secondary: '#E76F51', name: 'Garuda Warriors' },
    8: { primary: '#264653', secondary: '#E9C46A', name: 'Ellai Spartans' },
  },
};

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
};

export const TYPOGRAPHY = {
  fontFamily: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", "Courier New", monospace',
    display: '"Bebas Neue", sans-serif',
  },
  sizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '28px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const SHADOWS = {
  subtle: '0 2px 8px rgba(0, 0, 0, 0.08)',
  medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
  elevation: '0 8px 24px rgba(0, 0, 0, 0.15)',
  focus: '0 0 0 3px rgba(0, 102, 204, 0.2)',
  glow: '0 0 40px rgba(245, 166, 35, 0.45)',
};

export const BORDER_RADIUS = {
  tight: '4px',
  subtle: '6px',
  standard: '8px',
  rounded: '12px',
  pill: '24px',
  full: '9999px',
};

export const ANIMATIONS = {
  // Durations (milliseconds)
  duration: {
    quick: 150,
    standard: 250,
    slow: 400,
    slower: 600,
    smoothBid: 550,
  },

  // Timing functions
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    power2Out: 'cubic-bezier(0.33, 0.66, 0.66, 1)',
  },

  // Predefined sequences
  micro: {
    buttonHover: { duration: 150, scale: 1.02, shadow: 'medium' },
    cardHover: { duration: 200, scale: 1.01, shadow: 'medium' },
    squadCardEntrance: { duration: 250, scale: { from: 0.95, to: 1 }, opacity: { from: 0, to: 1 } },
    modalEntrance: { duration: 200, scale: { from: 0.9, to: 1 }, opacity: { from: 0, to: 1 } },
    toastSlideIn: { duration: 200, distance: -20 },
  },
};

export const RESPONSIVE_BREAKPOINTS = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1920px',
  '4k': '3840px',
};

export const TYPOGRAPHY_SCALE = {
  // Fluid typography scale for responsive sizing (320px → 3840px)
  // Uses clamp(min, preferred, max) for smooth scaling
  body: {
    xs: { minSize: '12px', maxSize: '14px' },
    sm: { minSize: '13px', maxSize: '16px' },
    md: { minSize: '14px', maxSize: '18px' },
    lg: { minSize: '16px', maxSize: '20px' },
    xl: { minSize: '18px', maxSize: '24px' },
  },
  heading: {
    sm: { minSize: '18px', maxSize: '24px' },
    md: { minSize: '24px', maxSize: '32px' },
    lg: { minSize: '32px', maxSize: '48px' },
    xl: { minSize: '48px', maxSize: '64px' },
  },
};

/**
 * Get team color by team ID
 * @param {number} teamId - Team ID (1-8)
 * @returns {Object} - { primary, secondary, name }
 */
export function getTeamColor(teamId) {
  const teamNum = ((teamId - 1) % 8) + 1;
  return COLORS.teams[teamNum] || COLORS.teams[1];
}

/**
 * Generate CSS clamp() expression for fluid typography
 * @param {number} minVw - Minimum viewport width (px)
 * @param {number} maxVw - Maximum viewport width (px)
 * @param {string} minSize - Minimum font size (px)
 * @param {string} maxSize - Maximum font size (px)
 * @returns {string} - CSS clamp() expression
 */
export function generateFluidTypography(minVw = 320, maxVw = 3840, minSize = '12px', maxSize = '48px') {
  const minNum = parseInt(minSize);
  const maxNum = parseInt(maxSize);
  const slope = ((maxNum - minNum) / (maxVw - minVw)) * 100;
  const intercept = minNum - (slope / 100) * minVw;
  return `clamp(${minSize}, ${intercept.toFixed(2)}vw + ${slope.toFixed(2)}%, ${maxSize})`;
}

export default {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
  ANIMATIONS,
  RESPONSIVE_BREAKPOINTS,
  TYPOGRAPHY_SCALE,
  getTeamColor,
  generateFluidTypography,
};

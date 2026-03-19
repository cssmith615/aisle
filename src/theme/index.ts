export const Colors = {
  // Backgrounds
  background: '#FDFAF8',
  backgroundCard: '#FFFFFF',
  cream: '#FAF3EE',

  // Primary — warm gold
  primary: '#C9A96E',
  primaryLight: '#E8D5B7',
  primaryDark: '#A07840',

  // Secondary — blush/rose
  blush: '#F2D6D6',
  rose: '#C97C8C',
  roseDark: '#A05060',

  // Borders & dividers
  border: '#EDE0D8',

  // Text
  textPrimary: '#2C1F1A',
  textSecondary: '#7A5E54',
  textMuted: '#B09A92',

  // Status
  success: '#7BAE7F',
  warning: '#D4A843',
  error: '#C96060',

  // Misc
  white: '#FFFFFF',
  overlay: 'rgba(44, 31, 26, 0.4)',
};

export const Typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 38,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2C1F1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
};

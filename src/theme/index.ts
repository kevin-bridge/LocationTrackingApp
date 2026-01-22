// Modern Theme Constants for Location Tracking App
// A clean, professional design system with subtle gradients and smooth interactions

export const Colors = {
  // Primary palette - Deep teal/cyan for a modern, trustworthy feel
  primary: '#0891B2',
  primaryDark: '#0E7490',
  primaryLight: '#22D3EE',
  primarySoft: '#ECFEFF',

  // Secondary palette - Warm coral for accents
  secondary: '#F97316',
  secondaryDark: '#EA580C',
  secondaryLight: '#FB923C',

  // Success/Start colors
  success: '#10B981',
  successDark: '#059669',
  successLight: '#34D399',
  successSoft: '#D1FAE5',

  // Error/Stop colors
  error: '#EF4444',
  errorDark: '#DC2626',
  errorLight: '#F87171',
  errorSoft: '#FEE2E2',

  // Warning
  warning: '#F59E0B',
  warningDark: '#D97706',
  warningSoft: '#FEF3C7',

  // Neutral palette
  white: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text colors
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Border colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#0891B2',

  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)',

  // Map specific
  routeColor: '#0891B2',
  startMarker: '#10B981',
  endMarker: '#EF4444',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  // Font sizes
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  body: 16,
  bodySmall: 14,
  caption: 12,
  tiny: 10,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
};

// Common component styles
export const CommonStyles = {
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },

  input: {
    height: 56,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body,
    color: Colors.textPrimary,
  },

  inputFocused: {
    borderColor: Colors.borderFocus,
    borderWidth: 2,
  },

  buttonPrimary: {
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  buttonSecondary: {
    height: 56,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  buttonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textInverse,
  },

  buttonTextSecondary: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.primary,
  },
};

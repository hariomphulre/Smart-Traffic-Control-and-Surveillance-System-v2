/**
 * Professional Color Palette Reference
 * Smart Traffic Control & Surveillance System
 * 
 * Use this file to import consistent colors across your application
 */

export const colors = {
  // PRIMARY - Sky Blue (Authority, Trust, Technology)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',   // Main color
    600: '#0284c7',   // Most used
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // SUCCESS - Green (Safe Operations, Compliance)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',   // Main color
    600: '#16a34a',   // Most used
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // WARNING - Amber (Caution, Moderate Violations)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',   // Main color (Most used)
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // DANGER - Red (Critical Alerts, Violations)
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',   // Main color
    600: '#dc2626',   // Most used
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a',
  },

  // INFO - Cyan (Information, Highlights)
  info: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',   // Main color
    600: '#0891b2',   // Most used
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },

  // NEUTRAL - Slate (UI Elements, Text, Borders)
  neutral: {
    50: '#f8fafc',    // Light background
    100: '#f1f5f9',   // Card background (light)
    200: '#e2e8f0',   // Border (light)
    300: '#cbd5e1',   
    400: '#94a3b8',   // Muted text (light)
    500: '#64748b',   // Main neutral
    600: '#475569',   // Muted text (dark)
    700: '#334155',   // Border (dark)
    800: '#1e293b',   // Card background (dark)
    900: '#0f172a',   // Dark background
    950: '#020617',   // Darkest
  },
};

// Export semantic color names for common use cases
export const semanticColors = {
  // Backgrounds
  bgLight: colors.neutral[50],
  bgDark: colors.neutral[900],
  cardLight: '#ffffff',
  cardDark: colors.neutral[800],

  // Text
  textLight: colors.neutral[900],
  textDark: colors.neutral[100],
  mutedLight: colors.neutral[600],
  mutedDark: colors.neutral[400],

  // Borders
  borderLight: colors.neutral[200],
  borderDark: colors.neutral[700],

  // States
  successBg: colors.success[50],
  successBgDark: `${colors.success[900]}33`, // with opacity
  successText: colors.success[700],
  successTextDark: colors.success[300],
  successBorder: colors.success[300],
  successBorderDark: colors.success[700],

  warningBg: colors.warning[50],
  warningBgDark: `${colors.warning[900]}33`,
  warningText: colors.warning[700],
  warningTextDark: colors.warning[300],
  warningBorder: colors.warning[300],
  warningBorderDark: colors.warning[700],

  dangerBg: colors.danger[50],
  dangerBgDark: `${colors.danger[900]}33`,
  dangerText: colors.danger[700],
  dangerTextDark: colors.danger[300],
  dangerBorder: colors.danger[300],
  dangerBorderDark: colors.danger[700],

  infoBg: colors.info[50],
  infoBgDark: `${colors.info[900]}33`,
  infoText: colors.info[700],
  infoTextDark: colors.info[300],
  infoBorder: colors.info[300],
  infoBorderDark: colors.info[700],
};

// Export chart colors
export const chartColors = {
  primary: '#0ea5e9',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  secondary: '#64748b',
  violet: '#8b5cf6',
  pink: '#ec4899',
};

export const violationColors = [
  chartColors.danger,   // #ef4444 - Helmet-less
  chartColors.warning,  // #f59e0b - Tripling
  '#f97316',           // Orange - Red Light
  '#dc2626',           // Dark Red - Over Speed
];

export const vehicleColors = [
  chartColors.primary,  // #0ea5e9 - Car
  chartColors.info,     // #06b6d4 - Bike
  chartColors.violet,   // #8b5cf6 - Truck
  chartColors.success,  // #22c55e - Bus
  chartColors.warning,  // #f59e0b - Auto
];

export default colors;

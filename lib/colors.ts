// Professional Color Palette for Traffic Control System

export const CHART_COLORS = {
  primary: '#0ea5e9',      // Sky Blue - Primary actions
  success: '#22c55e',      // Green - Safe/Compliant
  warning: '#f59e0b',      // Amber - Caution/Warning
  danger: '#ef4444',       // Red - Critical/Violations
  info: '#06b6d4',         // Cyan - Information
  secondary: '#64748b',    // Slate - Secondary elements
  violet: '#8b5cf6',       // Purple - Accent
  pink: '#ec4899',         // Pink - Accent
} as const;

export const VIOLATION_COLORS = [
  CHART_COLORS.danger,   // Helmet-less
  CHART_COLORS.warning,  // Tripling
  '#f97316',            // Orange - Red Light
  '#dc2626',            // Dark Red - Over Speed
] as const;

export const VEHICLE_COLORS = [
  CHART_COLORS.primary,  // Car
  CHART_COLORS.info,     // Bike
  CHART_COLORS.violet,   // Truck
  CHART_COLORS.success,  // Bus
  CHART_COLORS.warning,  // Auto
] as const;

export const SEVERITY_COLORS = {
  low: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    border: 'border-success-500 dark:border-success-600',
    text: 'text-success-700 dark:text-success-300',
    badge: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
  },
  medium: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    border: 'border-warning-500 dark:border-warning-600',
    text: 'text-warning-700 dark:text-warning-300',
    badge: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
  },
  high: {
    bg: 'bg-danger-50 dark:bg-danger-900/20',
    border: 'border-danger-500 dark:border-danger-600',
    text: 'text-danger-700 dark:text-danger-300',
    badge: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300',
  },
} as const;

export const STATUS_COLORS = {
  pending: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    text: 'text-warning-700 dark:text-warning-300',
    badge: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border border-warning-300 dark:border-warning-700',
  },
  received: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    text: 'text-success-700 dark:text-success-300',
    badge: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 border border-success-300 dark:border-success-700',
  },
  rejected: {
    bg: 'bg-danger-50 dark:bg-danger-900/20',
    text: 'text-danger-700 dark:text-danger-300',
    badge: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 border border-danger-300 dark:border-danger-700',
  },
} as const;

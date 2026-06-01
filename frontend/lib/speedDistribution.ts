import type { SpeedDistribution } from '@/lib/api';

/** Canonical speed buckets returned by the analytics API (km/h). */
export const SPEED_RANGE_ORDER = [
  '0-20',
  '21-40',
  '41-60',
  '61-80',
  '81-100',
  '100+',
] as const;

/** Rainbow palette (violet → red) for speed buckets. */
export const SPEED_RANGE_COLORS: Record<string, string> = {
  '0-20': '#845EF7',
  '21-40': '#4DABF7',
  '41-60': '#51CF66',
  '61-80': '#FFE066',
  '81-100': '#FF922B',
  '100+': '#FF6B6B',
};

const SPEED_RANGE_COLOR_FALLBACK = [
  '#845EF7',
  '#4DABF7',
  '#51CF66',
  '#FFE066',
  '#FF922B',
  '#FF6B6B',
];

export function getSpeedRangeColor(range: string, index: number): string {
  return (
    SPEED_RANGE_COLORS[range] ??
    SPEED_RANGE_COLOR_FALLBACK[index % SPEED_RANGE_COLOR_FALLBACK.length]
  );
}

function speedRangeSortIndex(range: string): number {
  const idx = SPEED_RANGE_ORDER.indexOf(
    range as (typeof SPEED_RANGE_ORDER)[number],
  );
  return idx === -1 ? SPEED_RANGE_ORDER.length : idx;
}

export function sortSpeedDistribution(
  data: SpeedDistribution[],
): SpeedDistribution[] {
  return [...data].sort(
    (a, b) => speedRangeSortIndex(a.range) - speedRangeSortIndex(b.range),
  );
}

export function totalSpeedDistributionCount(data: SpeedDistribution[]): number {
  return data.reduce((sum, item) => sum + item.count, 0);
}

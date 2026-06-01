export type CustomDateRange = {
  start: string;
  end: string;
};

export type DateRangeParams = {
  from?: string;
  to?: string;
};

const DURATION_MS: Record<string, number> = {
  '1 hr': 60 * 60 * 1000,
  '3 hr': 3 * 60 * 60 * 1000,
  '6 hr': 6 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1 week': 7 * 24 * 60 * 60 * 1000,
  '1 month': 30 * 24 * 60 * 60 * 1000,
  '1 year': 365 * 24 * 60 * 60 * 1000,
};

/** Maps analytics-style duration labels to API `from` / `to` (ISO) query params. */
export function durationToDateRange(
  duration: string,
  custom?: CustomDateRange | null,
): DateRangeParams {
  if (duration === 'custom' || duration === 'custom duration') {
    if (!custom?.start || !custom?.end) return {};
    return {
      from: new Date(custom.start).toISOString(),
      to: new Date(custom.end).toISOString(),
    };
  }

  if (duration === 'all time') {
    return {};
  }

  const ms = DURATION_MS[duration];
  if (!ms) return {};

  const to = new Date();
  const from = new Date(to.getTime() - ms);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

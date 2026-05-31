'use client';

import { useCallback, useState } from 'react';

export const ANALYTICS_CHART_IDS = {
  overallTraffic: 'overall-traffic',
  separateTraffic1: 'separate-traffic-1',
  emergency1: 'emergency-1',
  violations: 'violations',
  vehicleTypes: 'vehicle-types',
  speedDistributionPie: 'speed-distribution-pie',
  speedLine: 'speed-line',
  separateTraffic2: 'separate-traffic-2',
  emergency2: 'emergency-2',
  heatmap: 'heatmap',
} as const;

export type AnalyticsChartId =
  (typeof ANALYTICS_CHART_IDS)[keyof typeof ANALYTICS_CHART_IDS];

const DEFAULT_DURATION = '1 hr';

const ALL_CHART_IDS = Object.values(ANALYTICS_CHART_IDS);

function buildDefaultDurations(): Record<AnalyticsChartId, string> {
  return Object.fromEntries(
    ALL_CHART_IDS.map((id) => [id, DEFAULT_DURATION]),
  ) as Record<AnalyticsChartId, string>;
}

type CustomRange = { start: string; end: string };

export function useChartDurations() {
  const [durationsByChart, setDurationsByChart] =
    useState<Record<AnalyticsChartId, string>>(buildDefaultDurations);
  const [customRangesByChart, setCustomRangesByChart] = useState<
    Partial<Record<AnalyticsChartId, CustomRange>>
  >({});
  const [customModalChartId, setCustomModalChartId] =
    useState<AnalyticsChartId | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getDuration = useCallback(
    (chartId: AnalyticsChartId) => durationsByChart[chartId] ?? DEFAULT_DURATION,
    [durationsByChart],
  );

  const handleDurationSelect = useCallback(
    (chartId: AnalyticsChartId, duration: string) => {
      if (duration === 'custom duration') {
        const saved = customRangesByChart[chartId];
        setCustomStart(saved?.start ?? '');
        setCustomEnd(saved?.end ?? '');
        setCustomModalChartId(chartId);
        setIsCustomModalOpen(true);
        return;
      }

      setDurationsByChart((prev) => ({ ...prev, [chartId]: duration }));
      // TODO: Fetch data for chartId + duration
    },
    [customRangesByChart],
  );

  const handleCustomApply = useCallback(() => {
    if (!customModalChartId || !customStart || !customEnd) return;

    setDurationsByChart((prev) => ({
      ...prev,
      [customModalChartId]: 'custom',
    }));
    setCustomRangesByChart((prev) => ({
      ...prev,
      [customModalChartId]: { start: customStart, end: customEnd },
    }));
    setIsCustomModalOpen(false);
    setCustomModalChartId(null);

    // TODO: Fetch data using customStart and customEnd for customModalChartId
    console.log(
      `[${customModalChartId}] Fetching from ${customStart} to ${customEnd}`,
    );
  }, [customModalChartId, customStart, customEnd]);

  const closeCustomModal = useCallback(() => {
    setIsCustomModalOpen(false);
    setCustomModalChartId(null);
  }, []);

  return {
    getDuration,
    handleDurationSelect,
    isCustomModalOpen,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    handleCustomApply,
    closeCustomModal,
  };
}

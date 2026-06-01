'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  type CustomDateRange,
  durationToDateRange,
} from '@/lib/durationRange';

const DEFAULT_DURATION = '1 hr';

export function useDurationFilter(initialDuration = DEFAULT_DURATION) {
  const [selectedDuration, setSelectedDuration] = useState(initialDuration);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customRange, setCustomRange] = useState<CustomDateRange | null>(null);

  const dateRange = useMemo(
    () => durationToDateRange(selectedDuration, customRange),
    [selectedDuration, customRange],
  );

  const handleDurationSelect = useCallback(
    (duration: string) => {
      if (duration === 'custom duration') {
        setCustomStart(customRange?.start ?? '');
        setCustomEnd(customRange?.end ?? '');
        setIsCustomModalOpen(true);
        return;
      }
      setSelectedDuration(duration);
      if (duration !== 'custom') {
        setCustomRange(null);
      }
    },
    [customRange],
  );

  const handleCustomApply = useCallback(() => {
    if (!customStart || !customEnd) return;
    setSelectedDuration('custom');
    setCustomRange({ start: customStart, end: customEnd });
    setIsCustomModalOpen(false);
  }, [customStart, customEnd]);

  const closeCustomModal = useCallback(() => {
    setIsCustomModalOpen(false);
  }, []);

  const resetDuration = useCallback(() => {
    setSelectedDuration(initialDuration);
    setCustomRange(null);
    setCustomStart('');
    setCustomEnd('');
  }, [initialDuration]);

  const isDefaultDuration =
    selectedDuration === initialDuration && !customRange;

  return {
    selectedDuration,
    dateRange,
    isDefaultDuration,
    handleDurationSelect,
    isCustomModalOpen,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    handleCustomApply,
    closeCustomModal,
    resetDuration,
  };
}

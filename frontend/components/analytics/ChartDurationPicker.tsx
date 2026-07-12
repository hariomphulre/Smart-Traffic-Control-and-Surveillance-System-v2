'use client';

import { useEffect, useRef, useState } from 'react';
import { FiFilter } from 'react-icons/fi';
import { FaRegClock } from 'react-icons/fa';

export const DURATION_OPTIONS = [
  '1 hr',
  '3 hr',
  '6 hr',
  '1d',
  '1 week',
  '1 month',
  '1 year',
  'all time',
  'custom duration',
] as const;

type ChartDurationPickerProps = {
  selectedDuration: string;
  onSelect: (duration: string) => void;
  /** Analytics chart header (clock + duration badge) */
  variant?: 'chart' | 'logs';
  /** Highlight logs interval button when a non-default range is selected */
  isActive?: boolean;
};

function isDurationSelected(selected: string, option: string) {
  if (option === 'custom duration') {
    return selected === 'custom duration' || selected === 'custom';
  }
  return selected === option;
}

const CLOSE_DELAY_MS = 200;

export function ChartDurationPicker({
  selectedDuration,
  onSelect,
  variant = 'chart',
  isActive = false,
}: ChartDurationPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayLabel =
    selectedDuration === 'custom' ? 'custom' : selectedDuration;

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('pointerdown', handlePointerDown);
    }
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  const handleSelect = (duration: string) => {
    onSelect(duration);
    setOpen(false);
  };

  const logsButtonClass = isActive
    ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
    : 'bg-[#f1f3f4] dark:bg-[#292A2D] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]';

  const durationBadgeClass =
    variant === 'logs'
      ? `ml-2 px-2 py-1 rounded-md text-xs capitalize shrink-0 ${
          isActive
            ? 'bg-[#202124]/20 dark:bg-[#060606] text-[#e8eaed]'
            : 'bg-[#060606] text-[#e8eaed]'
        }`
      : 'bg-[#060606] px-2 py-1 rounded-md text-sm capitalize';

  return (
    <div
      ref={containerRef}
      className={`relative ${open ? 'z-[500]' : 'z-40'}`}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={
          variant === 'logs'
            ? `px-4 py-[6.5px] text-sm font-medium transition-colors rounded flex items-center ${logsButtonClass}`
            : 'flex items-center gap-3.5 pl-3 rounded-md text-gray-400 hover:text-[#AECBFA] transition-colors'
        }
        aria-label="Select time range"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {variant === 'logs' && (
          <>
            <FiFilter className="inline mr-2 shrink-0" />
            <span className="shrink-0">Interval</span>
          </>
        )}
        <span className={durationBadgeClass}>{displayLabel}</span>
        {variant === 'chart' && (
          <FaRegClock
            className={`w-5 h-5 text-lg transition-colors ${
              open ? 'text-[#AECBFA]' : 'group-hover:text-[#AECBFA]'
            }`}
          />
        )}
      </button>

      {/* pt-1 bridges the gap so the pointer does not leave the hover target */}
      <div
        className={`absolute right-0 top-full pt-1 w-44 z-[500] transition-all duration-150 ${
          open
            ? 'opacity-100 visible pointer-events-auto'
            : 'opacity-0 invisible pointer-events-none'
        }`}
        role="listbox"
      >
        <ul className="py-1 text-sm text-gray-300 bg-[#1e1e1e] border border-gray-700 rounded-md shadow-xl">
          {DURATION_OPTIONS.map((duration) => (
            <li
              key={duration}
              role="option"
              aria-selected={isDurationSelected(selectedDuration, duration)}
              onClick={() => handleSelect(duration)}
              className={`px-4 py-2 cursor-pointer transition-colors hover:bg-[#303134] hover:text-white capitalize ${
                isDurationSelected(selectedDuration, duration)
                  ? 'bg-[#2a2b2f] text-white font-medium'
                  : ''
              }`}
            >
              {duration}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

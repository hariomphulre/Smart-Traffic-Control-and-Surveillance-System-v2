'use client';

import { useEffect, useRef, useState } from 'react';
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

  return (
    <div
      ref={containerRef}
      className="relative z-50"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3.5 pl-3 rounded-md text-gray-400 hover:text-[#AECBFA] transition-colors"
        aria-label="Select time range"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="bg-[#060606] px-2 py-1 rounded-md text-sm capitalize">
          {displayLabel}
        </span>
        <FaRegClock
          className={`w-5 h-5 text-lg transition-colors ${
            open ? 'text-[#AECBFA]' : 'group-hover:text-[#AECBFA]'
          }`}
        />
      </button>

      {/* pt-1 bridges the gap so the pointer does not leave the hover target */}
      <div
        className={`absolute right-0 top-full pt-1 w-44 transition-all duration-150 ${
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

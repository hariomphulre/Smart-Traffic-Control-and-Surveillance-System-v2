'use client';

import { useEffect, useRef, useState } from 'react';
import { FiFilter } from 'react-icons/fi';
import { FaCaretDown } from 'react-icons/fa';
import {
  LOG_VEHICLE_TYPE_OPTIONS,
  type LogVehicleTypeFilter,
} from '@/lib/logFilters';

type VehicleTypeFilterProps = {
  selected: Exclude<LogVehicleTypeFilter, 'All'>[];
  onToggle: (value: Exclude<LogVehicleTypeFilter, 'All'>) => void;
  onClear: () => void;
};

const CLOSE_DELAY_MS = 200;

export function VehicleTypeFilter({ selected, onToggle, onClear }: VehicleTypeFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = selected.length > 0;

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

  useEffect(() => () => clearCloseTimer(), []);

  const handleSelect = (value: LogVehicleTypeFilter) => {
    if (value === 'All') {
      onClear();
      setOpen(false);
      return;
    }

    onToggle(value);
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
        className={`px-4 py-2 text-sm font-medium transition-colors rounded flex items-center gap-2 ${
          isActive
            ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]'
            : 'bg-[#f1f3f4] dark:bg-[#292A2D] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#4d4e52]'
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <FiFilter className="inline shrink-0" />
        <span>
          {isActive
            ? selected.length === 1
              ? selected[0]
              : `${selected[0]} +${selected.length - 1}`
            : 'Vehicle Type'}
        </span>
        <FaCaretDown className="w-3 h-3 shrink-0 opacity-80" />
      </button>

      <div
        className={`absolute left-0 top-full pt-1 min-w-[11rem] transition-all duration-150 ${
          open
            ? 'opacity-100 visible pointer-events-auto'
            : 'opacity-0 invisible pointer-events-none'
        }`}
        role="listbox"
      >
        <ul className="py-1 text-sm text-gray-300 bg-[#1e1e1e] border border-gray-700 rounded-md shadow-xl">
          {LOG_VEHICLE_TYPE_OPTIONS.map((option) => {
            const isAllSelected = option === 'All' && selected.length === 0;
            const isSelected = option !== 'All' && selected.includes(option);

            return (
            <li
              key={option}
              role="option"
              aria-selected={isAllSelected || isSelected}
              onClick={() => handleSelect(option)}
              className={`px-4 py-2 cursor-pointer transition-colors hover:bg-[#303134] hover:text-white flex items-center justify-between gap-3 ${
                isAllSelected || isSelected
                  ? 'bg-[#2a2b2f] text-white font-medium'
                  : ''
              }`}
            >
              <span>{option}</span>
              {isAllSelected || isSelected ? (
                <span className="text-[#34a853] font-bold">✓</span>
              ) : null}
            </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

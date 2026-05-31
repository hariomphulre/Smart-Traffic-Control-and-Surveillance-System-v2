'use client';

import { FaTimes } from 'react-icons/fa';

type CustomDurationModalProps = {
  isOpen: boolean;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  onClose: () => void;
  onApply: () => void;
};

export function CustomDurationModal({
  isOpen,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  onClose,
  onApply,
}: CustomDurationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="bg-[#1e1e1e] border border-gray-700 p-5 rounded-lg shadow-2xl w-80">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-medium">Set Custom Time</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={customStart}
              onChange={(e) => onCustomStartChange(e.target.value)}
              className="w-full bg-[#131314] text-gray-200 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(e) => onCustomEndChange(e.target.value)}
              className="w-full bg-[#131314] text-gray-200 border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={!customStart || !customEnd}
            className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

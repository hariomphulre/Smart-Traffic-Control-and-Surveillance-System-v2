'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  destinationPoint,
  makeWayId,
  WAY_PALETTE,
} from '@/lib/intersectionAnalysis';
import { buildSquareLocationFromSignal } from '@/lib/buildSquareLocation';
import { MAP_SIGNALS } from '@/map/MapData';
import { getMapSignalsWithOverrides } from '@/map/signalCoordinateOverrides';
import {
  saveSquareLocation,
  type SquareLocation,
  type SquareWay,
} from '@/map/squareLocations';
import { MdEdit } from 'react-icons/md';
import { FiPlus, FiSave } from 'react-icons/fi';
import { BiError } from "react-icons/bi";
const EditableSquareMap = dynamic(() => import('./EditableSquareMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0a0f14] min-h-[280px]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin" />
        <p className="text-[#5f6368] text-xs font-mono">Loading map tiles…</p>
      </div>
    </div>
  ),
});

interface SquareLocationMapProps {
  square: SquareLocation | null;
  isLocked: boolean;
  loading?: boolean;
  error?: string | null;
  wayVehicleCounts?: Record<string, number>;
  onSquareSaved?: (square: SquareLocation) => void;
  onCoordinatesSaved?: (signalId: string, lat: number, lng: number) => void;
}

function MapDirectionOverlay() {
  const stroke = 'rgba(232, 234, 237, 0.72)';
  const accent = 'rgba(251, 188, 4, 0.95)';
  const labelFill = 'rgba(232, 234, 237, 0.92)';

  return (
    <div className="absolute top-3 right-3 z-20 pointer-events-none select-none">
      <svg
        viewBox="0 0 72 72"
        className="w-[72px] h-[72px]"
        aria-label="Map directions"
        role="img"
      >
        <line x1="36" y1="18" x2="36" y2="54" stroke={stroke} strokeWidth="1.25" strokeLinecap="round" />
        <line x1="18" y1="36" x2="54" y2="36" stroke={stroke} strokeWidth="1.25" strokeLinecap="round" />

        <polygon points="36,10 40,20 36,17 32,20" fill="#8AB4F8" stroke="none" />
        <polygon points="36,62 40,52 36,55 32,52" fill={stroke} stroke="none" />
        <polygon points="62,36 52,32 55,36 52,40" fill={stroke} stroke="none" />
        <polygon points="10,36 20,32 17,36 20,40" fill={stroke} stroke="none" />

        <text
          x="36"
          y="7"
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#8AB4F8"
          fontFamily="Roboto, system-ui, sans-serif"
        >
          N
        </text>
        <text
          x="36"
          y="69"
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill={labelFill}
          fontFamily="Roboto, system-ui, sans-serif"
        >
          S
        </text>
        <text
          x="67"
          y="39"
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill={labelFill}
          fontFamily="Roboto, system-ui, sans-serif"
        >
          E
        </text>
        <text
          x="5"
          y="39"
          textAnchor="middle"
          fontSize="9"
          fontWeight="600"
          fill={labelFill}
          fontFamily="Roboto, system-ui, sans-serif"
        >
          W
        </text>
      </svg>
    </div>
  );
}

function WayLegend({
  ways,
  isEditing,
  onRemoveWay,
}: {
  ways: SquareWay[];
  isEditing: boolean;
  onRemoveWay: (wayId: string) => void;
}) {
  return (
    <div className="flex w-99% flex-wrap justify-end gap-1">
      {ways.map((way) => (
        <span
          key={way.id}
          className={`inline-flex items-center rounded-full text-xs gap-1 font-medium text-gray-100 
            ${isEditing ? `bg-[#1a202c] border border-[#4a5568] px-2 py-0.5` : `px-1`}
          `}
        >
          <span
            className="w-4.5 h-1.5 mr-1 rounded shrink-0"
            style={{ backgroundColor: way.color }}
          />
          <span className="font-mono">{way.id}</span>
          {isEditing && ways.length > 1 && (
            <button
              type="button"
              onClick={() => onRemoveWay(way.id)}
              className="pb-0.5 text-[#9aa0a6] text-[15px] hover:text-[#f28b82] leading-none"
              aria-label={`Remove ${way.id}`}
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

function MapPlaceholder({
  isLocked,
  notFound,
  loading,
  error,
}: {
  isLocked?: boolean;
  notFound?: boolean;
  loading?: boolean;
  error?: string | null;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-100 min-h-[400px] bg-[#131314] px-8 text-center">
      {loading ? (
        <>
          <div className="w-10 h-10 border-2 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin mb-4" />
          <p className="text-[#9aa0a6] text-sm font-medium mb-1">Loading Square Map...</p>
        </>
      ) : (
        <>
          <div className="h-full">
            <BiError className="text-[#5f6368] h-10 w-10 justify-self-center"></BiError>
            <p className="text-[#5f6368] text-sm max-w-[260px]">
              {error
                ? error
                : notFound
                  ? 'Signal not found in location data'
                  : isLocked
                    ? 'Waiting for intersection data…'
                    : 'Complete the location path to view the square map'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function cloneSquare(square: SquareLocation): SquareLocation {
  return {
    ...square,
    path: [...square.path],
    intersectionBounds: square.intersectionBounds.map(([lat, lng]) => [lat, lng]),
    ways: square.ways.map((way) => ({
      ...way,
      coordinates: way.coordinates.map(([lat, lng]) => [lat, lng]),
      labelPosition: [...way.labelPosition] as [number, number],
    })),
    cardinalLabels: { ...square.cardinalLabels },
  };
}

function rebuildDraft(square: SquareLocation): SquareLocation {
  const signal = getMapSignalsWithOverrides(MAP_SIGNALS).find((s) => s.id === square.signalId);
  if (!signal) return square;

  return buildSquareLocationFromSignal(signal, square.lat, square.lng, square.ways, {
    isSaved: square.isSaved,
    snapped: square.snapped,
  });
}

export default function SquareLocationMap({
  square,
  isLocked,
  loading,
  error,
  wayVehicleCounts,
  onSquareSaved,
  onCoordinatesSaved,
}: SquareLocationMapProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<SquareLocation | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setIsEditing(false);
    setDraft(null);
    setIsDirty(false);
    setSaveError(null);
  }, [square?.signalId]);

  const displaySquare = isEditing && draft ? draft : square;

  const startEditing = useCallback(() => {
    if (!square) return;
    setDraft(cloneSquare(square));
    setIsDirty(false);
    setSaveError(null);
    setIsEditing(true);
  }, [square]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setDraft(null);
    setIsDirty(false);
    setSaveError(null);
  }, []);

  const updateDraft = useCallback((updater: (current: SquareLocation) => SquareLocation) => {
    setDraft((current) => {
      if (!current) return current;
      return rebuildDraft(updater(current));
    });
    setIsDirty(true);
  }, []);

  const handleWayDragEnd = useCallback(
    (wayId: string, lat: number, lng: number) => {
      updateDraft((current) => ({
        ...current,
        ways: current.ways.map((way) =>
          way.id === wayId
            ? {
                ...way,
                coordinates: [
                  [current.lat, current.lng],
                  [lat, lng],
                ],
              }
            : way,
        ),
      }));
    },
    [updateDraft],
  );

  const handleCenterDragEnd = useCallback(
    (lat: number, lng: number) => {
      updateDraft((current) => ({
        ...current,
        lat,
        lng,
        ways: current.ways.map((way) => {
          const end = way.coordinates[way.coordinates.length - 1] ?? [lat, lng];
          return {
            ...way,
            coordinates: [[lat, lng], end],
          };
        }),
      }));
    },
    [updateDraft],
  );

  const handleAddWay = useCallback(() => {
    updateDraft((current) => {
      if (current.ways.length >= 8) return current;

      const index = current.ways.length;
      const bearing = (360 / (index + 1)) * index;
      const end = destinationPoint(current.lat, current.lng, bearing, 70);
      const newWay: SquareWay = {
        id: makeWayId(index),
        bearing,
        coordinates: [[current.lat, current.lng], end],
        labelPosition: end,
        color: WAY_PALETTE[index % WAY_PALETTE.length],
      };

      return {
        ...current,
        ways: [...current.ways, newWay],
      };
    });
  }, [updateDraft]);

  const handleRemoveWay = useCallback(
    (wayId: string) => {
      updateDraft((current) => {
        if (current.ways.length <= 1) return current;
        const filtered = current.ways.filter((way) => way.id !== wayId);
        const renumbered = filtered.map((way, index) => ({
          ...way,
          id: makeWayId(index),
          color: WAY_PALETTE[index % WAY_PALETTE.length],
        }));
        return {
          ...current,
          ways: renumbered,
        };
      });
    },
    [updateDraft],
  );

  const handleSave = useCallback(async () => {
    if (!draft) return;

    setSaving(true);
    setSaveError(null);

    try {
      const saved = await saveSquareLocation({
        signalId: draft.signalId,
        lat: draft.lat,
        lng: draft.lng,
        ways: draft.ways,
      });
      onCoordinatesSaved?.(saved.signalId, saved.lat, saved.lng);
      onSquareSaved?.(saved);
      setIsEditing(false);
      setDraft(null);
      setIsDirty(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [draft, onSquareSaved, onCoordinatesSaved]);

  const editHint = useMemo(() => {
    if (!isEditing) return null;
    return 'Drag the circle node to fix position.';
  }, [isEditing]);

  if (!isLocked || loading || !displaySquare) {
    return (
      <div className="w-full flex flex-col bg-[#131314]">
        <MapPlaceholder
          isLocked={isLocked}
          notFound={isLocked && !loading && !square && !error}
          loading={loading}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-100 bg-[#131314] overflow-hidden relative z-10 isolate">
      <div className="relative z-30 flex justify-between items-start pl-4 pr-3 pt-2 pb-2 shrink-0 gap-3 bg-[#131314]">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-medium text-gray-200 tracking-wide">Square Map</h2>

            <div className="flex items-center gap-2 flex-wrap">
              {!isEditing ? (
                <div
                  className="group flex items-center gap-1 px-1 justify-center hover:bg-[#202124] rounded-sm transition-all cursor-pointer"
                  onClick={startEditing}
                >
                  <MdEdit className="h-3.5 w-3.5 text-[#669DF6] group-hover:text-[#AECBFA]" />
                  <button
                    type="button"
                    className="py-0.5 text-[13px] font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="group flex items-center gap-1 px-1 py-[1px] justify-center hover:bg-[#202124] rounded-sm transition-all cursor-pointer"
                    onClick={handleAddWay}
                  >
                    <FiPlus className="h-4 w-4 text-[#669DF6] group-hover:text-[#AECBFA]" />
                    <button
                      type="button"
                      className="py-0.5 text-[13px] font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg"
                      disabled={displaySquare.ways.length >= 6}
                    >
                      Add way
                    </button>
                  </div>
                  <div
                    className="group flex items-center gap-1 px-1 py-[2px] justify-center hover:bg-[#202124] rounded-sm transition-all cursor-pointer"
                    onClick={cancelEditing}
                  >
                    <svg className="group-hover:text-[#AECBFA] w-4 h-4 text-[#669DF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <button
                      type="button"
                      className="pr-0.5 text-[13px] font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg"
                    >
                      Cancel
                    </button>
                  </div>
                  {isDirty && (
                    <div
                      className={`group flex items-center gap-1 px-1 py-[1px] justify-center hover:bg-[#202124] rounded-sm transition-all ${saving ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={saving ? undefined : handleSave}
                    >
                      <FiSave className="h-3.5 w-3.5 text-[#669DF6] group-hover:text-[#AECBFA]" />
                      <button
                        type="button"
                        disabled={saving}
                        className="py-0.5 text-[13px] font-medium transition-all text-[#669DF6] group-hover:text-[#AECBFA] shadow-lg disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <p className="text-[12px] text-[#5f6368] font-mono truncate">
            {displaySquare.name} · {displaySquare.signalId} · {displaySquare.wayCount} way
            {displaySquare.wayCount !== 1 ? 's' : ''}
            {isEditing ? ' · Editing' : ''}
          </p>

          {editHint && (
            <p className="text-[12px] text-[#fbbc04] font-mono">{editHint}</p>
          )}
          {saveError && (
            <p className="text-[10px] text-[#f28b82] font-mono">{saveError}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-[12px] font-mono text-[#AECBFA] bg-[#060606] px-2 py-1 rounded">
            {displaySquare.lat.toFixed(5)}°, {displaySquare.lng.toFixed(5)}°
          </span>

          <WayLegend
            ways={displaySquare.ways}
            isEditing={isEditing}
            onRemoveWay={handleRemoveWay}
          />
        </div>
      </div>

      <div className="relative z-0 flex-1 mx-0 mb-0 min-h-[280px] overflow-hidden border border-[#2d3748]/60 shadow-inner isolate">
        <MapDirectionOverlay />
        <EditableSquareMap
          square={displaySquare}
          isEditing={isEditing}
          wayVehicleCounts={wayVehicleCounts}
          onWayDragEnd={handleWayDragEnd}
          onCenterDragEnd={handleCenterDragEnd}
        />
      </div>
    </div>
  );
}

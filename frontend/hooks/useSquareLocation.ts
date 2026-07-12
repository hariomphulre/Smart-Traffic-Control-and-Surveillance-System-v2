'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocationFilter } from '@/context/LocationFilterContext';
import { MAP_SIGNALS } from '@/map/MapData';
import {
  hydrateSignalCoordinateOverrides,
  setClientSignalCoordinate,
  getMapSignalsWithOverrides,
} from '@/map/signalCoordinateOverrides';
import {
  getSignalIdFromPath,
  getAnalyticsWays,
  getWayLabels,
  resolveSquareLocation,
  type AnalyticsWay,
  type SquareLocation,
  type WayLabels,
} from '@/map/squareLocations';

export function useSquareLocation() {
  const { pathSegments, isLocked } = useLocationFilter();
  const [square, setSquare] = useState<SquareLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordsReady, setCoordsReady] = useState(false);
  const [mapSignals, setMapSignals] = useState(MAP_SIGNALS);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/signals/coordinates')
      .then((res) => (res.ok ? res.json() : {}))
      .then((overrides) => {
        if (cancelled) return;
        hydrateSignalCoordinateOverrides(overrides ?? {});
        setMapSignals(getMapSignalsWithOverrides(MAP_SIGNALS));
        setCoordsReady(true);
      })
      .catch(() => {
        if (!cancelled) setCoordsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSquare = useCallback((next: SquareLocation) => {
    setSquare(next);
    setError(null);
  }, []);

  const applySavedCoordinates = useCallback((signalId: string, lat: number, lng: number) => {
    setClientSignalCoordinate(signalId, lat, lng);
    setMapSignals(getMapSignalsWithOverrides(MAP_SIGNALS));
  }, []);

  useEffect(() => {
    if (!coordsReady || !isLocked || pathSegments.length < 4) {
      setSquare(null);
      setError(null);
      setLoading(false);
      return;
    }

    const signalId = getSignalIdFromPath(pathSegments);
    if (!signalId) {
      setSquare(null);
      setError('Signal not found');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    resolveSquareLocation(pathSegments)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setSquare(null);
          setError('Could not analyze intersection');
        } else {
          setSquare(result);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setSquare(null);
        setError(err instanceof Error ? err.message : 'Analysis failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [coordsReady, isLocked, pathSegments]);

  const wayLabels: WayLabels = getWayLabels(square);
  const analyticsWays: AnalyticsWay[] = getAnalyticsWays(square);

  return {
    pathSegments,
    isLocked,
    square,
    wayLabels,
    analyticsWays,
    loading,
    error,
    updateSquare,
    applySavedCoordinates,
    mapSignals,
    showSquareMap: isLocked && (loading || square !== null),
  };
}

export type UseSquareLocationReturn = ReturnType<typeof useSquareLocation>;

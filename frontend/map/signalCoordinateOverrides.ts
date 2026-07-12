import type { MapSignal } from './MapData';

type CoordinateOverride = { lat: number; lng: number };

let clientOverrides: Record<string, CoordinateOverride> = {};

export function hydrateSignalCoordinateOverrides(
  overrides: Record<string, CoordinateOverride>,
): void {
  clientOverrides = { ...overrides };
}

export function setClientSignalCoordinate(signalId: string, lat: number, lng: number): void {
  clientOverrides[signalId] = { lat, lng };
}

export function getClientCoordinateOverrides(): Record<string, CoordinateOverride> {
  return { ...clientOverrides };
}

export function getMapSignalsWithOverrides(base: MapSignal[]): MapSignal[] {
  return base.map((signal) => {
    const override = clientOverrides[signal.id];
    return override ? { ...signal, lat: override.lat, lng: override.lng } : signal;
  });
}

export function getSignalWithOverride(signal: MapSignal | null | undefined): MapSignal | null {
  if (!signal) return null;
  const override = clientOverrides[signal.id];
  return override ? { ...signal, lat: override.lat, lng: override.lng } : signal;
}

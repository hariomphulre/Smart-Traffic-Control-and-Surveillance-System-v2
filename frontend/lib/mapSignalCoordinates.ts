import { promises as fs } from 'fs';
import path from 'path';
import type { MapSignal } from '@/map/MapData';

export interface SignalCoordinate {
  lat: number;
  lng: number;
  updatedAt: string;
}

type CoordinateStore = Record<string, SignalCoordinate>;

const COORDS_FILE = path.join(process.cwd(), 'data', 'signal-coordinates.json');
const MAP_DATA_FILE = path.join(process.cwd(), 'map', 'MapData.ts');

function roundCoord(value: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

async function readStore(): Promise<CoordinateStore> {
  try {
    const raw = await fs.readFile(COORDS_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as CoordinateStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: CoordinateStore): Promise<void> {
  await fs.mkdir(path.dirname(COORDS_FILE), { recursive: true });
  await fs.writeFile(COORDS_FILE, `${JSON.stringify(store, null, 2)}\n`, 'utf-8');
}

export async function readCoordinateOverrides(): Promise<CoordinateStore> {
  return readStore();
}

export function mergeSignalCoordinates(
  signals: MapSignal[],
  overrides: CoordinateStore,
): MapSignal[] {
  return signals.map((signal) => {
    const override = overrides[signal.id];
    if (!override) return signal;
    return { ...signal, lat: override.lat, lng: override.lng };
  });
}

export async function getSignalWithCoordinates(
  signalId: string,
  baseSignals: MapSignal[],
): Promise<MapSignal | null> {
  const base = baseSignals.find((signal) => signal.id === signalId);
  if (!base) return null;

  const overrides = await readStore();
  const override = overrides[signalId];
  if (!override) return base;

  return { ...base, lat: override.lat, lng: override.lng };
}

/** Persist coordinate override and patch MapData.ts source file */
export async function saveSignalCoordinates(
  signalId: string,
  lat: number,
  lng: number,
): Promise<SignalCoordinate> {
  const roundedLat = roundCoord(lat);
  const roundedLng = roundCoord(lng);

  const entry: SignalCoordinate = {
    lat: roundedLat,
    lng: roundedLng,
    updatedAt: new Date().toISOString(),
  };

  const store = await readStore();
  store[signalId] = entry;
  await writeStore(store);

  await patchMapDataFile(signalId, roundedLat, roundedLng);

  return entry;
}

async function patchMapDataFile(
  signalId: string,
  lat: number,
  lng: number,
): Promise<boolean> {
  const escapedId = signalId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(\\{\\s*id:\\s*"${escapedId}"[\\s\\S]*?lat:\\s*)([\\d.]+)(\\s*,\\s*lng:\\s*)([\\d.]+)`,
  );

  let content: string;
  try {
    content = await fs.readFile(MAP_DATA_FILE, 'utf-8');
  } catch {
    return false;
  }

  if (!pattern.test(content)) return false;

  content = content.replace(pattern, `$1${lat}$3${lng}`);
  await fs.writeFile(MAP_DATA_FILE, content, 'utf-8');
  return true;
}

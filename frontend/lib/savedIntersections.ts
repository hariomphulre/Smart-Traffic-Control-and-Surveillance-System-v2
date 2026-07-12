import { promises as fs } from 'fs';
import path from 'path';
import type { LatLng } from '@/map/squareLocations';

export interface SavedSquareWay {
  id: string;
  bearing: number;
  coordinates: LatLng[];
  color: string;
}

export interface SavedIntersection {
  signalId: string;
  lat: number;
  lng: number;
  ways: SavedSquareWay[];
  updatedAt: string;
}

type SavedIntersectionStore = Record<string, SavedIntersection>;

const DATA_FILE = path.join(process.cwd(), 'data', 'saved-intersections.json');

async function readStore(): Promise<SavedIntersectionStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as SavedIntersectionStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: SavedIntersectionStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, 'utf-8');
}

export async function getSavedIntersection(signalId: string): Promise<SavedIntersection | null> {
  const store = await readStore();
  return store[signalId] ?? null;
}

export async function saveIntersection(data: SavedIntersection): Promise<SavedIntersection> {
  const store = await readStore();
  const entry: SavedIntersection = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  store[data.signalId] = entry;
  await writeStore(store);
  return entry;
}

export async function deleteSavedIntersection(signalId: string): Promise<boolean> {
  const store = await readStore();
  if (!store[signalId]) return false;
  delete store[signalId];
  await writeStore(store);
  return true;
}

export async function listSavedIntersections(): Promise<string[]> {
  const store = await readStore();
  return Object.keys(store);
}

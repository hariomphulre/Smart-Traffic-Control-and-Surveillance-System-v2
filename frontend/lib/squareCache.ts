import type { SquareLocation } from '@/map/squareLocations';

const memoryCache = new Map<string, SquareLocation>();

export function getSquareCache(signalId: string): SquareLocation | undefined {
  return memoryCache.get(signalId);
}

export function setSquareCache(signalId: string, square: SquareLocation): void {
  memoryCache.set(signalId, square);
}

export function invalidateSquareCache(signalId: string): void {
  memoryCache.delete(signalId);
}

export function clearSquareCache(): void {
  memoryCache.clear();
}

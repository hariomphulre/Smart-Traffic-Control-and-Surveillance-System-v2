import type { LatLng } from './squareLocations';

/**
 * Manual corrections when OSM topology is ambiguous (slip lanes, complex junctions).
 * Add entries after reviewing `/api/intersection/analyze?signalId=...` output.
 *
 * To curate: open the signal in OpenStreetMap or Google Maps, count road legs,
 * then set center + bearing (° clockwise from north) for each approach.
 */
export interface IntersectionOverrideWay {
  bearing: number;
  /** Optional road name shown in debug tooling */
  name?: string;
}

export interface IntersectionOverride {
  center?: LatLng;
  ways: IntersectionOverrideWay[];
}

export const INTERSECTION_OVERRIDES: Record<string, IntersectionOverride> = {
  // Example:
  // AAG1: {
  //   center: [16.30658, 80.43643],
  //   ways: [
  //     { bearing: 14, name: 'Arundelpet Road' },
  //     { bearing: 90, name: 'Brodipet Main' },
  //     { bearing: 186, name: 'South approach' },
  //     { bearing: 270, name: 'West approach' },
  //   ],
  // },
};

export function getIntersectionOverride(signalId: string): IntersectionOverride | null {
  return INTERSECTION_OVERRIDES[signalId] ?? null;
}

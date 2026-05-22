/**
 * Fire stations and traffic signals for fire brigade routing.
 * Signals map to junctions; each signal has a lane (1-4) for traffic.json.
 */
export interface FireStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  capacity: number;
  vehicles: number;
}

export interface TrafficSignal {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lane: 1 | 2 | 3 | 4; // maps to lanes in traffic.json
}

export const FIRE_STATIONS: FireStation[] = [
  {
    id: 'fs1',
    name: 'Central Fire Station',
    lat: 28.6139,
    lng: 77.2090,
    address: 'MG Road, New Delhi',
    capacity: 8,
    vehicles: 6,
  },
  {
    id: 'fs2',
    name: 'East Delhi Fire Station',
    lat: 28.6500,
    lng: 77.2500,
    address: 'East Delhi',
    capacity: 6,
    vehicles: 5,
  },
  {
    id: 'fs3',
    name: 'West Delhi Fire Station',
    lat: 28.6100,
    lng: 77.1700,
    address: 'West Delhi',
    capacity: 7,
    vehicles: 5,
  },
  {
    id: 'fs4',
    name: 'South Delhi Fire Station',
    lat: 28.5300,
    lng: 77.2000,
    address: 'South Delhi',
    capacity: 6,
    vehicles: 4,
  },
  {
    id: 'fs5',
    name: 'North Delhi Fire Station',
    lat: 28.7000,
    lng: 77.2200,
    address: 'North Delhi',
    capacity: 5,
    vehicles: 3,
  },
  {
    id: 'fs6',
    name: 'Airport Fire Station',
    lat: 28.5562,
    lng: 77.0999,
    address: 'Near Indira Gandhi International Airport',
    capacity: 10,
    vehicles: 8,
  },
];

export const TRAFFIC_SIGNALS: TrafficSignal[] = [
  { id: 's1', name: 'MG Road Junction', lat: 28.6139, lng: 77.2090, lane: 1 },
  { id: 's2', name: 'Connaught Place', lat: 28.6315, lng: 77.2167, lane: 2 },
  { id: 's3', name: 'NH-8 Toll Plaza', lat: 28.5033, lng: 77.0886, lane: 3 },
  { id: 's4', name: 'Airport Road', lat: 28.5562, lng: 77.0999, lane: 4 },
  { id: 's5', name: 'Railway Station Chowk', lat: 28.6432, lng: 77.2201, lane: 1 },
  { id: 's6', name: 'Civil Lines', lat: 28.6795, lng: 77.2290, lane: 2 },
  { id: 's7', name: 'Sadar Bazaar', lat: 28.6577, lng: 77.1964, lane: 3 },
  { id: 's8', name: 'Bus Stand', lat: 28.6272, lng: 77.2190, lane: 4 },
  { id: 's9', name: 'Industrial Area Gate 4', lat: 28.5832, lng: 77.3210, lane: 1 },
  { id: 's10', name: 'Gurgaon Toll', lat: 28.4744, lng: 77.0266, lane: 2 },
  { id: 's11', name: 'Lajpat Nagar', lat: 28.5647, lng: 77.2430, lane: 3 },
  { id: 's12', name: 'Karol Bagh', lat: 28.6514, lng: 77.1907, lane: 4 },
  { id: 's13', name: 'Nehru Place', lat: 28.5477, lng: 77.2519, lane: 1 },
  { id: 's14', name: 'Rajpath', lat: 28.6129, lng: 77.2295, lane: 2 },
];

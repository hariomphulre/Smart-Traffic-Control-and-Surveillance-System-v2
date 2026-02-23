/**
 * Hospitals and traffic signals for ambulance routing.
 * Signals map to junctions; each signal has a lane (1-4) for traffic.json A1-A4.
 */
export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

export interface TrafficSignal {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lane: 1 | 2 | 3 | 4; // maps to A1, A2, A3, A4 in traffic.json
}

export const HOSPITALS: Hospital[] = [
  { id: 'h1', name: 'AIIMS Delhi', lat: 28.5672, lng: 77.2100, address: 'Ansari Nagar, New Delhi' },
  { id: 'h2', name: 'Safdarjung Hospital', lat: 28.5676, lng: 77.2052, address: 'Palam, New Delhi' },
  { id: 'h3', name: 'Ram Manohar Lohia Hospital', lat: 28.6314, lng: 77.2167, address: 'Baba Kharak Singh Marg' },
  { id: 'h4', name: 'Max Super Speciality Hospital', lat: 28.5020, lng: 77.0936, address: 'Saket, New Delhi' },
  { id: 'h5', name: 'Apollo Hospital', lat: 28.5477, lng: 77.2456, address: 'Sarita Vihar, New Delhi' },
  { id: 'h6', name: 'Fortis Escorts Heart Institute', lat: 28.5647, lng: 77.2430, address: 'Okhla, New Delhi' },
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

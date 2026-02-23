import axiosInstance from './axiosInstance';

// ── Types ────────────────────────────────────────────────────────────────────────
export interface Log {
  id: string;
  dateTime: string;
  location: string;
  licenseNo: string;
  vehicleType: string;
  speed: number;
  helmetStatus: boolean | 'N/A';
  redLightCross: boolean;
  tripling: boolean;
}

export interface LogsResponse {
  data: Log[];
  total: number;
  page: number;
  limit: number;
}

export interface Challan {
  id: string;
  dateTime: string;
  location: string;
  licenseNo: string;
  vehicleType: string;
  violationType: string;
  fineAmount: number;
  status: 'pending' | 'received' | 'rejected';
  penaltyAmount: number;
  paymentDate?: string;
}

export interface ChallansResponse {
  data: Challan[];
  total: number;
  page: number;
  limit: number;
}

export interface ChallanStats {
  pending: number;
  received: number;
  rejected: number;
  totalFines: number;
  collectedFines: number;
}

export interface Accident {
  id: string;
  location: string;
  dateTime: string;
  description: string;
  vehiclesInvolved: Array<{
    licenseNo: string;
    speed: number;
    vehicleType: string;
  }>;
  severity: 'low' | 'medium' | 'high';
  hasRecording?: boolean;
}

export interface AccidentsResponse {
  data: Accident[];
  total: number;
  page: number;
  limit: number;
}

export interface AccidentStats {
  total: number;
  high: number;
  medium: number;
  low: number;
}

export interface VehicleImage {
  id: number;
  vehicleId: string;
  licenseNo: string;
  vehicleType: string;
  timestamp: string;
  imagePath: string;
  licensePlatePath: string;
}

export interface VehicleImagesResponse {
  data: VehicleImage[];
  total: number;
  page: number;
  limit: number;
}

export interface AccidentMedia {
  id: string;
  location: string;
  timestamp: string;
  type: 'video' | 'image';
  path: string;
  duration?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AccidentMediaResponse {
  data: AccidentMedia[];
  total: number;
  page: number;
  limit: number;
}

export interface Violation {
  name: string;
  count: number;
}

export interface VehicleType {
  name: string;
  count: number;
}

export interface HourlyTraffic {
  hour: string;
  vehicles: number;
  violations: number;
}

export interface SpeedDistribution {
  range: string;
  count: number;
}

export interface Hotspot {
  name: string;
  violations: number;
  lat: number;
  lng: number;
  severity: 'high' | 'medium' | 'low';
}

export interface AnalyticsStats {
  totalVehicles: number;
  totalViolations: number;
  helmetless: number;
  tripling: number;
  redLightCross: number;
}

// ── API Functions ────────────────────────────────────────────────────────────────

// Logs
export const getLogs = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  speeding?: boolean;
  helmetless?: boolean;
  redLight?: boolean;
  tripling?: boolean;
}): Promise<LogsResponse> => {
  const response = await axiosInstance.get('/api/logs', { params });
  return response.data;
};

// Challans
export const getChallans = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ChallansResponse> => {
  const response = await axiosInstance.get('/api/challans', { params });
  return response.data;
};

export const getChallanStats = async (): Promise<ChallanStats> => {
  const response = await axiosInstance.get('/api/challans/stats');
  return response.data;
};

// Accidents
export const getAccidents = async (params?: {
  page?: number;
  limit?: number;
  severity?: string;
}): Promise<AccidentsResponse> => {
  const response = await axiosInstance.get('/api/accidents', { params });
  return response.data;
};

export const getAccidentStats = async (): Promise<AccidentStats> => {
  const response = await axiosInstance.get('/api/accidents/stats');
  return response.data;
};

// Images
export const getVehicleImages = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<VehicleImagesResponse> => {
  const response = await axiosInstance.get('/api/images/vehicles', { params });
  return response.data;
};

export const getAccidentMedia = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AccidentMediaResponse> => {
  const response = await axiosInstance.get('/api/images/accidents', { params });
  return response.data;
};

// Analytics (backend returns { data: [...] } for these endpoints)
export const getViolations = async (): Promise<Violation[]> => {
  const response = await axiosInstance.get('/api/analytics/violations');
  return response.data?.data ?? [];
};

export const getVehicleTypes = async (): Promise<VehicleType[]> => {
  const response = await axiosInstance.get('/api/analytics/vehicle-types');
  return response.data?.data ?? [];
};

export const getHourlyTraffic = async (): Promise<HourlyTraffic[]> => {
  const response = await axiosInstance.get('/api/analytics/hourly-traffic');
  return response.data?.data ?? [];
};

export const getSpeedDistribution = async (): Promise<SpeedDistribution[]> => {
  const response = await axiosInstance.get('/api/analytics/speed-distribution');
  return response.data?.data ?? [];
};

export const getStats = async (): Promise<AnalyticsStats> => {
  const response = await axiosInstance.get('/api/analytics/stats');
  return response.data;
};

export const getHotspots = async (): Promise<Hotspot[]> => {
  const response = await axiosInstance.get('/api/analytics/hotspots');
  return response.data?.data ?? [];
};

// ── Ambulance ─────────────────────────────────────────────────────────────

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
  lane: number;
}

export const getHospitals = async (): Promise<Hospital[]> => {
  const response = await axiosInstance.get('/api/ambulance/hospitals');
  return response.data?.data ?? [];
};

export const getSignals = async (): Promise<TrafficSignal[]> => {
  const response = await axiosInstance.get('/api/ambulance/signals');
  return response.data?.data ?? [];
};

export const triggerSignal = async (signalId: string): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.post('/api/ambulance/trigger-signal', { signalId });
  return response.data;
};

// ── Image Path Helper ────────────────────────────────────────────────────────
// Convert database image paths to frontend upload URLs
export const getImageUrl = (path: string): string => {
  if (!path) return '';
  
  // If path contains category folder names, extract and use them
  const categories = ['all_vehicle_detected_img', 'all_license_plate_img', 'new_sort_license_plate_img'];
  
  for (const category of categories) {
    if (path.includes(category)) {
      const parts = path.split('/');
      const categoryIdx = parts.findIndex(p => p.includes(category));
      if (categoryIdx !== -1 && categoryIdx + 1 < parts.length) {
        return `/uploads/${parts[categoryIdx]}/${parts[categoryIdx + 1]}`;
      }
    }
  }
  
  // Fallback: prepend /uploads/
  return `/uploads/${path}`;
};

// ── Signal Simulation ─────────────────────────────────────────────────────

export interface TrafficState {
  [key: string]: boolean | number;
}

export const getTrafficState = async (): Promise<TrafficState> => {
  const response = await axiosInstance.get('/api/signals/state');
  return response.data ?? {};
};

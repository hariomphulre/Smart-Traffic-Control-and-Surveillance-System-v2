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
  location: string | null;
  licenseNo: string;
  vehicleType: string | null;
  violationType: string;
  fineAmount: number;
  status: 'pending' | 'received' | 'rejected';
  penaltyAmount: number;
  paymentDate: string | null;
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
  description: string | null;
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
  duration: string | null;
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
  from?: string;
  to?: string;
  vehicleType?: string;
}): Promise<LogsResponse> => {
  const finalParams = {
    page: params?.page ?? 1,
    limit: Math.min(params?.limit ?? 20, 100),
    ...params,
  };
  const response = await axiosInstance.get('/api/logs', { params: finalParams });
  return response.data;
};

// Challans
export const getChallans = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ChallansResponse> => {
  const finalParams = {
    page: params?.page ?? 1,
    limit: Math.min(params?.limit ?? 20, 100),
    ...params,
  };
  const response = await axiosInstance.get('/api/challans', { params: finalParams });
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
  const finalParams = {
    page: params?.page ?? 1,
    limit: Math.min(params?.limit ?? 20, 100),
    ...params,
  };
  const response = await axiosInstance.get('/api/accidents', { params: finalParams });
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
  const finalParams = {
    page: params?.page ?? 1,
    limit: Math.min(params?.limit ?? 20, 100),
    ...params,
  };
  const response = await axiosInstance.get('/api/images/vehicles', { params: finalParams });
  return response.data;
};

export const getAccidentMedia = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AccidentMediaResponse> => {
  const finalParams = {
    page: params?.page ?? 1,
    limit: Math.min(params?.limit ?? 20, 100),
    ...params,
  };
  const response = await axiosInstance.get('/api/images/accidents', { params: finalParams });
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

// ── Fire Brigade ─────────────────────────────────────────────────────────

export interface FireStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  capacity: number;
  vehicles: number;
}

export const getFireStations = async (): Promise<FireStation[]> => {
  const response = await axiosInstance.get('/api/fire-brigade/fire-stations');
  return response.data?.data ?? [];
};

export const getFireBrigadeSignals = async (): Promise<TrafficSignal[]> => {
  const response = await axiosInstance.get('/api/fire-brigade/signals');
  return response.data?.data ?? [];
};

export const triggerFireBrigadeSignal = async (signalId: string): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.post('/api/fire-brigade/trigger-signal', { signalId });
  return response.data;
};

export const overrideSignalWithinRadius = async (
  signalId: string,
  vehicleLocation: { lat: number; lng: number }
): Promise<{ success: boolean; message: string; distance: string }> => {
  const response = await axiosInstance.post('/api/fire-brigade/override-signal', {
    signalId,
    vehicleLocation,
  });
  return response.data;
};

// ── Image Path Helper ────────────────────────────────────────────────────────
// Images are served from frontend/public/uploads (populated by backend seed scripts)
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';

  const normalized = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.startsWith('uploads/')) {
    return `/${normalized}`;
  }

  const categories = [
    'all_vehicle_detected_img',
    'all_license_plate_img',
    'new_sort_license_plate_img',
  ];

  for (const category of categories) {
    if (normalized.includes(category)) {
      const parts = normalized.split('/');
      const categoryIdx = parts.findIndex((p) => p.includes(category));
      if (categoryIdx !== -1 && categoryIdx + 1 < parts.length) {
        return `/uploads/${parts[categoryIdx]}/${parts[categoryIdx + 1]}`;
      }
    }
  }

  return `/uploads/${normalized}`;
};

// ── Signal Simulation ─────────────────────────────────────────────────────

export interface TrafficState {
  [key: string]: boolean | number;
}

export const getTrafficState = async (): Promise<TrafficState> => {
  const response = await axiosInstance.get('/api/signals/state');
  return response.data ?? {};
};

// ─── Vehicle Types ────────────────────────────────────────────────────────────

export type VehicleType = 'Car' | 'Bike' | 'Truck' | 'Bus' | 'Auto';
export type RcStatus    = 'Active' | 'Suspended' | 'Expired';

export interface VehicleRc {
  registration_number: string;
  owner_name:          string | null;
  vehicle_type:        VehicleType | null;
  make:                string | null;
  model:               string | null;
  year:                number | null;
  color:               string | null;
  fuel_type:           string | null;
  chassis_number:      string | null;
  engine_number:       string | null;
  rc_status:           RcStatus;
  registered_at:       Date;
}

// ─── Vehicle Logs ─────────────────────────────────────────────────────────────

export interface VehicleLogRow {
  log_id:          number;
  license_no:      string;
  vehicle_type:    VehicleType;
  location:        string;
  speed:           number;
  helmet_status:   boolean | null;   // null for non-bikes
  red_light_cross: boolean;
  tripling:        boolean;
  detected_at:     Date;
}

export interface VehicleLogResponse {
  id:            string;            // "VEH-000001"
  dateTime:      Date;
  location:      string;
  licenseNo:     string;
  vehicleType:   VehicleType;
  speed:         number;
  helmetStatus:  boolean | 'N/A';
  redLightCross: boolean;
  tripling:      boolean;
}

// ─── Challans ─────────────────────────────────────────────────────────────────

export type ViolationType  = 'No Helmet' | 'Triple Riding' | 'Red Light Violation' | 'Over Speeding';
export type ChallanStatus  = 'pending' | 'received' | 'rejected';

export interface ChallanRow {
  challan_id:          number;
  registration_number: string;
  challan_number:      string;
  violation_type:      ViolationType;
  violation_description: string | null;
  fine_amount:         string;       // pg returns numeric as string
  penalty_amount:      string;
  penalty_points:      number;
  challan_status:      ChallanStatus;
  location:            string | null;
  officer_name:        string | null;
  issue_date:          Date;
  due_date:            Date | null;
  payment_date:        Date | null;
  payment_mode:        string | null;
  created_at:          Date;
  vehicle_type?:       VehicleType;  // joined from vehicle_rc_details
}

export interface ChallanResponse {
  id:            string;            // "CH-000001"
  dateTime:      Date;
  location:      string | null;
  licenseNo:     string;
  vehicleType:   VehicleType | null;
  violationType: ViolationType;
  fineAmount:    number;
  penaltyAmount: number;
  status:        ChallanStatus;
  paymentDate:   Date | null;
}

export interface ChallanStats {
  pending:        number;
  received:       number;
  rejected:       number;
  totalFines:     number;
  collectedFines: number;
}

// ─── Accidents ────────────────────────────────────────────────────────────────

export type Severity = 'low' | 'medium' | 'high';

export interface AccidentVehicle {
  licenseNo:   string;
  speed:       number;
  vehicleType: string;
}

export interface AccidentRow {
  accident_id:   number;
  location:      string;
  description:   string | null;
  severity:      Severity;
  has_recording: boolean;
  occurred_at:   Date;
  vehicles_involved: AccidentVehicle[] | null;
}

export interface AccidentResponse {
  id:               string;         // "ACC-0001"
  location:         string;
  dateTime:         Date;
  description:      string | null;
  severity:         Severity;
  hasRecording:     boolean;
  vehiclesInvolved: AccidentVehicle[];
}

export interface AccidentStats {
  high:   number;
  medium: number;
  low:    number;
  total:  number;
}

// ─── Images ───────────────────────────────────────────────────────────────────

export interface VehicleImageRow {
  image_id:           number;
  log_id:             number;
  license_no:         string;
  vehicle_type:       VehicleType;
  image_path:         string;
  license_plate_path: string;
  captured_at:        Date;
}

export interface VehicleImageResponse {
  id:               number;
  vehicleId:        string;         // "VEH-000001"
  licenseNo:        string;
  vehicleType:      VehicleType;
  timestamp:        Date;
  imagePath:        string;
  licensePlatePath: string;
}

export type MediaType = 'image' | 'video';

export interface AccidentMediaRow {
  media_id:    number;
  accident_id: number;
  location:    string;
  media_type:  MediaType;
  file_path:   string;
  duration:    string | null;
  severity:    Severity;
  recorded_at: Date;
}

export interface AccidentMediaResponse {
  id:        string;                // "ACC-0001"
  location:  string;
  timestamp: Date;
  type:      MediaType;
  path:      string;
  duration:  string | null;
  severity:  Severity;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface NameCount {
  name:  string;
  count: number;
}

export interface HourlyTraffic {
  hour:       string;
  vehicles:   number;
  violations: number;
}

export interface SpeedRange {
  range: string;
  count: number;
}

export interface AnalyticsStats {
  totalVehicles:   number;
  totalViolations: number;
  trend:           number;
}

export interface Hotspot {
  name:       string;
  violations: number;
  lat:        number;
  lng:        number;
  severity:   Severity;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}

export interface PaginationQuery {
  page?:  string | number;
  limit?: string | number;
}

// ─── Error ────────────────────────────────────────────────────────────────────

export interface ApiError {
  error: {
    code:    string;
    message: string;
    details: string[];
  };
}
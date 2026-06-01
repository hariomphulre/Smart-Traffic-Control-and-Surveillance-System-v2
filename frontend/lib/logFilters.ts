export const LOG_VEHICLE_TYPE_OPTIONS = [
  'All',
  'Car',
  'Bike',
  'Auto',
  'Bus',
  'Truck',
  'Ambulance',
  'Fire brigade',
] as const;

export type LogVehicleTypeFilter =
  (typeof LOG_VEHICLE_TYPE_OPTIONS)[number];

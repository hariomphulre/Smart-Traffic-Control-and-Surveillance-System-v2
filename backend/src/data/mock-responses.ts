/** Demo data used when the database is unreachable in development */

const MOCK_LOGS = [
  { id: 'VEH-000001', dateTime: new Date(Date.now() - 3600000).toISOString(), location: 'MG Road Junction', licenseNo: 'DL-01-AB-1234', vehicleType: 'Car', speed: 65, helmetStatus: 'N/A' as const, redLightCross: false, tripling: false },
  { id: 'VEH-000002', dateTime: new Date(Date.now() - 7200000).toISOString(), location: 'Connaught Place', licenseNo: 'MH-12-CD-5678', vehicleType: 'Bike', speed: 45, helmetStatus: false, redLightCross: true, tripling: false },
  { id: 'VEH-000003', dateTime: new Date(Date.now() - 10800000).toISOString(), location: 'NH-8 Toll Plaza', licenseNo: 'KA-03-EF-9012', vehicleType: 'Truck', speed: 80, helmetStatus: 'N/A' as const, redLightCross: false, tripling: false },
  { id: 'VEH-000004', dateTime: new Date(Date.now() - 14400000).toISOString(), location: 'Airport Road', licenseNo: 'TN-07-GH-3456', vehicleType: 'Bus', speed: 55, helmetStatus: 'N/A' as const, redLightCross: true, tripling: false },
  { id: 'VEH-000005', dateTime: new Date(Date.now() - 18000000).toISOString(), location: 'Sadar Bazaar', licenseNo: 'RJ-14-MN-6789', vehicleType: 'Bike', speed: 40, helmetStatus: true, redLightCross: false, tripling: true },
];

const MOCK_CHALLANS = [
  { id: 'CH-000001', dateTime: new Date(Date.now() - 432000000).toISOString(), location: 'MG Road Junction', licenseNo: 'DL-01-AB-1234', vehicleType: 'Car', violationType: 'Over Speeding', fineAmount: 2000, status: 'pending' as const, penaltyAmount: 0, paymentDate: null },
  { id: 'CH-000002', dateTime: new Date(Date.now() - 864000000).toISOString(), location: 'Connaught Place', licenseNo: 'MH-12-CD-5678', vehicleType: 'Bike', violationType: 'No Helmet', fineAmount: 500, status: 'received' as const, penaltyAmount: 0, paymentDate: new Date(Date.now() - 172800000).toISOString() },
  { id: 'CH-000003', dateTime: new Date(Date.now() - 259200000).toISOString(), location: 'NH-8 Toll Plaza', licenseNo: 'KA-03-EF-9012', vehicleType: 'Truck', violationType: 'Red Light Violation', fineAmount: 1000, status: 'pending' as const, penaltyAmount: 0, paymentDate: null },
];

const MOCK_ACCIDENTS = [
  { id: 'ACC-0001', location: 'MG Road Junction', dateTime: new Date(Date.now() - 172800000).toISOString(), description: '2-vehicle collision. Emergency services dispatched.', vehiclesInvolved: [{ licenseNo: 'DL-01-AB-1234', speed: 65, vehicleType: 'Car' }], severity: 'high' as const, hasRecording: true },
  { id: 'ACC-0002', location: 'NH-8 Toll Plaza', dateTime: new Date(Date.now() - 345600000).toISOString(), description: 'Minor rear-end collision.', vehiclesInvolved: [{ licenseNo: 'KA-03-EF-9012', speed: 80, vehicleType: 'Truck' }], severity: 'low' as const, hasRecording: false },
  { id: 'ACC-0003', location: 'Airport Road', dateTime: new Date(Date.now() - 518400000).toISOString(), description: 'Bus and car collision.', vehiclesInvolved: [{ licenseNo: 'TN-07-GH-3456', speed: 55, vehicleType: 'Bus' }], severity: 'medium' as const, hasRecording: true },
];

function paginate<T>(items: T[], page: number, limit: number) {
  const offset = (page - 1) * limit;
  return {
    data: items.slice(offset, offset + limit),
    total: items.length,
    page,
    limit,
  };
}

function parsePageLimit(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20));
  return { page, limit };
}

export function getMockResponse(pathname: string, searchParams: URLSearchParams): unknown | null {
  const { page, limit } = parsePageLimit(searchParams);

  if (pathname === '/api/analytics/stats') {
    return {
      totalVehicles: 15,
      totalViolations: 8,
      helmetless: 3,
      tripling: 2,
      redLightCross: 3,
    };
  }

  if (pathname === '/api/analytics/violations') {
    return {
      data: [
        { name: 'Helmet-less', count: 3 },
        { name: 'Tripling', count: 2 },
        { name: 'Red Light', count: 3 },
        { name: 'Over Speed', count: 4 },
      ],
    };
  }

  if (pathname === '/api/analytics/vehicle-types') {
    return {
      data: [
        { name: 'Car', count: 4 },
        { name: 'Bike', count: 5 },
        { name: 'Truck', count: 3 },
        { name: 'Bus', count: 2 },
        { name: 'Auto', count: 1 },
      ],
    };
  }

  if (pathname === '/api/analytics/hourly-traffic') {
    return {
      data: Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, '0')}:00`,
        vehicles: 20 + Math.floor(Math.random() * 30),
        violations: 2 + Math.floor(Math.random() * 8),
      })),
    };
  }

  if (pathname === '/api/analytics/speed-distribution') {
    return {
      data: [
        { range: '0-40', count: 4 },
        { range: '41-60', count: 5 },
        { range: '61-80', count: 4 },
        { range: '81-100', count: 2 },
        { range: '100+', count: 0 },
      ],
    };
  }

  if (pathname === '/api/analytics/hotspots') {
    return {
      data: [
        { name: 'MG Road Junction', violations: 12, lat: 28.6139, lng: 77.209, severity: 'high' as const },
        { name: 'Connaught Place', violations: 8, lat: 28.6315, lng: 77.2167, severity: 'medium' as const },
        { name: 'NH-8 Toll Plaza', violations: 5, lat: 28.5033, lng: 77.0886, severity: 'low' as const },
      ],
    };
  }

  if (pathname === '/api/logs') return paginate(MOCK_LOGS, page, limit);
  if (pathname === '/api/challans') return paginate(MOCK_CHALLANS, page, limit);
  if (pathname === '/api/challans/stats') {
    return { pending: 2, received: 1, rejected: 0, totalFines: 3500, collectedFines: 500 };
  }
  if (pathname === '/api/accidents') return paginate(MOCK_ACCIDENTS, page, limit);
  if (pathname === '/api/accidents/stats') {
    return { total: 3, high: 1, medium: 1, low: 1 };
  }
  if (pathname === '/api/images/vehicles' || pathname === '/api/images/accidents') {
    return { data: [], total: 0, page, limit };
  }

  if (pathname === '/api/ambulance/hospitals') {
    return {
      data: [
        { id: 'h1', name: 'City General Hospital', lat: 28.6139, lng: 77.209, address: 'MG Road' },
        { id: 'h2', name: 'Apollo Emergency', lat: 28.6315, lng: 77.2167, address: 'Connaught Place' },
      ],
    };
  }

  if (pathname === '/api/ambulance/signals') {
    return {
      data: [
        { id: 's1', name: 'Signal A1', lat: 28.6139, lng: 77.209, lane: 1 },
        { id: 's2', name: 'Signal A2', lat: 28.62, lng: 77.215, lane: 2 },
      ],
    };
  }

  if (pathname === '/api/signals/state') {
    return { R1: true, R2: true, R3: true, R4: true, G1: false, G2: false, G3: false, G4: false };
  }

  return null;
}

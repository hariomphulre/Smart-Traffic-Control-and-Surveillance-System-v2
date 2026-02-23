import pool from '../config/db';
import {
  NameCount,
  HourlyTraffic,
  SpeedRange,
  AnalyticsStats,
  Hotspot,
  Severity,
} from '../types';

interface DateRangeQuery {
  from?: string;
  to?:   string;
}

// Build a WHERE clause from optional date range
function buildDateFilter(
  from: string | undefined,
  to:   string | undefined,
  col:  string,
  startIdx: number
): { clause: string; values: string[]; nextIdx: number } {
  const conditions: string[] = [];
  const values: string[]     = [];
  let idx = startIdx;

  if (from) { conditions.push(`${col} >= $${idx++}`); values.push(from); }
  if (to)   { conditions.push(`${col} <= $${idx++}`); values.push(to); }

  return {
    clause:  conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
    nextIdx: idx,
  };
}

// Static GPS coordinates for known locations
const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  'MG Road Junction':       { lat: 28.6139, lng: 77.2090 },
  'Connaught Place':        { lat: 28.6315, lng: 77.2167 },
  'NH-8 Toll Plaza':        { lat: 28.5033, lng: 77.0886 },
  'Airport Road':           { lat: 28.5562, lng: 77.0999 },
  'Railway Station Chowk':  { lat: 28.6432, lng: 77.2201 },
  'Civil Lines':            { lat: 28.6795, lng: 77.2290 },
  'Sadar Bazaar':           { lat: 28.6577, lng: 77.1964 },
  'Bus Stand':              { lat: 28.6272, lng: 77.2190 },
  'Industrial Area Gate 4': { lat: 28.5832, lng: 77.3210 },
  'Gurgaon Toll':           { lat: 28.4744, lng: 77.0266 },
  'Lajpat Nagar':           { lat: 28.5647, lng: 77.2430 },
  'Karol Bagh':             { lat: 28.6514, lng: 77.1907 },
  'Nehru Place':            { lat: 28.5477, lng: 77.2519 },
  'Rajpath':                { lat: 28.6129, lng: 77.2295 },
};

export class AnalyticsModel {
  // GET /analytics/violations
  static async getViolations(query: DateRangeQuery): Promise<{ data: NameCount[] }> {
    const { clause, values } = buildDateFilter(query.from, query.to, 'detected_at', 1);

    interface Row {
      'Helmet-less': string;
      'Tripling':    string;
      'Red Light':   string;
      'Over Speed':  string;
    }

    const { rows } = await pool.query<Row>(`
      SELECT
        SUM(CASE WHEN vehicle_type = 'Bike' AND helmet_status = FALSE THEN 1 ELSE 0 END) AS "Helmet-less",
        SUM(CASE WHEN vehicle_type = 'Bike' AND tripling = TRUE        THEN 1 ELSE 0 END) AS "Tripling",
        SUM(CASE WHEN red_light_cross = TRUE                            THEN 1 ELSE 0 END) AS "Red Light",
        SUM(CASE WHEN speed > 60                                        THEN 1 ELSE 0 END) AS "Over Speed"
      FROM vehicle_logs ${clause}
    `, values);

    const r = rows[0];
    return {
      data: [
        { name: 'Helmet-less', count: parseInt(r['Helmet-less'] ?? '0') },
        { name: 'Tripling',    count: parseInt(r['Tripling']    ?? '0') },
        { name: 'Red Light',   count: parseInt(r['Red Light']   ?? '0') },
        { name: 'Over Speed',  count: parseInt(r['Over Speed']  ?? '0') },
      ],
    };
  }

  // GET /analytics/vehicle-types
  static async getVehicleTypes(query: DateRangeQuery): Promise<{ data: NameCount[] }> {
    const { clause, values } = buildDateFilter(query.from, query.to, 'detected_at', 1);

    const { rows } = await pool.query<{ name: string; count: string }>(
      `SELECT vehicle_type AS name, COUNT(*) AS count
       FROM vehicle_logs ${clause}
       GROUP BY vehicle_type
       ORDER BY count DESC`,
      values
    );

    return { data: rows.map((r) => ({ name: r.name, count: parseInt(r.count) })) };
  }

  // GET /analytics/hourly-traffic
  static async getHourlyTraffic(query: DateRangeQuery): Promise<{ data: HourlyTraffic[] }> {
    const { clause, values } = buildDateFilter(query.from, query.to, 'detected_at', 1);

    const { rows } = await pool.query<{ hour: string; vehicles: string; violations: string }>(
      `SELECT
         TO_CHAR(DATE_TRUNC('hour', detected_at), 'HH24:MI') AS hour,
         COUNT(*) AS vehicles,
         SUM(CASE
           WHEN speed > 60
             OR (vehicle_type = 'Bike' AND helmet_status = FALSE)
             OR red_light_cross = TRUE
             OR (vehicle_type = 'Bike' AND tripling = TRUE)
           THEN 1 ELSE 0
         END) AS violations
       FROM vehicle_logs ${clause}
       GROUP BY DATE_TRUNC('hour', detected_at)
       ORDER BY DATE_TRUNC('hour', detected_at)`,
      values
    );

    return {
      data: rows.map((r) => ({
        hour:       r.hour,
        vehicles:   parseInt(r.vehicles),
        violations: parseInt(r.violations),
      })),
    };
  }

  // GET /analytics/speed-distribution
  static async getSpeedDistribution(query: DateRangeQuery): Promise<{ data: SpeedRange[] }> {
    const { clause, values } = buildDateFilter(query.from, query.to, 'detected_at', 1);

    interface SpeedRow {
      '0-20':   string;
      '21-40':  string;
      '41-60':  string;
      '61-80':  string;
      '81-100': string;
      '100+':   string;
    }

    const { rows } = await pool.query<SpeedRow>(
      `SELECT
         SUM(CASE WHEN speed BETWEEN 0  AND 20  THEN 1 ELSE 0 END) AS "0-20",
         SUM(CASE WHEN speed BETWEEN 21 AND 40  THEN 1 ELSE 0 END) AS "21-40",
         SUM(CASE WHEN speed BETWEEN 41 AND 60  THEN 1 ELSE 0 END) AS "41-60",
         SUM(CASE WHEN speed BETWEEN 61 AND 80  THEN 1 ELSE 0 END) AS "61-80",
         SUM(CASE WHEN speed BETWEEN 81 AND 100 THEN 1 ELSE 0 END) AS "81-100",
         SUM(CASE WHEN speed > 100              THEN 1 ELSE 0 END) AS "100+"
       FROM vehicle_logs ${clause}`,
      values
    );

    const r = rows[0];
    return {
      data: [
        { range: '0-20',   count: parseInt(r['0-20']   ?? '0') },
        { range: '21-40',  count: parseInt(r['21-40']  ?? '0') },
        { range: '41-60',  count: parseInt(r['41-60']  ?? '0') },
        { range: '61-80',  count: parseInt(r['61-80']  ?? '0') },
        { range: '81-100', count: parseInt(r['81-100'] ?? '0') },
        { range: '100+',   count: parseInt(r['100+']   ?? '0') },
      ],
    };
  }

  // GET /analytics/stats
  static async getStats(): Promise<AnalyticsStats> {
    const [totalResult, violationResult] = await Promise.all([
      pool.query<{ total: string }>(`SELECT COUNT(*) AS total FROM vehicle_logs`),
      pool.query<{ v: string }>(`
        SELECT COUNT(*) AS v FROM vehicle_logs
        WHERE speed > 60
           OR (vehicle_type = 'Bike' AND helmet_status = FALSE)
           OR red_light_cross = TRUE
           OR (vehicle_type = 'Bike' AND tripling = TRUE)
      `),
    ]);

    return {
      totalVehicles:   parseInt(totalResult.rows[0].total),
      totalViolations: parseInt(violationResult.rows[0].v),
      trend:           12, // Replace with real period-comparison logic
    };
  }

  // GET /analytics/hotspots
  static async getHotspots(query: DateRangeQuery): Promise<{ data: Hotspot[] }> {
    const { clause, values } = buildDateFilter(query.from, query.to, 'detected_at', 1);

    const violationFilter = `speed > 60
        OR (vehicle_type = 'Bike' AND helmet_status = FALSE)
        OR red_light_cross = TRUE
        OR (vehicle_type = 'Bike' AND tripling = TRUE)`;

    const whereClause = clause
      ? `${clause} AND (${violationFilter})`
      : `WHERE (${violationFilter})`;

    const { rows } = await pool.query<{ location: string; violations: string; severity: Severity }>(
      `SELECT
         location,
         COUNT(*) AS violations,
         CASE
           WHEN COUNT(*) > 10 THEN 'high'
           WHEN COUNT(*) > 4  THEN 'medium'
           ELSE 'low'
         END AS severity
       FROM vehicle_logs
       ${whereClause}
       GROUP BY location
       ORDER BY violations DESC`,
      values
    );

    return {
      data: rows.map((r) => ({
        name:       r.location,
        violations: parseInt(r.violations),
        lat:        LOCATION_COORDS[r.location]?.lat ?? 28.6139,
        lng:        LOCATION_COORDS[r.location]?.lng ?? 77.2090,
        severity:   r.severity,
      })),
    };
  }
}
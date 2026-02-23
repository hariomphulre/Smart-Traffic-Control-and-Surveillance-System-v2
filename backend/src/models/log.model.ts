import pool from '../config/db';
import {
  VehicleLogRow,
  VehicleLogResponse,
  PaginatedResponse,
  PaginationQuery,
} from '../types';

// Pad log_id to "VEH-000001"
const formatId = (n: number): string => `VEH-${String(n).padStart(6, '0')}`;

interface LogQuery extends PaginationQuery {
  search?:     string;
  speeding?:   string;
  helmetless?: string;
  redLight?:   string;
  tripling?:   string;
}

export class LogModel {
  static async getAll(query: LogQuery): Promise<PaginatedResponse<VehicleLogResponse>> {
    const limit  = Math.min(parseInt(String(query.limit ?? 20)), 100);
    const page   = parseInt(String(query.page ?? 1));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[]    = [];
    let idx = 1;

    if (query.search) {
      conditions.push(`(
        LPAD(log_id::text, 6, '0') ILIKE $${idx}
        OR license_no   ILIKE $${idx}
        OR location     ILIKE $${idx}
        OR vehicle_type ILIKE $${idx}
      )`);
      values.push(`%${query.search}%`);
      idx++;
    }
    if (query.speeding === 'true')   conditions.push(`speed > 60`);
    if (query.helmetless === 'true') conditions.push(`vehicle_type = 'Bike' AND helmet_status = FALSE`);
    if (query.redLight === 'true')   conditions.push(`red_light_cross = TRUE`);
    if (query.tripling === 'true')   conditions.push(`vehicle_type = 'Bike' AND tripling = TRUE`);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      pool.query<VehicleLogRow>(
        `SELECT * FROM vehicle_logs ${where}
         ORDER BY detected_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...values, limit, offset]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM vehicle_logs ${where}`,
        values
      ),
    ]);

    return {
      data: dataResult.rows.map((r) => ({
        id:            formatId(r.log_id),
        dateTime:      r.detected_at,
        location:      r.location,
        licenseNo:     r.license_no,
        vehicleType:   r.vehicle_type,
        speed:         parseFloat(String(r.speed)),
        helmetStatus:  r.vehicle_type === 'Bike' ? r.helmet_status as boolean : 'N/A',
        redLightCross: r.red_light_cross,
        tripling:      r.tripling,
      })),
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }
}
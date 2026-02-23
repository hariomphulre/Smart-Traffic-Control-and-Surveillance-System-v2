import pool from '../config/db';
import {
  VehicleImageRow,
  VehicleImageResponse,
  AccidentMediaRow,
  AccidentMediaResponse,
  PaginatedResponse,
  PaginationQuery,
} from '../types';

const fmtVehId = (n: number): string => `VEH-${String(n).padStart(6, '0')}`;
const fmtAccId = (n: number): string => `ACC-${String(n).padStart(4, '0')}`;

interface SearchQuery extends PaginationQuery {
  search?: string;
}

export class ImagesModel {
  static async getVehicleImages(query: SearchQuery): Promise<PaginatedResponse<VehicleImageResponse>> {
    const limit  = Math.min(parseInt(String(query.limit ?? 20)), 100);
    const page   = parseInt(String(query.page ?? 1));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[]    = [];
    let idx = 1;

    if (query.search) {
      conditions.push(`(
        LPAD(vi.log_id::text, 6, '0') ILIKE $${idx}
        OR vi.license_no   ILIKE $${idx}
        OR vi.vehicle_type ILIKE $${idx}
      )`);
      values.push(`%${query.search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      pool.query<VehicleImageRow>(
        `SELECT * FROM vehicle_images vi ${where}
         ORDER BY captured_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...values, limit, offset]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM vehicle_images vi ${where}`,
        values
      ),
    ]);

    return {
      data: dataResult.rows.map((r) => ({
        id:               r.image_id,
        vehicleId:        fmtVehId(r.log_id),
        licenseNo:        r.license_no,
        vehicleType:      r.vehicle_type,
        timestamp:        r.captured_at,
        imagePath:        r.image_path,
        licensePlatePath: r.license_plate_path,
      })),
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }

  static async getAccidentMedia(query: SearchQuery): Promise<PaginatedResponse<AccidentMediaResponse>> {
    const limit  = Math.min(parseInt(String(query.limit ?? 20)), 100);
    const page   = parseInt(String(query.page ?? 1));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[]    = [];
    let idx = 1;

    if (query.search) {
      conditions.push(`(
        LPAD(am.accident_id::text, 4, '0') ILIKE $${idx}
        OR am.location ILIKE $${idx}
        OR am.severity ILIKE $${idx}
      )`);
      values.push(`%${query.search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      pool.query<AccidentMediaRow>(
        `SELECT * FROM accident_media am ${where}
         ORDER BY recorded_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...values, limit, offset]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM accident_media am ${where}`,
        values
      ),
    ]);

    return {
      data: dataResult.rows.map((r) => ({
        id:        fmtAccId(r.accident_id),
        location:  r.location,
        timestamp: r.recorded_at,
        type:      r.media_type,
        path:      r.file_path,
        duration:  r.duration ?? null,
        severity:  r.severity,
      })),
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }
}
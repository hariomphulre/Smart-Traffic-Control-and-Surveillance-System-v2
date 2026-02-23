import pool from '../config/db';
import {
  AccidentRow,
  AccidentResponse,
  AccidentStats,
  Severity,
  PaginatedResponse,
  PaginationQuery,
} from '../types';

const formatId = (n: number): string => `ACC-${String(n).padStart(4, '0')}`;

interface AccidentQuery extends PaginationQuery {
  severity?: Severity;
}

export class AccidentModel {
  static async getAll(query: AccidentQuery): Promise<PaginatedResponse<AccidentResponse>> {
    const limit  = Math.min(parseInt(String(query.limit ?? 20)), 100);
    const page   = parseInt(String(query.page ?? 1));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[]    = [];
    let idx = 1;

    if (query.severity) {
      conditions.push(`a.severity = $${idx++}`);
      values.push(query.severity);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      pool.query<AccidentRow>(
        `SELECT
           a.*,
           JSON_AGG(
             JSON_BUILD_OBJECT(
               'licenseNo',   av.license_no,
               'speed',       av.speed,
               'vehicleType', av.vehicle_type
             ) ORDER BY av.id
           ) FILTER (WHERE av.id IS NOT NULL) AS vehicles_involved
         FROM accidents a
         LEFT JOIN accident_vehicles av ON a.accident_id = av.accident_id
         ${where}
         GROUP BY a.accident_id
         ORDER BY a.occurred_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...values, limit, offset]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM accidents a ${where}`,
        values
      ),
    ]);

    return {
      data: dataResult.rows.map((r) => ({
        id:               formatId(r.accident_id),
        location:         r.location,
        dateTime:         r.occurred_at,
        description:      r.description,
        severity:         r.severity,
        hasRecording:     r.has_recording,
        vehiclesInvolved: r.vehicles_involved ?? [],
      })),
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }

  static async getStats(): Promise<AccidentStats> {
    interface StatsRow {
      high:   string;
      medium: string;
      low:    string;
      total:  string;
    }

    const { rows } = await pool.query<StatsRow>(`
      SELECT
        SUM(CASE WHEN severity = 'high'   THEN 1 ELSE 0 END) AS high,
        SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) AS medium,
        SUM(CASE WHEN severity = 'low'    THEN 1 ELSE 0 END) AS low,
        COUNT(*) AS total
      FROM accidents
    `);

    const r = rows[0];
    return {
      high:   parseInt(r.high   ?? '0'),
      medium: parseInt(r.medium ?? '0'),
      low:    parseInt(r.low    ?? '0'),
      total:  parseInt(r.total  ?? '0'),
    };
  }
}
import pool from '../config/db';
import {
  ChallanRow,
  ChallanResponse,
  ChallanStats,
  ChallanStatus,
  PaginatedResponse,
  PaginationQuery,
} from '../types';

const formatId = (n: number): string => `CH-${String(n).padStart(6, '0')}`;

interface ChallanQuery extends PaginationQuery {
  search?: string;
  status?: ChallanStatus;
}

export class ChallanModel {
  static async getAll(query: ChallanQuery): Promise<PaginatedResponse<ChallanResponse>> {
    const limit  = Math.min(parseInt(String(query.limit ?? 20)), 100);
    const page   = parseInt(String(query.page ?? 1));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: unknown[]    = [];
    let idx = 1;

    if (query.search) {
      conditions.push(`(
        LPAD(c.challan_id::text, 6, '0') ILIKE $${idx}
        OR c.registration_number ILIKE $${idx}
        OR c.location            ILIKE $${idx}
        OR c.violation_type      ILIKE $${idx}
      )`);
      values.push(`%${query.search}%`);
      idx++;
    }
    if (query.status) {
      conditions.push(`c.challan_status = $${idx++}`);
      values.push(query.status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      pool.query<ChallanRow>(
        `SELECT c.*, v.vehicle_type
         FROM vehicle_challan_details c
         LEFT JOIN vehicle_rc_details v ON c.registration_number = v.registration_number
         ${where}
         ORDER BY c.created_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...values, limit, offset]
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM vehicle_challan_details c ${where}`,
        values
      ),
    ]);

    return {
      data: dataResult.rows.map((r) => ({
        id:            formatId(r.challan_id),
        dateTime:      r.created_at,
        location:      r.location,
        licenseNo:     r.registration_number,
        vehicleType:   r.vehicle_type ?? null,
        violationType: r.violation_type,
        fineAmount:    parseFloat(r.fine_amount),
        penaltyAmount: parseFloat(r.penalty_amount),
        status:        r.challan_status,
        paymentDate:   r.challan_status === 'received' ? r.payment_date : null,
      })),
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }

  static async getStats(): Promise<ChallanStats> {
    interface StatsRow {
      pending:        string;
      received:       string;
      rejected:       string;
      totalFines:     string;
      collectedFines: string;
    }

    const { rows } = await pool.query<StatsRow>(`
      SELECT
        SUM(CASE WHEN challan_status = 'pending'  THEN 1 ELSE 0 END)              AS "pending",
        SUM(CASE WHEN challan_status = 'received' THEN 1 ELSE 0 END)              AS "received",
        SUM(CASE WHEN challan_status = 'rejected' THEN 1 ELSE 0 END)              AS "rejected",
        SUM(fine_amount + COALESCE(penalty_amount, 0))                            AS "totalFines",
        SUM(CASE WHEN challan_status = 'received'
              THEN fine_amount + COALESCE(penalty_amount, 0) ELSE 0 END)          AS "collectedFines"
      FROM vehicle_challan_details
    `);

    const r = rows[0];
    return {
      pending:        parseInt(r.pending        ?? '0'),
      received:       parseInt(r.received       ?? '0'),
      rejected:       parseInt(r.rejected       ?? '0'),
      totalFines:     parseFloat(r.totalFines   ?? '0'),
      collectedFines: parseFloat(r.collectedFines ?? '0'),
    };
  }
}
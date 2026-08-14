import { randomUUID } from 'crypto';
import pool from '../config/db';

export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditChange {
  field: string;
  from: string | null;
  to: string | null;
}

export interface AuditLogRow {
  id: string;
  created_at: Date;
  user_id: string | null;
  username: string;
  roles: string[];
  origin: string;
  action: AuditAction;
  resource_type: string;
  resource_id: string | null;
  resource_label: string | null;
  changes: AuditChange[];
  ip_address: string | null;
}

export interface AuditLogResponse {
  id: string;
  sno: number;
  dateTime: string;
  username: string;
  roles: string[];
  origin: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  resourceLabel: string | null;
  changes: AuditChange[];
}

export interface AuditListFilter {
  from?: string | null;
  to?: string | null;
  state?: string | null;
  city?: string | null;
  squareId?: string | null;
  username?: string | null;
}

function parseTimestamp(value: Date | string): Date {
  if (value instanceof Date) return value;
  const raw = String(value);
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) return new Date(raw);
  return new Date(`${raw}Z`);
}

function parseChanges(raw: unknown): AuditChange[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({
      field: typeof item.field === 'string' ? item.field : 'Change',
      from: item.from == null ? null : String(item.from),
      to: item.to == null ? null : String(item.to),
    }));
}

function mapRow(row: AuditLogRow, index: number): AuditLogResponse {
  const createdAt = parseTimestamp(row.created_at);
  return {
    id: row.id,
    sno: index + 1,
    dateTime: createdAt.toISOString(),
    username: row.username,
    roles: Array.isArray(row.roles) ? row.roles : [],
    origin: row.origin || 'Unknown',
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    resourceLabel: row.resource_label,
    changes: parseChanges(row.changes),
  };
}

export class AuditModel {
  static async create(input: {
    userId?: string | null;
    username: string;
    roles: string[];
    origin: string;
    action: AuditAction;
    resourceType: string;
    resourceId?: string | null;
    resourceLabel?: string | null;
    changes: AuditChange[];
    ipAddress?: string | null;
  }): Promise<AuditLogRow> {
    const id = `aud_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
    const result = await pool.query<AuditLogRow>(
      `INSERT INTO audit_logs (
         id, user_id, username, roles, origin, action,
         resource_type, resource_id, resource_label, changes, ip_address
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
       RETURNING *`,
      [
        id,
        input.userId ?? null,
        input.username,
        input.roles,
        input.origin || 'Unknown',
        input.action,
        input.resourceType,
        input.resourceId ?? null,
        input.resourceLabel ?? null,
        JSON.stringify(input.changes ?? []),
        input.ipAddress ?? null,
      ]
    );
    return result.rows[0];
  }

  static async list(filter: AuditListFilter = {}): Promise<AuditLogResponse[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (filter.from) {
      clauses.push(`created_at >= $${i++}`);
      values.push(filter.from);
    }
    if (filter.to) {
      clauses.push(`created_at <= $${i++}`);
      values.push(filter.to);
    }
    if (filter.username) {
      clauses.push(`username ILIKE $${i++}`);
      values.push(`%${filter.username}%`);
    }

    if (filter.squareId) {
      clauses.push(`origin ILIKE $${i++}`);
      values.push(`%${filter.squareId}%`);
    } else if (filter.city) {
      clauses.push(`origin ILIKE $${i++}`);
      values.push(`%${[filter.state, filter.city].filter(Boolean).join('/')}%`);
    } else if (filter.state) {
      clauses.push(`origin ILIKE $${i++}`);
      values.push(`%${filter.state}%`);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await pool.query<AuditLogRow>(
      `SELECT * FROM audit_logs
       ${where}
       ORDER BY created_at DESC
       LIMIT 1000`,
      values
    );
    return result.rows.map(mapRow);
  }
}

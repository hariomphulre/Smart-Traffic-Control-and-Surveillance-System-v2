import pool from '../config/db';

export interface SessionRow {
  session_id: string;
  user_id: string;
  username: string;
  passkey_label: string | null;
  ip_address: string | null;
  location: string | null;
  login_at: Date;
  expires_at: Date;
  is_active: boolean;
}

export interface SessionResponse {
  sno: number;
  sessionId: string;
  loginTime: string;
  loginId: string;
  username: string;
  passkey: string;
  publicPasskey: string | null;
  location: string;
  duration: string;
}

function parseTimestamp(value: Date | string): Date {
  if (value instanceof Date) return value;
  const raw = String(value);
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) return new Date(raw);
  return new Date(`${raw}Z`);
}

function formatDuration(loginAt: Date | string): string {
  const loginDate = parseTimestamp(loginAt);
  const ms = Date.now() - loginDate.getTime();
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

type SessionListRow = SessionRow & {
  public_passkey: string | null;
};

function mapRow(row: SessionListRow, index: number): SessionResponse {
  const loginAt = parseTimestamp(row.login_at);
  const publicPasskey = row.public_passkey || null;
  return {
    sessionId: row.session_id,
    loginTime: loginAt.toISOString(),
    loginId: row.user_id,
    username: row.username,
    passkey: publicPasskey || row.passkey_label || 'Not set up',
    publicPasskey,
    location: row.location ?? 'Unknown',
    duration: formatDuration(loginAt),
    sno: index + 1,
  };
}

export class SessionModel {
  static async create(data: {
    sessionId: string;
    userId: string;
    username: string;
    passkeyLabel: string;
    ipAddress?: string;
    location?: string;
    expiresAt: Date;
  }): Promise<SessionRow> {
    const result = await pool.query<SessionRow>(
      `INSERT INTO user_sessions
         (session_id, user_id, username, passkey_label, ip_address, location, expires_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING *`,
      [
        data.sessionId,
        data.userId,
        data.username,
        data.passkeyLabel,
        data.ipAddress ?? null,
        data.location ?? 'Unknown',
        data.expiresAt,
      ]
    );
    return result.rows[0];
  }

  static async listActive(): Promise<SessionResponse[]> {
    // Live DB join — public passkey from passkeys table
    const result = await pool.query<SessionListRow>(
      `SELECT s.*,
              (
                SELECT p.public_key
                FROM passkeys p
                WHERE p.user_id = s.user_id
                ORDER BY p.created_at DESC
                LIMIT 1
              ) AS public_passkey
       FROM user_sessions s
       WHERE s.is_active = TRUE
       ORDER BY s.login_at DESC`
    );
    return result.rows.map(mapRow);
  }

  static async findActiveById(sessionId: string): Promise<SessionRow | null> {
    const result = await pool.query<SessionRow>(
      `SELECT * FROM user_sessions
       WHERE session_id = $1 AND is_active = TRUE
       LIMIT 1`,
      [sessionId]
    );
    return result.rows[0] ?? null;
  }

  /** Hard-delete session rows from DB. */
  static async deleteByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await pool.query(
      `DELETE FROM user_sessions
       WHERE session_id = ANY($1::varchar[])`,
      [ids]
    );
    return result.rowCount ?? 0;
  }
}

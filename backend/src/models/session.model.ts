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
         (session_id, user_id, username, passkey_label, ip_address, location, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
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
    const result = await pool.query<SessionRow>(
      `SELECT * FROM user_sessions
       WHERE is_active = TRUE AND expires_at > NOW()
       ORDER BY login_at DESC`
    );

    return result.rows.map((row, index) => {
      const loginAt = parseTimestamp(row.login_at);
      return {
        sessionId: row.session_id,
        loginTime: loginAt.toISOString(),
        loginId: row.user_id,
        username: row.username,
        passkey: row.passkey_label ?? 'Passkey',
        location: row.location ?? 'Unknown',
        duration: formatDuration(loginAt),
        sno: index + 1,
      };
    });
  }

  static async deactivate(sessionId: string): Promise<void> {
    await pool.query(`UPDATE user_sessions SET is_active = FALSE WHERE session_id = $1`, [
      sessionId,
    ]);
  }
}

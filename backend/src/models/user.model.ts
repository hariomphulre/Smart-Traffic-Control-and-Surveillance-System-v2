import pool from '../config/db';

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface IdentityResponse {
  id: string;
  username: string;
  role: string;
  passkeyCount: number;
  hasPasskey: boolean;
  createdAt: string;
}

export class UserModel {
  static async create(id: string, username: string, passwordHash: string, role = 'user'): Promise<UserRow> {
    const result = await pool.query<UserRow>(
      `INSERT INTO users (id, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, username, passwordHash, role]
    );
    return result.rows[0];
  }

  static async findById(id: string): Promise<UserRow | null> {
    const result = await pool.query<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
  }

  static async findByUsername(username: string): Promise<UserRow | null> {
    const result = await pool.query<UserRow>(`SELECT * FROM users WHERE username = $1`, [username]);
    return result.rows[0] ?? null;
  }

  static async listIdentities(): Promise<IdentityResponse[]> {
    const result = await pool.query<{
      id: string;
      username: string;
      role: string;
      created_at: Date;
      passkey_count: string;
    }>(
      `SELECT u.id, u.username, u.role, u.created_at,
              COUNT(p.id)::text AS passkey_count
       FROM users u
       LEFT JOIN passkeys p ON p.user_id = u.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    return result.rows.map((row) => {
      const passkeyCount = parseInt(row.passkey_count, 10) || 0;
      return {
        id: row.id,
        username: row.username,
        role: row.role,
        passkeyCount,
        hasPasskey: passkeyCount > 0,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      };
    });
  }
}

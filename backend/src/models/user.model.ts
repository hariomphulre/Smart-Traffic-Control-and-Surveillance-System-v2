import pool from '../config/db';

export type LocationScope = 'national' | 'state' | 'city' | 'square';

export interface UserLocation {
  scope: LocationScope;
  country: string;
  state: string | null;
  city: string | null;
  area: string | null;
  squareId: string | null;
  locationPath: string;
}

export interface UserRow {
  id: string;
  username: string;
  role: string;
  roles: string[];
  country: string;
  location_scope: LocationScope;
  state: string | null;
  city: string | null;
  area: string | null;
  square_id: string | null;
  location_path: string;
  created_at: Date;
  updated_at: Date;
}

export interface IdentityResponse {
  id: string;
  username: string;
  role: string;
  roles: string[];
  passkeyCount: number;
  hasPasskey: boolean;
  publicPasskey: string | null;
  createdAt: string;
  locationScope: LocationScope;
  country: string;
  state: string | null;
  city: string | null;
  area: string | null;
  squareId: string | null;
  locationPath: string;
  locationLabel: string;
}

export interface LocationFilter {
  scope?: LocationScope | null;
  state?: string | null;
  city?: string | null;
  squareId?: string | null;
}

function buildLocationPath(location: UserLocation): string {
  if (location.scope === 'national') return location.country || 'India';
  if (location.scope === 'state') return location.state || '';
  if (location.scope === 'city') {
    return [location.state, location.city].filter(Boolean).join('/');
  }
  return [location.state, location.city, location.area, location.squareId]
    .filter(Boolean)
    .join('/');
}

function locationLabel(row: {
  location_scope: LocationScope;
  country: string;
  state: string | null;
  city: string | null;
  area: string | null;
  square_id: string | null;
  location_path: string;
}): string {
  if (row.location_scope === 'national') return `${row.country} (National)`;
  if (row.location_scope === 'state') return `${row.state} (State)`;
  if (row.location_scope === 'city') return `${row.state} / ${row.city} (City)`;
  const area = row.area ? `${row.area} / ` : '';
  return `${row.state} / ${row.city} / ${area}${row.square_id}`;
}

function normalizeRoles(roles: string[] | null | undefined, role?: string | null): string[] {
  if (Array.isArray(roles) && roles.length > 0) {
    return roles.map((r) => String(r).trim()).filter(Boolean);
  }
  if (role && String(role).trim()) return [String(role).trim()];
  return ['User'];
}

function mapIdentity(row: {
  id: string;
  username: string;
  role: string;
  roles?: string[] | null;
  created_at: Date;
  passkey_count: string;
  public_passkey: string | null;
  country: string;
  location_scope: LocationScope;
  state: string | null;
  city: string | null;
  area: string | null;
  square_id: string | null;
  location_path: string;
}): IdentityResponse {
  const passkeyCount = parseInt(row.passkey_count, 10) || 0;
  const roles = normalizeRoles(row.roles, row.role);
  return {
    id: row.id,
    username: row.username,
    role: roles[0] || row.role || 'User',
    roles,
    passkeyCount,
    hasPasskey: passkeyCount > 0,
    publicPasskey: row.public_passkey || null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    locationScope: row.location_scope,
    country: row.country,
    state: row.state,
    city: row.city,
    area: row.area,
    squareId: row.square_id,
    locationPath: row.location_path,
    locationLabel: locationLabel(row),
  };
}

export class UserModel {
  static async create(
    id: string,
    username: string,
    location: UserLocation,
    roles: string[] | string = ['User']
  ): Promise<UserRow> {
    const locationPath = location.locationPath || buildLocationPath(location);
    const normalized = normalizeRoles(
      Array.isArray(roles) ? roles : undefined,
      typeof roles === 'string' ? roles : undefined
    );
    const primaryRole = normalized[0] || 'User';
    const result = await pool.query<UserRow>(
      `INSERT INTO users (
         id, username, role, roles, country, location_scope,
         state, city, area, square_id, location_path
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        username,
        primaryRole,
        normalized,
        location.country || 'India',
        location.scope,
        location.state,
        location.city,
        location.area,
        location.squareId,
        locationPath,
      ]
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

  static async listIdentities(filter: LocationFilter = {}): Promise<IdentityResponse[]> {
    // Show current level + children only (never parent-scoped identities).
    // square → that square only
    // city   → city-scoped + squares under that city
    // state  → state-scoped + cities/squares under that state
    // national → all India identities
    const clauses: string[] = [`u.country = 'India'`];
    const values: unknown[] = [];
    let i = 1;

    if (filter.squareId) {
      clauses.push(`u.location_scope = 'square' AND u.square_id = $${i}`);
      values.push(filter.squareId);
      i += 1;
    } else if (filter.city) {
      clauses.push(`(
        (u.location_scope = 'city' AND u.state = $${i} AND u.city = $${i + 1})
        OR (u.location_scope = 'square' AND u.state = $${i} AND u.city = $${i + 1})
      )`);
      values.push(filter.state, filter.city);
      i += 2;
    } else if (filter.state) {
      clauses.push(`(
        (u.location_scope = 'state' AND u.state = $${i})
        OR (u.location_scope IN ('city', 'square') AND u.state = $${i})
      )`);
      values.push(filter.state);
      i += 1;
    }

    const result = await pool.query<{
      id: string;
      username: string;
      role: string;
      roles: string[] | null;
      created_at: Date;
      passkey_count: string;
      public_passkey: string | null;
      country: string;
      location_scope: LocationScope;
      state: string | null;
      city: string | null;
      area: string | null;
      square_id: string | null;
      location_path: string;
    }>(
      `SELECT u.id, u.username, u.role, u.roles, u.created_at,
              u.country, u.location_scope, u.state, u.city, u.area, u.square_id, u.location_path,
              COUNT(p.id)::text AS passkey_count,
              (array_agg(p.public_key ORDER BY p.created_at DESC)
                FILTER (WHERE p.public_key IS NOT NULL))[1] AS public_passkey
       FROM users u
       LEFT JOIN passkeys p ON p.user_id = u.id
       WHERE ${clauses.join(' AND ')}
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      values
    );

    return result.rows.map(mapIdentity);
  }

  static async deleteByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await pool.query(
      `DELETE FROM users WHERE id = ANY($1::varchar[])`,
      [ids]
    );
    return result.rowCount ?? 0;
  }

  static async update(
    id: string,
    fields: {
      username?: string;
      roles?: string[];
      location?: UserLocation;
    }
  ): Promise<UserRow | null> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (fields.username !== undefined) {
      sets.push(`username = $${i++}`);
      values.push(fields.username);
    }
    if (fields.roles !== undefined) {
      const normalized = normalizeRoles(fields.roles);
      sets.push(`roles = $${i++}`);
      values.push(normalized);
      sets.push(`role = $${i++}`);
      values.push(normalized[0] || 'User');
    }
    if (fields.location) {
      const loc = fields.location;
      const locationPath = loc.locationPath || buildLocationPath(loc);
      sets.push(`country = $${i++}`);
      values.push(loc.country || 'India');
      sets.push(`location_scope = $${i++}`);
      values.push(loc.scope);
      sets.push(`state = $${i++}`);
      values.push(loc.state);
      sets.push(`city = $${i++}`);
      values.push(loc.city);
      sets.push(`area = $${i++}`);
      values.push(loc.area);
      sets.push(`square_id = $${i++}`);
      values.push(loc.squareId);
      sets.push(`location_path = $${i++}`);
      values.push(locationPath);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    sets.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query<UserRow>(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0] ?? null;
  }
}

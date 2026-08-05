import pool from '../config/db';
import type { LocationFilter, LocationScope, UserLocation } from './user.model';

export type RoleType = 'predefined' | 'custom';

export interface RoleRow {
  id: string;
  title: string;
  description: string;
  services: string[];
  role_type: RoleType;
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

export interface RoleResponse {
  id: string;
  title: string;
  description: string;
  services: string[];
  roleType: RoleType;
  locationScope: LocationScope;
  country: string;
  state: string | null;
  city: string | null;
  area: string | null;
  squareId: string | null;
  locationPath: string;
  locationLabel: string;
  createdAt: string;
  updatedAt: string;
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

function mapRole(row: RoleRow): RoleResponse {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    services: Array.isArray(row.services) ? row.services : [],
    roleType: row.role_type,
    locationScope: row.location_scope ?? 'national',
    country: row.country ?? 'India',
    state: row.state,
    city: row.city,
    area: row.area,
    squareId: row.square_id,
    locationPath: row.location_path || 'India',
    locationLabel: locationLabel({
      location_scope: row.location_scope ?? 'national',
      country: row.country ?? 'India',
      state: row.state,
      city: row.city,
      area: row.area,
      square_id: row.square_id,
      location_path: row.location_path || 'India',
    }),
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

const INDIA_NATIONAL: UserLocation = {
  scope: 'national',
  country: 'India',
  state: null,
  city: null,
  area: null,
  squareId: null,
  locationPath: 'India',
};

const PREDEFINED_ROLES: Array<{
  id: string;
  title: string;
  description: string;
  services: string[];
}> = [
  {
    id: 'role_admin',
    title: 'Admin',
    description: 'Full access to all Signal-X services',
    services: [
      'analytics',
      'logs',
      'images',
      'challans',
      'accidents',
      'ambulance',
      'sessions',
      'iam',
      'audit-logs',
      'simulation',
    ],
  },
  {
    id: 'role_operator',
    title: 'Operator',
    description: 'Operate traffic monitoring and incident workflows',
    services: ['analytics', 'logs', 'images', 'challans', 'accidents', 'sessions'],
  },
  {
    id: 'role_user',
    title: 'User',
    description: 'Basic read access to core dashboards',
    services: ['analytics', 'logs', 'sessions'],
  },
];

export class RoleModel {
  static async ensurePredefined(): Promise<void> {
    for (const role of PREDEFINED_ROLES) {
      await pool.query(
        `INSERT INTO iam_roles (
           id, title, description, services, role_type,
           country, location_scope, state, city, area, square_id, location_path
         )
         VALUES ($1, $2, $3, $4, 'predefined', 'India', 'national', NULL, NULL, NULL, NULL, 'India')
         ON CONFLICT (title) DO NOTHING`,
        [role.id, role.title, role.description, role.services]
      );
    }
    await pool.query(
      `UPDATE iam_roles
       SET country = 'India',
           location_scope = 'national',
           state = NULL,
           city = NULL,
           area = NULL,
           square_id = NULL,
           location_path = 'India'
       WHERE role_type = 'predefined'
         AND (
           location_scope IS DISTINCT FROM 'national'
           OR location_path IS DISTINCT FROM 'India'
           OR country IS DISTINCT FROM 'India'
         )`
    );
  }

  static async list(filter: LocationFilter = {}): Promise<RoleResponse[]> {
    await this.ensurePredefined();

    // Predefined (India) always visible; custom roles = current level + children only.
    const clauses: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (filter.squareId) {
      clauses.push(`(
        role_type = 'predefined'
        OR (location_scope = 'square' AND square_id = $${i})
      )`);
      values.push(filter.squareId);
      i += 1;
    } else if (filter.city) {
      clauses.push(`(
        role_type = 'predefined'
        OR (location_scope = 'city' AND state = $${i} AND city = $${i + 1})
        OR (location_scope = 'square' AND state = $${i} AND city = $${i + 1})
      )`);
      values.push(filter.state, filter.city);
      i += 2;
    } else if (filter.state) {
      clauses.push(`(
        role_type = 'predefined'
        OR (location_scope = 'state' AND state = $${i})
        OR (location_scope IN ('city', 'square') AND state = $${i})
      )`);
      values.push(filter.state);
      i += 1;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const result = await pool.query<RoleRow>(
      `SELECT * FROM iam_roles
       ${where}
       ORDER BY
         CASE role_type WHEN 'predefined' THEN 0 ELSE 1 END,
         title ASC`,
      values
    );
    return result.rows.map(mapRole);
  }

  static async findById(id: string): Promise<RoleRow | null> {
    const result = await pool.query<RoleRow>(`SELECT * FROM iam_roles WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
  }

  static async findByTitle(title: string): Promise<RoleRow | null> {
    const result = await pool.query<RoleRow>(`SELECT * FROM iam_roles WHERE title = $1`, [title]);
    return result.rows[0] ?? null;
  }

  static async create(input: {
    title: string;
    description?: string;
    services?: string[];
    location: UserLocation;
  }): Promise<RoleResponse> {
    const id = `role_${Date.now()}`;
    const location = input.location;
    const locationPath = location.locationPath || buildLocationPath(location);
    const result = await pool.query<RoleRow>(
      `INSERT INTO iam_roles (
         id, title, description, services, role_type,
         country, location_scope, state, city, area, square_id, location_path
       )
       VALUES ($1, $2, $3, $4, 'custom', $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        input.title.trim(),
        input.description?.trim() ?? '',
        input.services ?? [],
        location.country || 'India',
        location.scope,
        location.state,
        location.city,
        location.area,
        location.squareId,
        locationPath,
      ]
    );
    return mapRole(result.rows[0]);
  }

  static async update(
    id: string,
    fields: {
      title?: string;
      description?: string;
      services?: string[];
      location?: UserLocation;
    }
  ): Promise<RoleResponse | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    if (existing.role_type === 'predefined') {
      throw new Error('Predefined roles cannot be edited');
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    if (fields.title !== undefined) {
      sets.push(`title = $${i++}`);
      values.push(fields.title.trim());
    }
    if (fields.description !== undefined) {
      sets.push(`description = $${i++}`);
      values.push(fields.description.trim());
    }
    if (fields.services !== undefined) {
      sets.push(`services = $${i++}`);
      values.push(fields.services);
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

    if (sets.length === 0) return mapRole(existing);

    sets.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query<RoleRow>(
      `UPDATE iam_roles SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0] ? mapRole(result.rows[0]) : null;
  }

  static async deleteByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await pool.query(
      `DELETE FROM iam_roles
       WHERE id = ANY($1::varchar[]) AND role_type = 'custom'`,
      [ids]
    );
    return result.rowCount ?? 0;
  }
}

export { INDIA_NATIONAL };

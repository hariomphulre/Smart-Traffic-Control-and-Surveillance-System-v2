import type { WebAuthnCredential } from '@simplewebauthn/server';
import pool from '../config/db';

export interface PasskeyRow {
  id: number;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: string;
  transports: string[] | null;
  device_name: string;
  device_binding_id: string | null;
  aaguid: string | null;
  created_at: Date;
}

export type LocationPasskeyFilter = {
  state?: string | null;
  city?: string | null;
  squareId?: string | null;
  credentialIds?: string[] | null;
};

function rowToCredential(row: PasskeyRow): WebAuthnCredential {
  return {
    id: row.credential_id,
    publicKey: new Uint8Array(Buffer.from(row.public_key, 'base64')),
    counter: Number(row.counter),
    transports: (row.transports ?? undefined) as WebAuthnCredential['transports'],
  };
}

function locationClauses(
  filter: LocationPasskeyFilter,
  startIndex = 1
): { clauses: string[]; values: unknown[]; nextIndex: number } {
  const clauses: string[] = [`u.country = 'India'`];
  const values: unknown[] = [];
  let i = startIndex;

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

  return { clauses, values, nextIndex: i };
}

export class PasskeyModel {
  static async findByUserId(userId: string): Promise<WebAuthnCredential | null> {
    const result = await pool.query<PasskeyRow>(
      `SELECT * FROM passkeys WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    const row = result.rows[0];
    return row ? rowToCredential(row) : null;
  }

  static async findRowByCredentialId(credentialId: string): Promise<PasskeyRow | null> {
    const result = await pool.query<PasskeyRow>(
      `SELECT * FROM passkeys WHERE credential_id = $1 LIMIT 1`,
      [credentialId]
    );
    return result.rows[0] ?? null;
  }

  static async findUserIdsByDeviceBinding(
    deviceBindingId: string,
    filter: LocationPasskeyFilter = {}
  ): Promise<string[]> {
    if (!deviceBindingId) return [];
    const { clauses, values, nextIndex } = locationClauses(filter, 1);
    clauses.push(`p.device_binding_id = $${nextIndex}`);
    values.push(deviceBindingId);

    const result = await pool.query<{ user_id: string }>(
      `SELECT DISTINCT p.user_id
       FROM passkeys p
       INNER JOIN users u ON u.id = p.user_id
       WHERE ${clauses.join(' AND ')}`,
      values
    );
    return result.rows.map((row) => row.user_id);
  }

  static async listAllowCredentialsForLocation(
    filter: LocationPasskeyFilter
  ): Promise<Array<{ id: string; transports?: PasskeyRow['transports']; userId: string }>> {
    const { clauses, values, nextIndex } = locationClauses(filter, 1);
    const queryValues = [...values];
    let i = nextIndex;

    if (filter.credentialIds && filter.credentialIds.length > 0) {
      clauses.push(`p.credential_id = ANY($${i}::text[])`);
      queryValues.push(filter.credentialIds);
      i += 1;
    }

    const result = await pool.query<PasskeyRow>(
      `SELECT p.*
       FROM passkeys p
       INNER JOIN users u ON u.id = p.user_id
       WHERE ${clauses.join(' AND ')}`,
      queryValues
    );

    return result.rows.map((row) => ({
      id: row.credential_id,
      transports: row.transports,
      userId: row.user_id,
    }));
  }

  static async findLabelByUserId(userId: string): Promise<string> {
    const result = await pool.query<{ device_name: string }>(
      `SELECT device_name FROM passkeys WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.device_name ?? 'Passkey';
  }

  static async upsertForUser(
    userId: string,
    credential: WebAuthnCredential,
    deviceName = 'Passkey',
    extras?: { deviceBindingId?: string | null; aaguid?: string | null }
  ): Promise<void> {
    const publicKey = Buffer.from(credential.publicKey).toString('base64');
    await pool.query(
      `INSERT INTO passkeys (
         user_id, credential_id, public_key, counter, transports, device_name, device_binding_id, aaguid
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (credential_id) DO UPDATE SET
         public_key = EXCLUDED.public_key,
         counter = EXCLUDED.counter,
         transports = EXCLUDED.transports,
         device_name = EXCLUDED.device_name,
         device_binding_id = COALESCE(EXCLUDED.device_binding_id, passkeys.device_binding_id),
         aaguid = COALESCE(EXCLUDED.aaguid, passkeys.aaguid)`,
      [
        userId,
        credential.id,
        publicKey,
        credential.counter,
        credential.transports ?? null,
        deviceName,
        extras?.deviceBindingId ?? null,
        extras?.aaguid ?? null,
      ]
    );
  }

  static async bindDevice(credentialId: string, deviceBindingId: string): Promise<void> {
    if (!deviceBindingId) return;
    await pool.query(
      `UPDATE passkeys
       SET device_binding_id = $1
       WHERE credential_id = $2`,
      [deviceBindingId, credentialId]
    );
  }

  static async updateCounter(credentialId: string, counter: number): Promise<void> {
    await pool.query(`UPDATE passkeys SET counter = $1 WHERE credential_id = $2`, [
      counter,
      credentialId,
    ]);
  }

  static toCredential(row: PasskeyRow): WebAuthnCredential {
    return rowToCredential(row);
  }
}

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
  created_at: Date;
}

function rowToCredential(row: PasskeyRow): WebAuthnCredential {
  return {
    id: row.credential_id,
    publicKey: new Uint8Array(Buffer.from(row.public_key, 'base64')),
    counter: Number(row.counter),
    transports: (row.transports ?? undefined) as WebAuthnCredential['transports'],
  };
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
    deviceName = 'Passkey'
  ): Promise<void> {
    const publicKey = Buffer.from(credential.publicKey).toString('base64');
    await pool.query(
      `INSERT INTO passkeys (user_id, credential_id, public_key, counter, transports, device_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (credential_id) DO UPDATE SET
         public_key = EXCLUDED.public_key,
         counter = EXCLUDED.counter,
         transports = EXCLUDED.transports,
         device_name = EXCLUDED.device_name`,
      [
        userId,
        credential.id,
        publicKey,
        credential.counter,
        credential.transports ?? null,
        deviceName,
      ]
    );
  }

  static async updateCounter(credentialId: string, counter: number): Promise<void> {
    await pool.query(`UPDATE passkeys SET counter = $1 WHERE credential_id = $2`, [
      counter,
      credentialId,
    ]);
  }
}

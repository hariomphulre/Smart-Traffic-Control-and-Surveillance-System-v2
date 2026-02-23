import 'dotenv/config';
import pool from '../config/db';

const migrate = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.log('🚀 Running migrations...\n');

    // ── 1. vehicle_rc_details ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_rc_details (
        registration_number VARCHAR(20)  PRIMARY KEY,
        owner_name          VARCHAR(100),
        vehicle_type        VARCHAR(30)  CHECK (vehicle_type IN ('Car','Bike','Truck','Bus','Auto')),
        make                VARCHAR(50),
        model               VARCHAR(50),
        year                INT,
        color               VARCHAR(30),
        fuel_type           VARCHAR(30),
        chassis_number      VARCHAR(50)  UNIQUE,
        engine_number       VARCHAR(50)  UNIQUE,
        rc_status           VARCHAR(20)  CHECK (rc_status IN ('Active','Suspended','Expired')) DEFAULT 'Active',
        registered_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[1/7] vehicle_rc_details');

    // ── 2. vehicle_logs ───────────────────────────────────────────────────────
    // helmet_status = NULL for non-bikes  →  API returns "N/A"
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_logs (
        log_id          SERIAL    PRIMARY KEY,
        license_no      VARCHAR(20),
        vehicle_type    VARCHAR(30) CHECK (vehicle_type IN ('Car','Bike','Truck','Bus','Auto')),
        location        VARCHAR(150),
        speed           NUMERIC(6,2),
        helmet_status   BOOLEAN,
        red_light_cross BOOLEAN   DEFAULT FALSE,
        tripling        BOOLEAN   DEFAULT FALSE,
        detected_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(' [2/7] vehicle_logs');

    // ── 3. vehicle_challan_details ────────────────────────────────────────────
    // status: pending / received / rejected  (as per API docs)
    // violation_type: 4 fixed values only
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_challan_details (
        challan_id          SERIAL     PRIMARY KEY,
        registration_number VARCHAR(20) REFERENCES vehicle_rc_details(registration_number) ON DELETE CASCADE,
        challan_number      VARCHAR(50) UNIQUE NOT NULL,
        violation_type      VARCHAR(60) CHECK (violation_type IN (
                              'No Helmet','Triple Riding','Red Light Violation','Over Speeding'
                            )),
        violation_description TEXT,
        fine_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
        penalty_amount      NUMERIC(10,2) DEFAULT 0,
        penalty_points      INT           DEFAULT 0,
        challan_status      VARCHAR(20)   CHECK (challan_status IN ('pending','received','rejected')) DEFAULT 'pending',
        location            VARCHAR(150),
        officer_name        VARCHAR(100),
        issue_date          DATE          DEFAULT CURRENT_DATE,
        due_date            DATE,
        payment_date        TIMESTAMP,
        payment_mode        VARCHAR(50),
        created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(' [3/7] vehicle_challan_details');

    // ── 4. accidents ──────────────────────────────────────────────────────────
    // Drop old accidents table if it exists (for schema updates)
    await client.query(`
      DROP TABLE IF EXISTS accident_media CASCADE;
      DROP TABLE IF EXISTS accident_vehicles CASCADE;
      DROP TABLE IF EXISTS accidents CASCADE;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS accidents (
        accident_id           VARCHAR(50) PRIMARY KEY,
        first_detected_frame  INT,
        total_frames          INT,
        confidence            NUMERIC(5,4),
        status                VARCHAR(20),
        total_vehicles        INT,
        location              VARCHAR(150),
        description           TEXT,
        severity              VARCHAR(10) CHECK (severity IN ('low','medium','high')) DEFAULT 'low',
        has_recording         BOOLEAN   DEFAULT FALSE,
        occurred_at           TIMESTAMP,
        completed_at          TIMESTAMP,
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(' [4/7] accidents');

    // ── 5. accident_vehicles ──────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS accident_vehicles (
        id           SERIAL   PRIMARY KEY,
        accident_id  VARCHAR(50) REFERENCES accidents(accident_id) ON DELETE CASCADE,
        license_no   VARCHAR(20),
        vehicle_type VARCHAR(30),
        speed        NUMERIC(6,2)
      );
    `);
    console.log(' [5/7] accident_vehicles');

    // ── 6. vehicle_images ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_images (
        image_id           SERIAL    PRIMARY KEY,
        log_id             INT       REFERENCES vehicle_logs(log_id) ON DELETE CASCADE,
        license_no         VARCHAR(20),
        vehicle_type       VARCHAR(30),
        image_path         VARCHAR(300),
        license_plate_path VARCHAR(300),
        captured_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(' [6/7] vehicle_images');

    // ── 7. accident_media ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS accident_media (
        media_id    SERIAL    PRIMARY KEY,
        accident_id VARCHAR(50) REFERENCES accidents(accident_id) ON DELETE CASCADE,
        location    VARCHAR(150),
        media_type  VARCHAR(10) CHECK (media_type IN ('image','video')) DEFAULT 'image',
        file_path   VARCHAR(300),
        duration    VARCHAR(20),
        severity    VARCHAR(10) CHECK (severity IN ('low','medium','high')) DEFAULT 'low',
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(' [7/7] accident_media');

    console.log('\n🎉 All migrations complete!\n');
  } catch (err) {
    console.error('Migration failed:', (err as Error).message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
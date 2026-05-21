-- Smart Traffic System — schema (runs once on fresh Postgres volume)

CREATE TABLE IF NOT EXISTS vehicle_rc_details (
  registration_number VARCHAR(20) PRIMARY KEY,
  owner_name          VARCHAR(100),
  vehicle_type        VARCHAR(30) CHECK (vehicle_type IN ('Car','Bike','Truck','Bus','Auto')),
  make                VARCHAR(50),
  model               VARCHAR(50),
  year                INT,
  color               VARCHAR(30),
  fuel_type           VARCHAR(30),
  chassis_number      VARCHAR(50) UNIQUE,
  engine_number       VARCHAR(50) UNIQUE,
  rc_status           VARCHAR(20) CHECK (rc_status IN ('Active','Suspended','Expired')) DEFAULT 'Active',
  registered_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_logs (
  log_id          SERIAL PRIMARY KEY,
  license_no      VARCHAR(20),
  vehicle_type    VARCHAR(30) CHECK (vehicle_type IN ('Car','Bike','Truck','Bus','Auto')),
  location        VARCHAR(150),
  speed           NUMERIC(6,2),
  helmet_status   BOOLEAN,
  red_light_cross BOOLEAN DEFAULT FALSE,
  tripling        BOOLEAN DEFAULT FALSE,
  detected_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_challan_details (
  challan_id          SERIAL PRIMARY KEY,
  registration_number VARCHAR(20) REFERENCES vehicle_rc_details(registration_number) ON DELETE CASCADE,
  challan_number      VARCHAR(50) UNIQUE NOT NULL,
  violation_type      VARCHAR(60) CHECK (violation_type IN (
    'No Helmet','Triple Riding','Red Light Violation','Over Speeding'
  )),
  violation_description TEXT,
  fine_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  penalty_amount      NUMERIC(10,2) DEFAULT 0,
  penalty_points      INT DEFAULT 0,
  challan_status      VARCHAR(20) CHECK (challan_status IN ('pending','received','rejected')) DEFAULT 'pending',
  location            VARCHAR(150),
  officer_name        VARCHAR(100),
  issue_date          DATE DEFAULT CURRENT_DATE,
  due_date            DATE,
  payment_date        TIMESTAMP,
  payment_mode        VARCHAR(50),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  has_recording         BOOLEAN DEFAULT FALSE,
  occurred_at           TIMESTAMP,
  completed_at          TIMESTAMP,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accident_vehicles (
  id           SERIAL PRIMARY KEY,
  accident_id  VARCHAR(50) REFERENCES accidents(accident_id) ON DELETE CASCADE,
  license_no   VARCHAR(20),
  vehicle_type VARCHAR(30),
  speed        NUMERIC(6,2)
);

CREATE TABLE IF NOT EXISTS vehicle_images (
  image_id           SERIAL PRIMARY KEY,
  log_id             INT REFERENCES vehicle_logs(log_id) ON DELETE CASCADE,
  license_no         VARCHAR(20),
  vehicle_type       VARCHAR(30),
  image_path         VARCHAR(300),
  license_plate_path VARCHAR(300),
  captured_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accident_media (
  media_id    SERIAL PRIMARY KEY,
  accident_id VARCHAR(50) REFERENCES accidents(accident_id) ON DELETE CASCADE,
  location    VARCHAR(150),
  media_type  VARCHAR(10) CHECK (media_type IN ('image','video')) DEFAULT 'image',
  file_path   VARCHAR(300),
  duration    VARCHAR(20),
  severity    VARCHAR(10) CHECK (severity IN ('low','medium','high')) DEFAULT 'low',
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_logs_detected_at ON vehicle_logs(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_location ON vehicle_logs(location);
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_license_no ON vehicle_logs(license_no);
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_vehicle_type ON vehicle_logs(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_accidents_occurred_at ON accidents(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_accidents_severity ON accidents(severity);
CREATE INDEX IF NOT EXISTS idx_challans_created_at ON vehicle_challan_details(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challans_status ON vehicle_challan_details(challan_status);

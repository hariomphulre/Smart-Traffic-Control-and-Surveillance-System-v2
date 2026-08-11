-- Evolve IAM users schema to match backend UserModel / migrate.ts
-- Safe to re-run on every deploy (idempotent).

-- Drop legacy password auth column (passkeys-only auth)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Allow free-form role titles (Admin / Operator / User / custom)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(100);
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'User';

UPDATE users SET role = 'Admin' WHERE lower(role) = 'admin';
UPDATE users SET role = 'Operator' WHERE lower(role) = 'operator';
UPDATE users SET role = 'User' WHERE lower(role) = 'user';

-- Multi-role + location scope columns used by guest login / IAM
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_scope VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS area VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS square_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_path TEXT;

UPDATE users
SET
  roles = COALESCE(NULLIF(roles, '{}'::TEXT[]), ARRAY[COALESCE(NULLIF(role, ''), 'User')]::TEXT[]),
  country = COALESCE(country, 'India'),
  location_scope = COALESCE(location_scope, 'national'),
  location_path = COALESCE(NULLIF(location_path, ''), 'India')
WHERE roles IS NULL
   OR cardinality(roles) = 0
   OR country IS NULL
   OR location_scope IS NULL
   OR location_path IS NULL
   OR location_path = '';

ALTER TABLE users ALTER COLUMN roles SET DEFAULT ARRAY['User']::TEXT[];
UPDATE users SET roles = ARRAY['User']::TEXT[] WHERE roles IS NULL;
ALTER TABLE users ALTER COLUMN roles SET NOT NULL;

ALTER TABLE users ALTER COLUMN country SET DEFAULT 'India';
UPDATE users SET country = 'India' WHERE country IS NULL;
ALTER TABLE users ALTER COLUMN country SET NOT NULL;

ALTER TABLE users ALTER COLUMN location_scope SET DEFAULT 'national';
UPDATE users SET location_scope = 'national' WHERE location_scope IS NULL;
ALTER TABLE users ALTER COLUMN location_scope SET NOT NULL;

ALTER TABLE users ALTER COLUMN location_path SET DEFAULT 'India';
UPDATE users SET location_path = 'India' WHERE location_path IS NULL OR location_path = '';
ALTER TABLE users ALTER COLUMN location_path SET NOT NULL;

UPDATE users
SET role = roles[1]
WHERE roles IS NOT NULL
  AND cardinality(roles) > 0
  AND (role IS NULL OR role = '' OR role IS DISTINCT FROM roles[1]);

-- Guest identity used by /api/auth/guest-login
INSERT INTO users (
  id, username, role, roles, country, location_scope,
  state, city, area, square_id, location_path
) VALUES (
  'user_guest', 'Guest', 'User', ARRAY['User']::TEXT[],
  'India', 'national', NULL, NULL, NULL, NULL, 'India'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (
  id, username, role, roles, country, location_scope,
  state, city, area, square_id, location_path
) VALUES (
  'user_guest', 'Guest', 'User', ARRAY['User']::TEXT[],
  'India', 'national', NULL, NULL, NULL, NULL, 'India'
)
ON CONFLICT (username) DO NOTHING;

-- Passkey extras used by WebAuthn flows
ALTER TABLE passkeys ADD COLUMN IF NOT EXISTS device_binding_id VARCHAR(64);
ALTER TABLE passkeys ADD COLUMN IF NOT EXISTS aaguid VARCHAR(36);
CREATE INDEX IF NOT EXISTS idx_passkeys_device_binding ON passkeys(device_binding_id);

-- IAM roles catalog (if missing on older VPS DBs)
CREATE TABLE IF NOT EXISTS iam_roles (
  id             VARCHAR(50)  PRIMARY KEY,
  title          VARCHAR(100) UNIQUE NOT NULL,
  description    TEXT         DEFAULT '',
  services       TEXT[]       DEFAULT '{}',
  role_type      VARCHAR(20)  NOT NULL DEFAULT 'custom'
                   CHECK (role_type IN ('predefined', 'custom')),
  country        VARCHAR(100) NOT NULL DEFAULT 'India',
  location_scope VARCHAR(20)  NOT NULL DEFAULT 'national'
                   CHECK (location_scope IN ('national', 'state', 'city', 'square')),
  state          VARCHAR(100),
  city           VARCHAR(100),
  area           VARCHAR(100),
  square_id      VARCHAR(100),
  location_path  TEXT         NOT NULL DEFAULT 'India',
  created_at     TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE iam_roles ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE iam_roles ADD COLUMN IF NOT EXISTS location_scope VARCHAR(20);
ALTER TABLE iam_roles ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE iam_roles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE iam_roles ADD COLUMN IF NOT EXISTS area VARCHAR(100);
ALTER TABLE iam_roles ADD COLUMN IF NOT EXISTS square_id VARCHAR(100);
ALTER TABLE iam_roles ADD COLUMN IF NOT EXISTS location_path TEXT;

UPDATE iam_roles
SET
  country = COALESCE(country, 'India'),
  location_scope = COALESCE(location_scope, 'national'),
  location_path = COALESCE(NULLIF(location_path, ''), 'India')
WHERE country IS NULL
   OR location_scope IS NULL
   OR location_path IS NULL
   OR location_path = '';

ALTER TABLE iam_roles ALTER COLUMN country SET DEFAULT 'India';
ALTER TABLE iam_roles ALTER COLUMN location_scope SET DEFAULT 'national';
ALTER TABLE iam_roles ALTER COLUMN location_path SET DEFAULT 'India';

UPDATE iam_roles SET country = 'India' WHERE country IS NULL;
UPDATE iam_roles SET location_scope = 'national' WHERE location_scope IS NULL;
UPDATE iam_roles SET location_path = 'India' WHERE location_path IS NULL OR location_path = '';

ALTER TABLE iam_roles ALTER COLUMN country SET NOT NULL;
ALTER TABLE iam_roles ALTER COLUMN location_scope SET NOT NULL;
ALTER TABLE iam_roles ALTER COLUMN location_path SET NOT NULL;

INSERT INTO iam_roles (
  id, title, description, services, role_type,
  country, location_scope, state, city, area, square_id, location_path
) VALUES
  ('role_admin', 'Admin', 'Full access to all Signal-X services',
    ARRAY['analytics','logs','images','challans','accidents','ambulance','sessions','iam','audit-logs','simulation'],
    'predefined', 'India', 'national', NULL, NULL, NULL, NULL, 'India'),
  ('role_operator', 'Operator', 'Operate traffic monitoring and incident workflows',
    ARRAY['analytics','logs','images','challans','accidents','sessions'],
    'predefined', 'India', 'national', NULL, NULL, NULL, NULL, 'India'),
  ('role_user', 'User', 'Basic read access to core dashboards',
    ARRAY['analytics','logs','sessions'],
    'predefined', 'India', 'national', NULL, NULL, NULL, NULL, 'India')
ON CONFLICT (title) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_location_path ON users(location_path);
CREATE INDEX IF NOT EXISTS idx_users_location_scope ON users(location_scope, state, city, square_id);
CREATE INDEX IF NOT EXISTS idx_iam_roles_title ON iam_roles(title);
CREATE INDEX IF NOT EXISTS idx_iam_roles_location_scope ON iam_roles(location_scope, state, city, square_id);

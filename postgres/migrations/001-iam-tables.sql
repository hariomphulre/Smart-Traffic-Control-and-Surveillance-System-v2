-- Idempotent IAM schema (safe to re-run on every deploy)

CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(50)  PRIMARY KEY,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  role          VARCHAR(30)  DEFAULT 'user' CHECK (role IN ('user', 'admin', 'operator')),
  created_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS passkeys (
  id            SERIAL       PRIMARY KEY,
  user_id       VARCHAR(50)  REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT         UNIQUE NOT NULL,
  public_key    TEXT         NOT NULL,
  counter       BIGINT       DEFAULT 0,
  transports    TEXT[],
  device_name   VARCHAR(100) DEFAULT 'Passkey',
  created_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  session_id    VARCHAR(64)  PRIMARY KEY,
  user_id       VARCHAR(50)  REFERENCES users(id) ON DELETE CASCADE,
  username      VARCHAR(100) NOT NULL,
  passkey_label VARCHAR(100),
  ip_address    VARCHAR(45),
  location      VARCHAR(150),
  login_at      TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
  expires_at    TIMESTAMPTZ  NOT NULL,
  is_active     BOOLEAN      DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_passkeys_user_id ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active
  ON user_sessions(is_active, expires_at DESC) WHERE is_active = TRUE;

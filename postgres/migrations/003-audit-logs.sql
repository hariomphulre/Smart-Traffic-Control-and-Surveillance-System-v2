-- Audit trail for user-initiated edits (IAM, roles, intersections, sessions)
-- Idempotent — safe to re-run on every deploy.

CREATE TABLE IF NOT EXISTS audit_logs (
  id              VARCHAR(50)  PRIMARY KEY,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id         VARCHAR(50),
  username        VARCHAR(100) NOT NULL,
  roles           TEXT[]       NOT NULL DEFAULT '{}',
  origin          TEXT         NOT NULL DEFAULT '',
  action          VARCHAR(40)  NOT NULL,
  resource_type   VARCHAR(40)  NOT NULL,
  resource_id     VARCHAR(100),
  resource_label  VARCHAR(200),
  changes         JSONB        NOT NULL DEFAULT '[]'::jsonb,
  ip_address      VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_username
  ON audit_logs(username);

CREATE INDEX IF NOT EXISTS idx_audit_logs_origin
  ON audit_logs(origin);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON audit_logs(resource_type, resource_id);

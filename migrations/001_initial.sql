-- Mechon: initial schema
-- Run with: sqlx migrate run

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role    AS ENUM ('owner', 'admin', 'user');
CREATE TYPE worker_status AS ENUM ('online', 'offline', 'draining');
CREATE TYPE bot_status   AS ENUM ('stopped', 'starting', 'running', 'stopping', 'error');
CREATE TYPE bot_runtime  AS ENUM ('node', 'bun', 'deno');

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role    NOT NULL DEFAULT 'user',
    -- null for owner; owner's id for admins; admin's id for users
    parent_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Limits set by the server owner for each admin account.
-- Represents the total resource pool the admin can distribute to their users.
CREATE TABLE admin_limits (
    user_id              UUID    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    max_users            INTEGER NOT NULL DEFAULT 10,
    total_ram_mb         BIGINT  NOT NULL DEFAULT 2048,
    total_cpu_pct        REAL    NOT NULL DEFAULT 100.0,
    total_disk_mb        BIGINT  NOT NULL DEFAULT 10240,
    total_bots           INTEGER NOT NULL DEFAULT 20,
    -- Per-user ceilings the admin may not exceed when setting user limits
    max_ram_per_user_mb  BIGINT  NOT NULL DEFAULT 512,
    max_cpu_per_user_pct REAL    NOT NULL DEFAULT 50.0,
    max_bots_per_user    INTEGER NOT NULL DEFAULT 5
);

-- Limits set by an admin for each user account.
-- Must not exceed the admin's remaining pool.
CREATE TABLE user_limits (
    user_id            UUID    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    max_bots           INTEGER NOT NULL DEFAULT 3,
    max_ram_mb         BIGINT  NOT NULL DEFAULT 256,
    max_ram_per_bot_mb BIGINT  NOT NULL DEFAULT 128,
    max_cpu_pct        REAL    NOT NULL DEFAULT 25.0,
    max_cpu_per_bot_pct REAL   NOT NULL DEFAULT 10.0,
    max_disk_mb        BIGINT  NOT NULL DEFAULT 1024
);

-- ============================================================
-- API KEYS
-- ============================================================

CREATE TABLE api_keys (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash     VARCHAR(64)  NOT NULL UNIQUE,  -- SHA-256 hex
    name         VARCHAR(100) NOT NULL,
    last_used_at TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKER NODES
-- ============================================================

CREATE TABLE worker_nodes (
    id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostname         VARCHAR(255)  NOT NULL,
    ip_address       VARCHAR(45)   NOT NULL,
    total_ram_mb     BIGINT        NOT NULL,
    total_cpu_cores  INTEGER       NOT NULL,
    allocated_ram_mb BIGINT        NOT NULL DEFAULT 0,
    allocated_cpu_pct REAL         NOT NULL DEFAULT 0.0,
    status           worker_status NOT NULL DEFAULT 'offline',
    last_heartbeat   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOTS
-- ============================================================

CREATE TABLE bots (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             VARCHAR(100) NOT NULL,
    encrypted_token  TEXT        NOT NULL,
    status           bot_status  NOT NULL DEFAULT 'stopped',
    worker_id        UUID        REFERENCES worker_nodes(id) ON DELETE SET NULL,
    entrypoint       VARCHAR(255) NOT NULL DEFAULT 'index.js',
    runtime          bot_runtime NOT NULL DEFAULT 'node',
    -- set after first deploy; updated on version activation
    active_version_id UUID,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Code versions: each deploy uploads a new archive
CREATE TABLE bot_versions (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id       UUID        NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    version      INTEGER     NOT NULL,
    archive_key  TEXT        NOT NULL,  -- MinIO object key or local path
    entrypoint   VARCHAR(255) NOT NULL DEFAULT 'index.js',
    uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deployed_at  TIMESTAMPTZ,
    UNIQUE (bot_id, version)
);

ALTER TABLE bots
    ADD CONSTRAINT fk_bots_active_version
    FOREIGN KEY (active_version_id) REFERENCES bot_versions(id) ON DELETE SET NULL;

-- ============================================================
-- METRICS & LOGS
-- ============================================================

CREATE TABLE bot_metrics (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id      UUID        NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    cpu_pct     REAL        NOT NULL,
    ram_mb      BIGINT      NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bot_metrics_lookup ON bot_metrics (bot_id, recorded_at DESC);

-- Rolling log store (keep last N lines per bot; old rows pruned by background job)
CREATE TABLE bot_logs (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id      UUID        NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    stream      VARCHAR(6)  NOT NULL CHECK (stream IN ('stdout', 'stderr')),
    message     TEXT        NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bot_logs_lookup ON bot_logs (bot_id, recorded_at DESC);

-- ============================================================
-- PLATFORM CONFIG
-- ============================================================

CREATE TABLE platform_config (
    key        VARCHAR(100) PRIMARY KEY,
    value      TEXT         NOT NULL,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO platform_config (key, value) VALUES
    ('setup_complete',    'false'),
    ('open_registration', 'false'),
    ('default_runtime',   'node'),
    ('log_retention_lines', '5000');

# Mechon

A self-hostable backend-as-a-service platform for hosting and managing Discord bots. Run it on your own server, invite admins, and let users deploy their bots without giving them access to your infrastructure.

## Features

- **Multi-tenant** — three-tier user hierarchy: Owner → Admin → User
- **Resource limits** — per-user RAM, CPU, disk, and bot count quotas enforced at the API level
- **Multi-runtime** — run bots with Node.js, Bun, or Deno
- **Horizontal scaling** — stateless API nodes + separate worker agents connected via Redis pub/sub
- **Bot versioning** — upload code archives and roll back to any previous version
- **Artifact storage** — local filesystem (single-server) or MinIO/S3-compatible (multi-node)
- **Secure by default** — Argon2 password hashing, AES-256-GCM bot token encryption, JWT + API key auth

## Architecture

```
┌─────────────┐     HTTP      ┌──────────────────┐
│  mechon CLI │ ──────────── │  mechon-server   │
└─────────────┘               │  (Axum + sqlx)   │
                               └────────┬─────────┘
                                        │ Redis pub/sub
                               ┌────────┴─────────┐
                               │  mechon-worker   │  ×N
                               │  (bot processes) │
                               └──────────────────┘
```

| Component | Crate | Binary |
|---|---|---|
| API server | `crates/server` | `mechon-server` |
| Worker agent | `crates/worker` | `mechon-worker` |
| CLI | `crates/cli` | `mechon` |
| Shared types | `crates/types` | — |
| Redis helpers | `crates/redis-utils` | — |

## Prerequisites

- Rust 1.78+
- PostgreSQL 15+
- Redis 7+
- `sqlx-cli` for running migrations

```bash
cargo install sqlx-cli --no-default-features --features postgres
```

## Getting Started

### 1. Clone and build

```bash
git clone https://github.com/yourname/mechon
cd mechon
cargo build --release
```

### 2. Configure

```bash
cp config.example.toml config.toml
# Edit config.toml — set database URL, Redis URL, and a random secret_key
openssl rand -hex 32   # paste output as secret_key
```

### 3. Run migrations

```bash
export DATABASE_URL="postgresql://mechon:password@localhost:5432/mechon"
sqlx migrate run
```

### 4. Start the server

```bash
./target/release/mechon-server
```

### 5. Run setup (first time only)

```bash
mechon setup
# Creates the owner account interactively
```

### 6. Start a worker node

Run this on each machine that will execute bots:

```bash
./target/release/mechon-worker
```

## User Hierarchy

```
Owner  (one per instance, created via mechon setup)
  └── Admin  (created by owner, receives a resource pool)
        └── User  (created by admin, limits drawn from admin's pool)
```

The owner sets limits for each admin (total RAM, CPU, disk, max users). Admins then distribute slices of those limits to their users. All resource accounting is enforced server-side.

## CLI Usage

```bash
mechon login                    # authenticate
mechon bots create my-bot       # create a bot
mechon deploy my-bot ./src      # upload and deploy code
mechon bots start my-bot
mechon bots logs my-bot
mechon bots stop my-bot

# Owner commands
mechon owner create-admin email@example.com --username alice

# Admin commands
mechon admin create-user email@example.com --username bob
mechon admin set-limits bob --max-bots 5 --max-ram-mb 512
```

## Configuration Reference

See [`config.example.toml`](config.example.toml) for all available options. Every key can be overridden with an environment variable:

```
MECHON__SERVER__SECRET_KEY=...
MECHON__DATABASE__URL=...
MECHON__REDIS__URL=...
```

## Storage Backends

| Backend | When to use |
|---|---|
| `local` | Single-server setups |
| `s3` | Multi-node or MinIO |

## License

MIT

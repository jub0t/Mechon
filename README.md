<div align="center">

# Mechon

**Self-host your own Discord bot platform. Give users a place to deploy their bots — without handing over your server.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built with Rust](https://img.shields.io/badge/built%20with-Rust-orange.svg)](https://www.rust-lang.org/)

</div>

---

Mechon is an open source platform that lets you run a Discord bot hosting service on your own infrastructure. Think of it like a mini Heroku for Discord bots — you control the server, you control who gets access, and everything runs under your roof.

Users log in through the CLI, upload their bot code, and Mechon handles the rest: process management, resource limits, logs, metrics, and versioning. No Docker required.

## Why Mechon?

- **You own the infrastructure.** No third-party hosting, no vendor lock-in.
- **Rent out access.** Create admin accounts with resource pools, let admins onboard their own users.
- **Resource isolation.** Every bot runs with enforced RAM, CPU, and disk limits — users can't starve each other out.
- **Production-ready architecture.** Stateless API nodes + worker agents over Redis pub/sub means you can scale horizontally from day one.
- **Simple to operate.** One binary per role — server, worker, CLI. No Kubernetes, no service mesh.

## How it works

```
  you                 your users
   │                      │
   ▼                      ▼
mechon CLI  ──HTTP──  mechon-server  ──Redis pub/sub──  mechon-worker (×N)
                            │                                  │
                        PostgreSQL                       bot processes
```

The **server** is a stateless Axum API. The **worker** is an agent that runs on any machine with spare capacity — it registers itself, receives commands over Redis, and spawns bot child processes. You can run as many workers as you want across as many machines as you have.

## Features

- **Three-tier user hierarchy** — Owner creates Admins with resource pools; Admins create Users from their pool
- **Per-bot resource limits** — RAM, CPU, disk quotas enforced at the API and process level
- **Multi-runtime support** — Node.js, Bun, and Deno out of the box
- **Bot versioning** — every deploy creates a new version; roll back any time
- **API key auth** — users can generate long-lived API keys for CI/CD pipelines
- **Artifact storage** — local filesystem for single-server, MinIO/S3-compatible for multi-node
- **Secure defaults** — Argon2 password hashing, AES-256-GCM token encryption at rest, JWT sessions

## Getting started

### Prerequisites

- Rust 1.78+
- PostgreSQL 15+
- Redis 7+

### 1. Clone and build

```bash
git clone https://github.com/yourname/mechon
cd mechon
cargo build --release
```

### 2. Set up the database

```bash
sudo -u postgres psql -c "CREATE USER mechon WITH PASSWORD 'yourpassword';"
sudo -u postgres psql -c "CREATE DATABASE mechon OWNER mechon;"

cargo install sqlx-cli --no-default-features --features postgres
DATABASE_URL="postgresql://mechon:yourpassword@localhost:5432/mechon" sqlx migrate run
```

### 3. Configure

```bash
SECRET=$(openssl rand -hex 32)

cat > config.toml << EOF
[server]
host = "0.0.0.0"
port = 8080
secret_key = "$SECRET"

[database]
url = "postgresql://mechon:yourpassword@localhost:5432/mechon"

[redis]
url = "redis://127.0.0.1:6379"

[storage]
driver = "local"
local_path = "/var/mechon/artifacts"

[worker]
work_dir = "/var/mechon/bots"
EOF

mkdir -p /var/mechon/artifacts /var/mechon/bots
```

### 4. Start everything

In separate terminals (or tmux panes):

```bash
# Terminal 1 — API server
./target/release/mechon-server

# Terminal 2 — Worker (run this on any machine that will host bots)
./target/release/mechon-worker

# Terminal 3 — First-time setup (creates the owner account)
./target/release/mechon setup \
  --host http://localhost:8080 \
  --email you@example.com \
  --username owner \
  --password "yourpassword"
```

### 5. Log in and go

```bash
./target/release/mechon login --host http://localhost:8080 --identifier owner --password "yourpassword"
./target/release/mechon whoami
```

## CLI quick reference

```bash
# Bots
mechon bots create --name mybot --token "discord-bot-token"
mechon deploy mybot ./my-bot-directory
mechon bots start mybot
mechon bots logs mybot
mechon bots stop mybot
mechon bots list

# Owner — manage admins
mechon owner create-admin --email admin@example.com --username alice --password "pass"
mechon owner set-limits alice --max-users 10 --total-ram-mb 4096 --total-bots 20

# Admin — manage users
mechon admin create-user --email user@example.com --username bob --password "pass"
mechon admin set-limits bob --max-bots 5 --max-ram-mb 512
```

## User hierarchy

```
Owner  ← one per instance, bootstrapped via `mechon setup`
  └── Admin  ← created by owner, given a resource pool to distribute
        └── User  ← created by admin, limited to their admin's pool
```

The owner sets how much total RAM, CPU, and how many bots an admin can hand out. Admins then carve that up between their users. All accounting is enforced server-side — users can't exceed their limits even if they try.

## Configuration

All config lives in `config.toml`. See [`config.example.toml`](config.example.toml) for the full reference.

Every value can be overridden with an environment variable using the pattern `MECHON__<SECTION>__<KEY>`:

```bash
MECHON__SERVER__SECRET_KEY=...
MECHON__DATABASE__URL=...
MECHON__REDIS__URL=...
```

## Multi-node deployment

Run `mechon-worker` on as many machines as you want. Each worker registers itself in the database and the scheduler picks the node with the most available RAM when starting a bot. Workers only need access to Redis and the storage backend — they don't talk to the API server directly.

For multi-node setups, switch storage to MinIO or any S3-compatible service so all workers can access bot code archives:

```toml
[storage]
driver = "s3"
endpoint = "http://your-minio:9000"
bucket = "mechon-artifacts"
access_key = "..."
secret_key = "..."
force_path_style = true
```

## Contributing

Contributions are welcome. If you find a bug or want to add a feature, open an issue first so we can discuss it before you write the code.

The codebase is a Cargo workspace:

| Crate | Purpose |
|---|---|
| `crates/server` | Axum API server |
| `crates/worker` | Bot process manager |
| `crates/cli` | Command-line interface |
| `crates/types` | Shared data types |
| `crates/redis-utils` | Redis channel helpers |

```bash
# Check everything compiles
cargo check

# Run with debug logging
RUST_LOG=debug ./target/release/mechon-server
```

## License

MIT — do whatever you want with it.

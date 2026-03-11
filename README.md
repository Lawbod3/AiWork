# Backend Engineering Assessment Starter

This repository is a standalone starter for the backend engineering take-home assessment.
It contains two independent services in a shared mono-repo:

- `python-service/` (InsightOps): FastAPI + SQLAlchemy + SQLite (local) / PostgreSQL (production)
- `ts-service/` (TalentFlow): NestJS + TypeORM + SQLite (local) / PostgreSQL (production)

The repository is intentionally incomplete for assessment features. Candidates should build within the existing structure and patterns.

## Database Strategy

Both services use **SQLite for local development** and **PostgreSQL for production**.

### Why This Approach?

**Local Development (SQLite):**
- ✅ Zero setup required - no Docker, no external database
- ✅ Instant startup - just run migrations and start coding
- ✅ Perfect for testing and iteration
- ✅ File-based database (easy to reset)

**Production (PostgreSQL):**
- ✅ Scalable and production-grade
- ✅ Handles concurrent connections
- ✅ Enterprise-ready

The code automatically detects which database to use based on the `DATABASE_URL` environment variable.

## Quick Start

### Python Service (Local)

```bash
cd python-service
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python -m app.db.run_migrations up
python -m uvicorn app.main:app --reload --port 8000
```

Service runs on `http://localhost:8000` with SQLite.

### TypeScript Service (Local)

```bash
cd ts-service
npm install
cp .env.example .env
npm run migration:run
npm run start:dev
```

Service runs on `http://localhost:3000` with SQLite.

## Production Setup

To use PostgreSQL in production, update the `.env` file:

**Python Service:**
```
DATABASE_URL=postgresql://user:password@host:5432/database_name
```

**TypeScript Service:**
```
DATABASE_URL=postgres://user:password@host:5432/database_name
```

The applications automatically detect PostgreSQL and use the appropriate configuration.

## Prerequisites

- Python 3.12 (for python-service)
- Node.js 22+ (for ts-service)
- npm (for ts-service)

**Docker is optional** - only needed if you want to run PostgreSQL locally for testing.

## Optional: Start PostgreSQL Locally

If you want to test with PostgreSQL locally:

```bash
docker compose up -d postgres
```

Then update `.env` to use PostgreSQL:
```
DATABASE_URL=postgres://assessment_user:assessment_pass@localhost:5432/assessment_db
```

## Service Guides

- Python service setup and commands: [python-service/README.md](python-service/README.md)
- TypeScript service setup and commands: [ts-service/README.md](ts-service/README.md)

## Notes

- Keep your solution focused on the assessment tasks.
- Do not replace the project structure with a different architecture.
- Both services use SQLite by default for zero-friction local development.
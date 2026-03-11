# TalentFlow TypeScript Service Starter

NestJS starter service for the backend assessment.

This service includes:

- Nest bootstrap with global validation
- TypeORM + migration setup
- Fake auth context (`x-user-id`, `x-workspace-id`)
- Tiny workspace-scoped sample module
- Queue abstraction module
- LLM provider abstraction with a fake summarization provider
- Jest test setup

## Part B: Candidate Document Intake + Summary Workflow

Building an async document intake and LLM-powered summary generation feature.

### What We're Building

Recruiters upload candidate documents (resumes, cover letters). The system stores them and generates structured summaries using an LLM, all asynchronously through a queue.

### Project Structure

```
src/
├── dto/candidates/               # Input/output validation
├── services/candidates/          # Business logic
├── utils/candidates/mappers/     # Entity transformation
├── controllers/candidates/       # HTTP endpoints
├── entities/                     # Database models
├── migrations/                   # Database versioning
├── auth/                         # Authentication
├── queue/                        # Async job processing
├── llm/                          # LLM provider abstraction
└── config/                       # Configuration
```

**Why this structure?** Each feature has its own DTOs, services, and utilities. Easy to find related code and add new features.

### API Endpoints

- `POST /candidates/:candidateId/documents` - Upload document
- `POST /candidates/:candidateId/summaries/generate` - Request summary generation
- `GET /candidates/:candidateId/summaries` - List summaries
- `GET /candidates/:candidateId/summaries/:summaryId` - Get single summary

### Implementation Status

- [x] Database migration
- [x] TypeORM entities
- [x] DTOs with validation
- [x] Service layer (business logic, workspace scoping)
- [x] Mapper layer (entity transformation)
- [x] Controller (HTTP endpoints)
- [x] Module (dependency injection)
- [x] Tests (46 tests passing)
- [ ] Worker (async job processing)
- [ ] LLM provider (Gemini integration)

## Prerequisites

- Node.js 22+
- npm

**No Docker or external database required for local development.** The service uses SQLite by default.

## Quick Start (Local Development)

```bash
cd ts-service
npm install
npm run migration:run
npm run start:dev
```

That's it! The service will start on `http://localhost:3000` with SQLite.

## Setup

### Local Development (SQLite)

SQLite is the default for local development. No setup needed beyond npm install.

```bash
cd ts-service
npm install
cp .env.example .env
npm run migration:run
npm run start:dev
```

The `.env` file defaults to SQLite:
```
DATABASE_URL=sqlite:./talentflow.db
```

This creates a `talentflow.db` file in the ts-service directory. No Docker, no external database, no user setup.

### Production (PostgreSQL)

For production, switch to PostgreSQL by updating `.env`:

```bash
# .env (production)
DATABASE_URL=postgres://user:password@host:5432/database_name
```

The application automatically detects PostgreSQL and uses the appropriate configuration.

**Why SQLite for local, PostgreSQL for production?**
- SQLite: Zero setup, instant testing, perfect for development
- PostgreSQL: Scalable, production-grade, handles concurrent connections

## Environment Variables

- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - Database connection string
  - Local: `sqlite:./talentflow.db`
  - Production: `postgres://user:password@host:5432/db`
- `NODE_ENV` - Environment (development/production)
- `GEMINI_API_KEY` - Google Gemini API key (for LLM features)

## Run Migrations

```bash
cd ts-service
npm run migration:run
```

Migrations run automatically on startup. This command is useful for manual verification.

## Run Service

```bash
cd ts-service
npm run start:dev
```

Service starts on `http://localhost:3000`

## Test Endpoints

All endpoints require auth headers:

```bash
# Upload a document
curl -X POST http://localhost:3000/candidates/cand-123/documents \
  -H "x-user-id: user-1" \
  -H "x-workspace-id: workspace-1" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "resume",
    "fileName": "resume.pdf",
    "rawText": "John Doe is a software engineer with 5 years of experience..."
  }'

# Request summary generation
curl -X POST http://localhost:3000/candidates/cand-123/summaries/generate \
  -H "x-user-id: user-1" \
  -H "x-workspace-id: workspace-1"

# List summaries
curl -X GET http://localhost:3000/candidates/cand-123/summaries \
  -H "x-user-id: user-1" \
  -H "x-workspace-id: workspace-1"

# Get single summary
curl -X GET http://localhost:3000/candidates/cand-123/summaries/summary-id \
  -H "x-user-id: user-1" \
  -H "x-workspace-id: workspace-1"
```

## Run Tests

```bash
npm test
```

This runs all 46 tests:
- 13 service tests (upload, summary generation, list/retrieve)
- 20 controller tests (HTTP endpoints, auth, error handling)
- 13 integration tests (DTO validation, status codes)

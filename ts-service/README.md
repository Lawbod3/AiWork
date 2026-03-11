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

### Architecture

**Layered design:**
- API endpoints handle HTTP requests
- Service layer enforces business logic and workspace access control
- Repositories manage database operations
- Queue service handles async jobs
- LLM provider abstraction allows swapping providers

**Key patterns:**
- Workspace scoping - users only see their own data
- Async processing - requests return immediately, jobs process in background
- Provider abstraction - LLM logic behind an interface (easy to test with fakes)
- Status tracking - pending → completed/failed

### Database Schema

**candidate_documents** - Stores uploaded documents
- id, candidate_id, workspace_id, document_type, file_name, storage_key, raw_text, uploaded_at

**candidate_summaries** - Stores generated summaries
- id, candidate_id, workspace_id, status (pending/completed/failed), score, strengths, concerns, summary, recommended_decision, provider, prompt_version, error_message, created_at, updated_at

### API Endpoints

- `POST /candidates/:candidateId/documents` - Upload document
- `POST /candidates/:candidateId/summaries/generate` - Request summary generation
- `GET /candidates/:candidateId/summaries` - List summaries
- `GET /candidates/:candidateId/summaries/:summaryId` - Get single summary

### Implementation Progress

- [x] Database migration (candidate_documents, candidate_summaries tables)
- [x] TypeORM entities (CandidateDocument, CandidateSummary)
- [x] TypeORM configuration (register entities and migrations)
- [ ] DTOs (input validation, response shapes)
- [ ] Service layer (business logic, access control)
- [ ] Controller (HTTP endpoints)
- [ ] Module (dependency injection)
- [ ] Worker (async job processing)
- [ ] LLM provider (Gemini integration)
- [ ] Tests (unit and integration)

### Design Decisions

**Why async processing?** Keeps API responsive. Users don't wait for LLM calls.

**Why workspace scoping?** Multi-tenant system. Users can only access their own data.

**Why provider abstraction?** Tests use fake provider (no external API calls). Easy to swap providers later.

**Why separate tables?** Normalized design. Prevents data duplication. Easier to query.

---

The assessment-specific candidate document and summary workflow is intentionally not implemented.

## Prerequisites

- Node.js 22+
- npm
- PostgreSQL running from repository root:

```bash
docker compose up -d postgres
```

## Setup

```bash
cd ts-service
npm install
cp .env.example .env
```

## Environment

- `PORT`
- `DATABASE_URL`
- `NODE_ENV`
- `GEMINI_API_KEY` (leave blank unless implementing a real provider)

Do not commit API keys or secrets.

Candidates may create a free Gemini API key through Google AI Studio for the full assessment implementation.

## Run Migrations

```bash
cd ts-service
npm run migration:run
```

## Run Service

```bash
cd ts-service
npm run start:dev
```

## Run Tests

```bash
cd ts-service
npm test
npm run test:e2e
```

## Fake Auth Headers

Sample endpoints in this starter are protected by a fake local auth guard.
Include these headers in requests:

- `x-user-id`: any non-empty string (example: `user-1`)
- `x-workspace-id`: workspace identifier used for scoping (example: `workspace-1`)

## Layout Highlights

- `src/auth/`: fake auth guard, user decorator, auth types
- `src/entities/`: starter entities
- `src/sample/`: tiny example module (controller/service/dto)
- `src/queue/`: in-memory queue abstraction
- `src/llm/`: provider interface + fake provider
- `src/migrations/`: TypeORM migration files

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

### Project Architecture & Structure

This implementation demonstrates **enterprise-level layered architecture** with clear separation of concerns:

```
src/
├── dto/                          # Data Transfer Objects (input/output validation)
│   └── candidates/               # Feature-scoped DTOs
│       ├── upload-document.dto.ts
│       ├── candidate-document.response.ts
│       └── candidate-summary.response.ts
├── services/                     # Business logic layer
│   └── candidates/
│       └── candidates.service.ts
├── utils/                        # Shared utilities
│   └── candidates/
│       └── mappers/              # Entity-to-DTO transformation
│           └── candidate.mapper.ts
├── controllers/                  # HTTP layer (to be added)
├── entities/                     # Database models
├── migrations/                   # Database versioning
├── auth/                         # Authentication
├── queue/                        # Async job processing
├── llm/                          # LLM provider abstraction
└── config/                       # Configuration
```

**Why this structure?**

1. **Feature-scoped organization** - Each feature (candidates, query, etc.) has its own DTOs, services, and utilities. Easy to find related code.

2. **Layered separation** - Each layer has a single responsibility:
   - `dto/` - Input validation and response contracts
   - `services/` - Business logic and data access
   - `utils/` - Reusable transformations (mappers)
   - `controllers/` - HTTP handling (coming next)

3. **Scalability** - Adding new services is straightforward:
   ```
   src/
   ├── dto/
   │   ├── candidates/
   │   └── query/              # New feature
   ├── services/
   │   ├── candidates/
   │   └── query/              # New feature
   └── utils/
       ├── candidates/
       └── query/              # New feature
   ```

4. **Testability** - Each layer can be tested independently:
   - DTOs tested for validation rules
   - Services tested with mocked dependencies
   - Mappers tested for transformation logic

5. **Maintainability** - Clear boundaries make code easier to understand and modify.

### Architecture Layers Explained

**DTO Layer** (`src/dto/candidates/`)
- Validates incoming requests using class-validator decorators
- Defines response shapes for API contracts
- Prevents invalid data from reaching business logic
- Hides internal fields from API responses

**Service Layer** (`src/services/candidates/`)
- Contains all business logic
- Enforces workspace access control (multi-tenancy)
- Manages database operations via repositories
- Integrates with queue for async processing
- Handles errors gracefully

**Mapper Layer** (`src/utils/candidates/mappers/`)
- Transforms database entities to DTOs
- Handles JSON serialization/deserialization
- Keeps transformation logic separate from services
- Reusable across multiple services if needed

**Controller Layer** (coming next)
- Handles HTTP requests/responses
- Extracts auth context from headers
- Calls service methods
- Returns appropriate HTTP status codes

### Design Decisions

**Why async processing?** Keeps API responsive. Users don't wait for LLM calls.

**Why workspace scoping?** Multi-tenant system. Users can only access their own data.

**Why provider abstraction?** Tests use fake provider (no external API calls). Easy to swap providers later.

**Why separate tables?** Normalized design. Prevents data duplication. Easier to query.

**Why layered architecture?** Enterprise pattern that scales. Each layer has one job. Easy to test, maintain, and extend.

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
- [x] DTOs (input validation, response shapes)
- [x] Service layer (business logic, access control)
- [x] Mapper layer (entity transformation)
- [ ] Controller (HTTP endpoints)
- [ ] Module (dependency injection)
- [ ] Worker (async job processing)
- [ ] LLM provider (Gemini integration)
- [ ] Tests (unit and integration)

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
cd ts-service
npm test
npm run test:e2e
```

## Layout Highlights

- `src/auth/`: fake auth guard, user decorator, auth types
- `src/entities/`: starter entities
- `src/sample/`: tiny example module (controller/service/dto)
- `src/queue/`: in-memory queue abstraction
- `src/llm/`: provider interface + fake provider
- `src/migrations/`: TypeORM migration files

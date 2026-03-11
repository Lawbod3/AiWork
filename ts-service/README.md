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

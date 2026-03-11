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
- [x] Tests (54 tests passing)
- [x] Worker (async job processing)
- [x] LLM provider (Gemini integration)

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
- `GEMINI_API_KEY` - Google Gemini API key (for LLM summary generation)

## Gemini API Setup (Optional)

To enable real LLM-powered summary generation:

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Restart the service

**Without Gemini API key:** The service uses a fake provider (returns mock summaries).

**With Gemini API key:** Real summaries are generated using Google Gemini API.

**Tests:** Always use the fake provider (no external API calls).

**Note:** Do not commit API keys to git. Use `.env` file (already in .gitignore).

## LLM Provider Documentation

### Provider Used
**Google Gemini API** (gemini-1.5-flash model)

### Configuration
- **Environment Variable:** `GEMINI_API_KEY`
- **Setup:** Get free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Local Development:** Add key to `.env` file (optional - fake provider used if not set)
- **Production:** Set `GEMINI_API_KEY` environment variable

### How It Works
1. Candidate documents are sent to Gemini API with a structured prompt
2. Gemini analyzes documents and returns JSON with:
   - `score` (0-100): Overall candidate assessment
   - `strengths` (array): Key strengths identified
   - `concerns` (array): Potential concerns
   - `summary` (string): Professional summary
   - `recommendedDecision` (advance/hold/reject): Recommendation
3. Response is validated and stored in database
4. Status transitions: pending → completed (or failed on error)

### Assumptions & Limitations
- **Prompt Language:** English only
- **Document Size:** Handles typical resumes/cover letters (< 10KB per document)
- **Response Format:** Expects valid JSON from Gemini
- **Error Handling:** Failed API calls mark summary as failed (not retried automatically)
- **Rate Limiting:** Subject to Gemini API free tier limits
- **Fallback:** If API fails or key is missing, fake provider returns mock data

### Testing
- **Unit Tests:** Use `FakeSummarizationProvider` (no API calls)
- **Integration Tests:** Use `FakeSummarizationProvider` (no API calls)
- **Manual Testing:** Set `GEMINI_API_KEY` to test real Gemini integration

### Provider Implementation
- **Real:** `src/llm/gemini.provider.ts` - Calls Gemini API
- **Fake:** `src/llm/fake-summarization.provider.ts` - Returns mock data
- **Selection:** Automatic based on `GEMINI_API_KEY` presence

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

## End-to-End Testing (With Real Gemini)

To test the complete workflow with real LLM summaries:

1. **Get Gemini API key:**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Configure the service:**
   ```bash
   # Add to .env
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the service:**
   ```bash
   npm run start:dev
   ```

4. **Upload a candidate document:**
   ```bash
   curl -X POST http://localhost:3000/candidates/cand-123/documents \
     -H "x-user-id: user-1" \
     -H "x-workspace-id: workspace-1" \
     -H "Content-Type: application/json" \
     -d '{
       "documentType": "resume",
       "fileName": "john_doe_resume.pdf",
       "rawText": "John Doe\nSoftware Engineer\n\nExperience:\n- 5 years as full-stack developer\n- Led team of 3 engineers\n- Built microservices architecture\n\nSkills: TypeScript, NestJS, React, PostgreSQL, AWS"
     }'
   ```
   
   Response includes `summaryId` (save this for later).

5. **Request summary generation:**
   ```bash
   curl -X POST http://localhost:3000/candidates/cand-123/summaries/generate \
     -H "x-user-id: user-1" \
     -H "x-workspace-id: workspace-1"
   ```
   
   Response: `{ "id": "summary-id", "status": "pending", ... }`

6. **Process pending summaries (trigger worker):**
   ```bash
   curl -X POST http://localhost:3000/workers/candidate-summaries
   ```
   
   This processes all pending jobs in the queue. Gemini API is called here.

7. **Check the summary result:**
   ```bash
   curl -X GET http://localhost:3000/candidates/cand-123/summaries/summary-id \
     -H "x-user-id: user-1" \
     -H "x-workspace-id: workspace-1"
   ```
   
   Response now includes:
   - `status: "completed"`
   - `score: 85` (LLM assessment)
   - `strengths: ["Strong technical background", ...]`
   - `concerns: ["Limited management experience"]`
   - `summary: "Solid engineer with leadership potential"`
   - `recommendedDecision: "advance"`

**Without Gemini API key:** The service uses fake provider (returns mock data). Useful for testing without API calls.

## Run Tests

```bash
npm test
```

This runs all 46 tests:
- 13 service tests (upload, summary generation, list/retrieve)
- 20 controller tests (HTTP endpoints, auth, error handling)
- 13 integration tests (DTO validation, status codes)

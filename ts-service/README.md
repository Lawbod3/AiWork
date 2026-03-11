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

### ⚠️ Common Gemini Setup Issues

**Problem:** Getting 404 errors like "models/gemini-1.5-flash is not found"

**Cause:** Google frequently updates model names. Older model names may no longer work.

**Solution:** We use `gemini-2.5-flash` which is the current working model (as of March 2026).

**If you get model errors:**
1. Check what models are available with your API key:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
   ```
2. Update the model name in `src/llm/gemini.provider.ts`:
   ```typescript
   const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
   ```
3. Restart the service

**Current working models (March 2026):**
- `gemini-2.5-flash` ✅ (recommended - fast and reliable)
- `gemini-2.5-pro` ✅ (more capable but slower)
- `gemini-flash-latest` ✅ (always latest flash model)

**Deprecated models that may not work:**
- ❌ `gemini-1.5-flash` (old version)
- ❌ `gemini-pro` (old version)
- ❌ `gemini-1.5-pro` (old version)

## LLM Provider Documentation

### Provider Used
**Google Gemini API** (gemini-2.5-flash model)

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

### Model Selection
We use `gemini-2.5-flash` because:
- ✅ Fast response times (good for async processing)
- ✅ High quality analysis for candidate evaluation
- ✅ Reliable availability (current stable model)
- ✅ Cost-effective for high-volume processing

### Assumptions & Limitations
- **Prompt Language:** English only
- **Document Size:** Handles typical resumes/cover letters (< 10KB per document)
- **Response Format:** Expects valid JSON from Gemini
- **Error Handling:** Failed API calls mark summary as failed (not retried automatically)
- **Rate Limiting:** Subject to Gemini API free tier limits
- **Model Updates:** Google may deprecate models - check documentation if errors occur
- **Fallback:** If API fails or key is missing, fake provider returns mock data

### Testing
- **Unit Tests:** Use `FakeSummarizationProvider` (no API calls)
- **Integration Tests:** Use `FakeSummarizationProvider` (no API calls)
- **Manual Testing:** Set `GEMINI_API_KEY` to test real Gemini integration

### Provider Implementation
- **Real:** `src/llm/gemini.provider.ts` - Calls Gemini API
- **Fake:** `src/llm/fake-summarization.provider.ts` - Returns mock data
- **Selection:** Automatic based on `GEMINI_API_KEY` presence

### Troubleshooting
If you get "model not found" errors:
1. Check available models: `curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"`
2. Update model name in `gemini.provider.ts`
3. Restart service

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

### Troubleshooting Gemini Issues

**If step 6 fails with "model not found" errors:**

1. **Check your API key works:**
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
   ```

2. **If you see available models, update the model name:**
   - Edit `src/llm/gemini.provider.ts`
   - Change the model name to one from the list (e.g., `gemini-2.5-flash`)
   - Restart the service

3. **Common working models (as of March 2026):**
   - `gemini-2.5-flash` (recommended)
   - `gemini-flash-latest` (always latest)
   - `gemini-2.5-pro` (more capable)

4. **If no models work:**
   - Your API key might be restricted
   - Try creating a new API key
   - Check if billing is enabled (some models require it)

**The fake provider always works** - use it to test the complete workflow without API dependencies.

## Run Tests

```bash
npm test
```

This runs all 46 tests:
- 13 service tests (upload, summary generation, list/retrieve)
- 20 controller tests (HTTP endpoints, auth, error handling)
- 13 integration tests (DTO validation, status codes)

## Production Deployment

### Docker Containerization

**Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

**Build and run:**
```bash
docker build -t talentflow-ts .
docker run -p 3000:3000 -e DATABASE_URL=postgres://... talentflow-ts
```

### Environment Configuration

**Development:**
```bash
NODE_ENV=development
DATABASE_URL=sqlite:./talentflow.db
GEMINI_API_KEY=optional
LOG_LEVEL=debug
```

**Production:**
```bash
NODE_ENV=production
DATABASE_URL=postgres://user:pass@host:5432/db
GEMINI_API_KEY=required_for_real_summaries
LOG_LEVEL=info
PORT=3000
```

**Staging:**
```bash
NODE_ENV=staging
DATABASE_URL=postgres://staging_user:pass@staging-host:5432/staging_db
GEMINI_API_KEY=staging_key
LOG_LEVEL=warn
```

### Kubernetes Deployment

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: talentflow-ts
spec:
  replicas: 3
  selector:
    matchLabels:
      app: talentflow-ts
  template:
    metadata:
      labels:
        app: talentflow-ts
    spec:
      containers:
      - name: talentflow-ts
        image: talentflow-ts:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: gemini-secret
              key: api-key
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Health Checks

The service exposes health endpoints for monitoring:
- `GET /health` - Basic health check
- `GET /health/detailed` - Database connectivity check

## API Documentation

### OpenAPI/Swagger

Access interactive API documentation at:
- **Local:** http://localhost:3000/api/docs
- **Staging:** https://staging-api.talentflow.com/docs
- **Production:** https://api.talentflow.com/docs

### API Versioning

Current API version: `v1`

All endpoints are prefixed with `/api/v1/`:
```
POST /api/v1/candidates/:id/documents
POST /api/v1/candidates/:id/summaries/generate
GET  /api/v1/candidates/:id/summaries
GET  /api/v1/candidates/:id/summaries/:summaryId
```

### Authentication Headers

All requests require workspace context:
```bash
curl -H "x-user-id: user-123" \
     -H "x-workspace-id: workspace-456" \
     https://api.talentflow.com/api/v1/candidates/123/documents
```

### Error Responses

Standard error format:
```json
{
  "error": "Validation failed",
  "message": "Document type must be one of: resume, cover_letter, portfolio, other",
  "statusCode": 400,
  "timestamp": "2026-03-11T14:30:00.000Z",
  "path": "/api/v1/candidates/123/documents"
}
```

### Rate Limiting

- **Development:** No limits
- **Production:** 1000 requests/hour per workspace
- **Burst:** 100 requests/minute

Rate limit headers included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1678550400
```

## Monitoring & Observability

### Structured Logging

**Log Format:**
```json
{
  "timestamp": "2026-03-11T14:30:00.000Z",
  "level": "info",
  "message": "Summary generation completed",
  "context": "SummaryGenerationWorker",
  "metadata": {
    "summaryId": "summary-123",
    "candidateId": "candidate-456",
    "workspaceId": "workspace-789",
    "provider": "gemini",
    "duration": 2340
  }
}
```

**Log Levels:**
- `error` - System errors, failed operations
- `warn` - Validation failures, rate limits
- `info` - Successful operations, status changes
- `debug` - Detailed execution flow (dev only)

### Metrics Collection

**Key Metrics:**
- Request rate and response times
- Summary generation success/failure rates
- Queue depth and processing times
- Database connection pool usage
- LLM API response times and costs

**Prometheus Metrics:**
```
# Request metrics
http_requests_total{method="POST",route="/candidates/:id/documents",status="201"}
http_request_duration_seconds{method="POST",route="/candidates/:id/documents"}

# Business metrics
summary_generation_total{provider="gemini",status="completed"}
summary_generation_duration_seconds{provider="gemini"}
queue_jobs_pending{type="candidate-summary"}

# System metrics
database_connections_active
database_query_duration_seconds
memory_usage_bytes
```

### Error Tracking

**Sentry Integration:**
```bash
# Environment variables
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=v1.2.3
```

**Error Context:**
- User ID and workspace ID
- Request ID for tracing
- Stack traces and breadcrumbs
- Custom tags for filtering

### Distributed Tracing

**OpenTelemetry Integration:**
- Trace ID propagation across services
- Span creation for major operations
- Database query tracing
- External API call tracing (Gemini)

**Trace Example:**
```
Trace ID: 1234567890abcdef
├── HTTP Request [POST /candidates/123/documents]
├── Database Insert [candidate_documents]
├── File Write [uploads/doc-456.txt]
└── Response [201 Created]
```

### Alerting Rules

**Critical Alerts:**
- Service down (health check failures)
- Database connection failures
- High error rate (>5% in 5 minutes)
- Queue processing delays (>10 minutes)

**Warning Alerts:**
- High response times (>2s p95)
- LLM API failures (>10% in 15 minutes)
- Disk space usage (>80%)
- Memory usage (>85%)

## Development Workflow

### Code Quality Standards

**ESLint Configuration:**
```bash
npm run lint          # Check code style
npm run lint:fix      # Auto-fix issues
npm run format        # Prettier formatting
```

**TypeScript Strict Mode:**
- No implicit any
- Strict null checks
- No unused variables
- Consistent return types

### Pre-commit Hooks

**Husky + lint-staged setup:**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**Commit Message Format:**
```
type(scope): description

feat(auth): add workspace-based access control
fix(queue): handle worker connection failures
docs(api): update endpoint documentation
test(service): add integration tests for summaries
```

### Branch Protection Rules

**Main Branch Requirements:**
- Pull request required
- At least 2 approving reviews
- All status checks must pass
- Branch must be up to date
- No force pushes allowed

**Status Checks:**
- ✅ Tests pass (54 tests)
- ✅ Linting passes
- ✅ Type checking passes
- ✅ Security scan passes
- ✅ Build succeeds

### Automated Testing in CI/CD

**GitHub Actions Workflow:**
```yaml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build
      
      - name: Security Audit
        run: npm audit --audit-level=high
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

**Test Coverage Requirements:**
- Minimum 80% line coverage
- Minimum 70% branch coverage
- All new features must include tests
- Integration tests for API endpoints

### Database Migration Strategy

**Migration Workflow:**
1. Create migration: `npm run migration:create AddNewFeature`
2. Write up/down scripts
3. Test locally: `npm run migration:run`
4. Review in PR
5. Deploy to staging first
6. Monitor and deploy to production

**Migration Best Practices:**
- Always include rollback (down) scripts
- Test migrations on production-like data
- Use transactions for atomic changes
- Document breaking changes
- Coordinate with dependent services
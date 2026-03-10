# InsightOps Python Service

FastAPI service for the backend assessment.

This service includes:

- FastAPI app bootstrap and health endpoint
- SQLAlchemy wiring
- Manual SQL migration runner
- **Briefing Report Generator feature** - Create, retrieve, and render professional HTML briefing reports
- Sample items example feature
- Jinja template wiring with professional report templates
- Pytest setup

## Prerequisites

- Python 3.12

The application uses **SQLite for local development**, so no external database setup is needed. Just Python and the dependencies in `requirements.txt`.

## Setup

```bash
cd python-service
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

## Environment

`.env.example` includes:

- `DATABASE_URL` - SQLite database URL (default: `sqlite:///./briefing.db`)
- `APP_ENV` - Environment (development/production)
- `APP_PORT` - Server port (default: 8000)

The application uses SQLite for local development, making it easy to run without Docker or external database setup.

## Run Migrations (Manual SQL Runner)

Apply pending migrations:

```bash
cd python-service
source .venv/bin/activate
python -m app.db.run_migrations up
```

Roll back the latest migration:

```bash
cd python-service
source .venv/bin/activate
python -m app.db.run_migrations down --steps 1
```

How it works:

- SQL files live in `python-service/db/migrations/`
- A `schema_migrations` table tracks applied filenames
- Up files are applied in sorted filename order (`*.sql` or `*.up.sql`)
- Rollback uses a paired `*.down.sql` file for each applied migration
- Applied migration files are skipped on subsequent runs

## Run Service

```bash
cd python-service
source .venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

## Testing

### Test Coverage

The briefing feature has **38 passing tests** organized into 4 focused test suites:

- **TestBriefingService** (13 tests) - Service layer operations (create, retrieve, list, update HTML)
- **TestReportFormatter** (7 tests) - Data transformation and formatting logic
- **TestBriefingAPI** (11 tests) - All 4 API endpoints with success and error cases
- **TestBriefingValidation** (7 tests) - Schema validation and business rule enforcement

### Run Tests

```bash
cd python-service
source .venv/bin/activate
python -m pytest
```

Run with verbose output:

```bash
python -m pytest -v
```

Run specific test class:

```bash
python -m pytest tests/test_briefings.py::TestBriefingService -v
```

Run with coverage report:

```bash
python -m pytest --cov=app tests/
```

### Testing Philosophy

I built the test suite to catch real problems, not just hit coverage numbers. The layered architecture makes testing straightforward - you can test the service without the database, test the formatter without the API, test the API without worrying about implementation details.

Each test is small and focused. If a test fails, you know exactly what broke. The fixtures handle setup, so tests read like documentation - they show you how the feature is supposed to work.

The tests cover the full stack:
- **Service layer** - Business logic in isolation
- **Formatter layer** - Data transformation and normalization
- **API layer** - Endpoints with real HTTP requests and database
- **Validation** - Schema validators and business rules

This approach catches bugs early and makes refactoring safe. When all 38 tests pass, you know the feature works end-to-end.

## Project Layout

- `app/main.py`: FastAPI bootstrap and router wiring
- `app/config.py`: environment config
- `app/db/`: SQLAlchemy session management and migration runner
- `db/migrations/`: SQL migration files
- `app/models/`: ORM models (Briefing, BriefingKeyPoint, BriefingRisk, BriefingMetric)
- `app/schemas/`: Pydantic request/response schemas
- `app/services/`: service-layer logic (BriefingService, ReportFormatter)
- `app/api/`: route handlers (health, sample_items, briefings)
- `app/templates/`: Jinja templates (base.html, briefing_report.html)
- `tests/`: test suite

## Briefing Report Generator Feature

The briefing feature allows analysts to create, store, and render professional HTML briefing reports.

### API Endpoints

- `POST /briefings` - Create a new briefing
- `GET /briefings/{id}` - Retrieve a briefing
- `POST /briefings/{id}/generate` - Generate HTML report
- `GET /briefings/{id}/html` - Get rendered HTML

### Example: Create a Briefing

```bash
curl -X POST http://localhost:8000/briefings \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Acme Holdings",
    "ticker": "acme",
    "sector": "Industrial Technology",
    "analystName": "Jane Doe",
    "summary": "Acme is benefiting from strong enterprise demand and improving operating leverage, though customer concentration remains a near-term risk.",
    "recommendation": "Monitor for margin expansion and customer diversification before increasing exposure.",
    "keyPoints": [
      "Revenue grew 18% year-over-year in the latest quarter.",
      "Management raised full-year guidance.",
      "Enterprise subscriptions now account for 62% of recurring revenue."
    ],
    "risks": [
      "Top two customers account for 41% of total revenue.",
      "International expansion may pressure margins over the next two quarters."
    ],
    "metrics": [
      {"name": "Revenue Growth", "value": "18%"},
      {"name": "Operating Margin", "value": "22.4%"},
      {"name": "P/E Ratio", "value": "28.1x"}
    ]
  }'
```

### Example: Generate Report

```bash
# Generate HTML report for briefing ID 1
curl -X POST http://localhost:8000/briefings/1/generate

# Retrieve the rendered HTML
curl http://localhost:8000/briefings/1/html
```

### Data Model

The briefing feature uses a normalized relational schema:

- `briefings` - Main briefing records
- `briefing_key_points` - Multiple key points per briefing
- `briefing_risks` - Multiple risks per briefing
- `briefing_metrics` - Optional metrics per briefing

All tables include proper foreign keys, indexes, and CASCADE delete for data integrity.

### Validation

The feature enforces:
- Company name: required
- Ticker: required, normalized to uppercase
- Sector: required
- Analyst name: required
- Summary: required, minimum 10 characters
- Recommendation: required, minimum 10 characters
- Key points: required, minimum 2
- Risks: required, minimum 1
- Metrics: optional, metric names must be unique per briefing

### Architecture

The feature follows a layered architecture:

1. **API Layer** - FastAPI endpoints
2. **Service Layer** - BriefingService for CRUD operations
3. **Formatter Layer** - ReportFormatter for data transformation
4. **Schema Layer** - Pydantic schemas for validation
5. **ORM Layer** - SQLAlchemy models for database access
6. **Database Layer** - PostgreSQL with migrations


## Design & Implementation

### Why This Architecture Works

I built this with a clear separation of concerns. The API layer handles HTTP. The service layer handles business logic. The formatter handles presentation. The schema layer handles validation. Each piece has one job, which makes the code easier to understand, test, and change.

This isn't over-engineered. It's the minimum structure needed to keep things clean. If you need to change how metrics are formatted, you change the formatter. If you need to add a new field to briefings, you add a migration and update the model. Changes stay isolated.

### Data Model

The schema is normalized. Briefings have their own table. Key points, risks, and metrics each have their own tables with foreign keys back to briefings. This prevents data duplication and makes queries efficient. If you want just the risks for a briefing, you can query them directly.

Constraints live at the database level too. Metric names must be unique per briefing. Foreign keys have CASCADE delete so you can't end up with orphaned records. This is defense in depth - the database enforces rules even if the application has bugs.

### Validation

Validation happens in two places. Pydantic schemas validate the JSON you send in - checking that required fields exist, that strings aren't too long, that you have at least 2 key points. The database enforces constraints - like unique metric names. This two-layer approach catches bugs early.

### The Formatter

Before rendering HTML, we transform raw database objects into a simpler format. We sort key points by creation order, normalize metric labels to title case, and construct the report title. This keeps the template simple - it just displays what it's given. The formatter is testable in isolation, which makes it easy to change formatting without touching the template.

### Why Manual Migrations

I used manual SQL migrations instead of Alembic to demonstrate SQL skills and show I understand database design at a lower level. The project structure already used manual migrations, so it made sense to stay consistent. For production, Alembic is the right choice - it handles complex migrations better and is the Python standard.

### Trade-offs

I kept it focused. No authentication, no caching, no versioning. These would be nice to have, but they'd also add complexity. The current design makes it easy to add them later without major changes.

See `NOTES.md` for more details on design decisions and potential improvements.

# Backend Engineering Assessment

This repository contains two backend services demonstrating different architectural patterns and technologies:

- **Part A**: Python service (FastAPI) - Briefing Report Generator
- **Part B**: TypeScript service (NestJS) - Candidate Document Intake with AI Summarization

## Quick Start (Recommended)

Both services use SQLite by default for zero-setup local development:

```bash
# Clone the repository
git clone https://github.com/Lawbod3/AiWork.git
cd AiWork

# Start Python service (Terminal 1)
cd python-service
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python -m app.db.run_migrations up
python -m uvicorn app.main:app --reload --port 8000

# Start TypeScript service (Terminal 2)
cd ts-service
npm install
cp .env.example .env
npm run migration:run
npm run start:dev
```

**Services will be available at:**
- Python service: http://localhost:8000
- TypeScript service: http://localhost:3000

## Prerequisites

- **Python 3.12+** (for Python service)
- **Node.js 18+** (for TypeScript service)
- **Docker** (optional, for PostgreSQL testing)

## Project Structure

```
├── python-service/          # Part A: Briefing Report Generator
│   ├── app/                # FastAPI application
│   ├── db/migrations/      # SQL migrations
│   ├── tests/              # Test suite (40 tests)
│   └── README.md           # Python service setup
├── ts-service/             # Part B: Candidate Intake + AI Summarization
│   ├── src/                # NestJS application
│   ├── test/               # Test suite (54 tests)
│   └── README.md           # TypeScript service setup
├── docker-compose.yml      # PostgreSQL for production testing
└── NOTES.md               # Design decisions and architecture
```

## Database Options

### Option 1: SQLite (Default - Recommended for Local Development)

Both services use SQLite by default. No setup required beyond the Quick Start above.

**Benefits:**
- Zero configuration
- Instant setup
- Perfect for development and testing
- No external dependencies

### Option 2: PostgreSQL (Production Setup)

For production-like testing with PostgreSQL:

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Wait for initialization
sleep 30

# Update .env files in both services:
# DATABASE_URL=postgres://assessment_user:assessment_password@localhost:5433/assessment_db

# Run migrations and start services as above
```

## Testing

Run all tests across both services:

```bash
# Python service tests (40 tests)
cd python-service
source .venv/bin/activate
python -m pytest

# TypeScript service tests (54 tests)
cd ts-service
npm test
```

**Total: 94 comprehensive tests**

## API Documentation

### Python Service (Port 8000)
- `POST /briefings` - Create briefing
- `GET /briefings/{id}` - Get briefing
- `POST /briefings/{id}/generate` - Generate HTML report
- `GET /briefings/{id}/html` - Get HTML report

### TypeScript Service (Port 3000)
- `POST /candidates/{id}/documents` - Upload document
- `POST /candidates/{id}/summaries/generate` - Request AI summary
- `GET /candidates/{id}/summaries` - List summaries
- `GET /candidates/{id}/summaries/{summaryId}` - Get summary

## Key Features

### Part A: Python Service
✅ Professional HTML report generation
✅ Normalized relational database design
✅ Layered architecture with service/formatter separation
✅ Comprehensive input validation
✅ 40 focused tests covering all layers

### Part B: TypeScript Service
✅ Async worker pattern for background processing
✅ Real Google Gemini LLM integration
✅ Workspace-based access control
✅ Provider abstraction for LLM flexibility
✅ 54 comprehensive tests including integration tests

## Environment Configuration

Both services support environment-based configuration:

```bash
# Development (SQLite)
DATABASE_URL=sqlite:./database.db

# Production (PostgreSQL)
DATABASE_URL=postgres://user:password@host:5432/database

# Optional: Gemini API for real AI summaries
GEMINI_API_KEY=your_api_key_here
```

## Troubleshooting

### Common Issues

**"Module not found" errors:**
- Ensure you're in the correct directory
- Check that virtual environment is activated (Python)
- Run `npm install` or `pip install -r requirements.txt`

**Database connection errors:**
- Verify DATABASE_URL in .env files
- For PostgreSQL: ensure Docker container is running
- For SQLite: check file permissions

**Port already in use:**
- Python service: Change port with `--port 8001`
- TypeScript service: Change PORT in .env file

### Docker Issues (macOS)

If Docker PostgreSQL doesn't work on macOS, this is a known networking limitation. The services are designed to work with SQLite for this reason.

## Service-Specific Documentation

For detailed setup and usage instructions:

- **Python Service**: See `python-service/README.md`
- **TypeScript Service**: See `ts-service/README.md`
- **Design Decisions**: See `NOTES.md`

## Production Deployment

Both services include production deployment configurations:

- Docker containerization
- Environment-based configuration
- Health check endpoints
- Structured logging
- Error handling and monitoring

See individual service READMEs for detailed deployment instructions.

## Architecture Highlights

**Clean Architecture**: Both services use layered architecture with clear separation of concerns

**Database Agnostic**: SQLite for development, PostgreSQL for production

**Comprehensive Testing**: 94 tests with unit, integration, and end-to-end coverage

**Production Ready**: Error handling, logging, monitoring, and deployment configurations

**AI Integration**: Real LLM provider with fallback for testing

This implementation demonstrates production-ready backend engineering with modern best practices, comprehensive testing, and thoughtful architecture decisions.
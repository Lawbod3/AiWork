from collections.abc import Generator
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Briefing, BriefingKeyPoint, BriefingMetric, BriefingRisk
from app.schemas import BriefingCreate, BriefingReport
from app.services.briefing_service import BriefingService
from app.services.report_formatter import ReportFormatter


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    """Create a test client with in-memory SQLite database."""
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Create a test database session."""
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    Base.metadata.create_all(bind=engine)

    db = testing_session_local()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def valid_briefing_payload() -> dict:
    """Create a valid briefing payload for testing (camelCase - as clients send it)."""
    return {
        "companyName": "Acme Holdings",
        "ticker": "acme",
        "sector": "Industrial Technology",
        "analystName": "Jane Doe",
        "summary": "Acme is benefiting from strong enterprise demand and improving operating leverage.",
        "recommendation": "Monitor for margin expansion and customer diversification before increasing exposure.",
        "keyPoints": [
            "Revenue grew 18% year-over-year in the latest quarter.",
            "Management raised full-year guidance.",
        ],
        "risks": [
            "Top two customers account for 41% of total revenue.",
        ],
        "metrics": [
            {"name": "Revenue Growth", "value": "18%"},
            {"name": "Operating Margin", "value": "22.4%"},
        ],
    }


@pytest.fixture()
def valid_api_payload() -> dict:
    """Create a valid briefing payload for API testing (camelCase for JSON)."""
    return {
        "companyName": "Acme Holdings",
        "ticker": "acme",
        "sector": "Industrial Technology",
        "analystName": "Jane Doe",
        "summary": "Acme is benefiting from strong enterprise demand and improving operating leverage.",
        "recommendation": "Monitor for margin expansion and customer diversification before increasing exposure.",
        "keyPoints": [
            "Revenue grew 18% year-over-year in the latest quarter.",
            "Management raised full-year guidance.",
        ],
        "risks": [
            "Top two customers account for 41% of total revenue.",
        ],
        "metrics": [
            {"name": "Revenue Growth", "value": "18%"},
            {"name": "Operating Margin", "value": "22.4%"},
        ],
    }


# ============================================================================
# BriefingService Tests
# ============================================================================


class TestBriefingService:
    """Test suite for BriefingService."""

    def test_create_briefing_success(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test creating a briefing with valid data."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)

        result = service.create_briefing(payload)

        assert result.id is not None
        assert result.company_name == "Acme Holdings"
        assert result.ticker == "ACME"  # Should be uppercased
        assert result.sector == "Industrial Technology"
        assert result.analyst_name == "Jane Doe"
        assert len(result.key_points) == 2
        assert len(result.risks) == 1
        assert len(result.metrics) == 2

    def test_create_briefing_ticker_normalized(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test that ticker is normalized to uppercase."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)

        result = service.create_briefing(payload)

        assert result.ticker == "ACME"

    def test_create_briefing_with_no_metrics(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test creating a briefing without metrics."""
        service = BriefingService(db_session)
        payload_dict = valid_briefing_payload.copy()
        payload_dict["metrics"] = None
        payload = BriefingCreate(**payload_dict)

        result = service.create_briefing(payload)

        assert result.id is not None
        assert len(result.metrics) == 0

    def test_get_briefing_success(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test retrieving a briefing by ID."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)
        created = service.create_briefing(payload)

        result = service.get_briefing(created.id)

        assert result is not None
        assert result.id == created.id
        assert result.company_name == "Acme Holdings"

    def test_get_briefing_not_found(self, db_session: Session) -> None:
        """Test retrieving a non-existent briefing."""
        service = BriefingService(db_session)

        result = service.get_briefing(999)

        assert result is None

    def test_list_briefings_empty(self, db_session: Session) -> None:
        """Test listing briefings when none exist."""
        service = BriefingService(db_session)

        result = service.list_briefings()

        assert result == []

    def test_list_briefings_multiple(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test listing multiple briefings."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)

        service.create_briefing(payload)
        service.create_briefing(payload)
        service.create_briefing(payload)

        result = service.list_briefings()

        assert len(result) == 3

    def test_list_briefings_sorted_by_created_at(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test that briefings are sorted by creation date (newest first)."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)

        first = service.create_briefing(payload)
        second = service.create_briefing(payload)
        third = service.create_briefing(payload)

        result = service.list_briefings()

        assert result[0].id == third.id
        assert result[1].id == second.id
        assert result[2].id == first.id

    def test_get_briefing_by_id_or_raise_success(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test retrieving a briefing or raising exception."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)
        created = service.create_briefing(payload)

        result = service.get_briefing_by_id_or_raise(created.id)

        assert result.id == created.id

    def test_get_briefing_by_id_or_raise_not_found(self, db_session: Session) -> None:
        """Test that exception is raised for non-existent briefing."""
        service = BriefingService(db_session)

        with pytest.raises(ValueError, match="Briefing with id 999 not found"):
            service.get_briefing_by_id_or_raise(999)

    def test_update_briefing_html(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test updating a briefing with HTML content."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)
        created = service.create_briefing(payload)

        html_content = "<html><body>Test Report</body></html>"
        result = service.update_briefing_html(created.id, html_content)

        assert result.html_content == html_content
        assert result.generated_at is not None

    def test_get_html_content_success(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test retrieving HTML content."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)
        created = service.create_briefing(payload)

        html_content = "<html><body>Test Report</body></html>"
        service.update_briefing_html(created.id, html_content)

        result = service.get_html_content(created.id)

        assert result == html_content

    def test_get_html_content_not_generated(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test retrieving HTML when not yet generated."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)
        created = service.create_briefing(payload)

        result = service.get_html_content(created.id)

        assert result is None


# ============================================================================
# ReportFormatter Tests
# ============================================================================


class TestReportFormatter:
    """Test suite for ReportFormatter."""

    def test_format_briefing_to_report_success(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test formatting a briefing to report view model."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)
        briefing = service.get_briefing_by_id_or_raise(service.create_briefing(payload).id)

        report = ReportFormatter.format_briefing_to_report(briefing)

        assert isinstance(report, BriefingReport)
        assert report.title == "Briefing Report: Acme Holdings (ACME)"
        assert report.company_name == "Acme Holdings"
        assert report.ticker == "ACME"

    def test_format_briefing_title_construction(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test that report title is constructed correctly."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)
        briefing = service.get_briefing_by_id_or_raise(service.create_briefing(payload).id)

        report = ReportFormatter.format_briefing_to_report(briefing)

        assert report.title == "Briefing Report: Acme Holdings (ACME)"

    def test_format_key_points_sorted(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test that key points are sorted by display_order."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)
        briefing = service.get_briefing_by_id_or_raise(service.create_briefing(payload).id)

        report = ReportFormatter.format_briefing_to_report(briefing)

        assert len(report.key_points) == 2
        assert report.key_points[0] == "Revenue grew 18% year-over-year in the latest quarter."
        assert report.key_points[1] == "Management raised full-year guidance."

    def test_format_risks_sorted(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test that risks are sorted by display_order."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)
        briefing = service.get_briefing_by_id_or_raise(service.create_briefing(payload).id)

        report = ReportFormatter.format_briefing_to_report(briefing)

        assert len(report.risks) == 1
        assert report.risks[0] == "Top two customers account for 41% of total revenue."

    def test_format_metrics_normalized(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test that metric labels are normalized to title case."""
        service = BriefingService(db_session)
        payload = BriefingCreate(**valid_briefing_payload)
        briefing = service.get_briefing_by_id_or_raise(service.create_briefing(payload).id)

        report = ReportFormatter.format_briefing_to_report(briefing)

        assert len(report.metrics) == 2
        assert report.metrics[0]["name"] == "Revenue Growth"
        assert report.metrics[0]["value"] == "18%"
        assert report.metrics[1]["name"] == "Operating Margin"
        assert report.metrics[1]["value"] == "22.4%"

    def test_format_metrics_empty(self, db_session: Session, valid_briefing_payload: dict) -> None:
        """Test formatting when no metrics exist."""
        service = BriefingService(db_session)
        payload_dict = valid_briefing_payload.copy()
        payload_dict["metrics"] = None
        payload = BriefingCreate(**payload_dict)
        briefing = service.get_briefing_by_id_or_raise(service.create_briefing(payload).id)

        report = ReportFormatter.format_briefing_to_report(briefing)

        assert report.metrics == []

    def test_normalize_metric_label(self) -> None:
        """Test metric label normalization."""
        result = ReportFormatter._normalize_metric_label("revenue growth")
        assert result == "Revenue Growth"

        result = ReportFormatter._normalize_metric_label("  operating margin  ")
        assert result == "Operating Margin"

        result = ReportFormatter._normalize_metric_label("p/e ratio")
        assert result == "P/E Ratio"


# ============================================================================
# API Endpoint Tests
# ============================================================================


class TestBriefingAPI:
    """Test suite for briefing API endpoints."""

    def test_create_briefing_endpoint_success(self, client: TestClient, valid_briefing_payload: dict) -> None:
        """Test POST /briefings endpoint."""
        response = client.post("/briefings", json=valid_briefing_payload)

        assert response.status_code == 201
        data = response.json()
        assert data["id"] is not None
        assert data["company_name"] == "Acme Holdings"
        assert data["ticker"] == "ACME"
        assert len(data["key_points"]) == 2
        assert len(data["risks"]) == 1
        assert len(data["metrics"]) == 2

    def test_create_briefing_endpoint_missing_required_field(self, client: TestClient, valid_briefing_payload: dict) -> None:
        """Test POST /briefings with missing required field."""
        payload = valid_briefing_payload.copy()
        del payload["companyName"]

        response = client.post("/briefings", json=payload)

        assert response.status_code == 422

    def test_create_briefing_endpoint_insufficient_key_points(self, client: TestClient, valid_briefing_payload: dict) -> None:
        """Test POST /briefings with less than 2 key points."""
        payload = valid_briefing_payload.copy()
        payload["keyPoints"] = ["Only one point"]

        response = client.post("/briefings", json=payload)

        assert response.status_code == 422

    def test_create_briefing_endpoint_no_risks(self, client: TestClient, valid_briefing_payload: dict) -> None:
        """Test POST /briefings with no risks."""
        payload = valid_briefing_payload.copy()
        payload["risks"] = []

        response = client.post("/briefings", json=payload)

        assert response.status_code == 422

    def test_get_briefing_endpoint_success(self, client: TestClient, valid_briefing_payload: dict) -> None:
        """Test GET /briefings/{id} endpoint."""
        create_response = client.post("/briefings", json=valid_briefing_payload)
        briefing_id = create_response.json()["id"]

        response = client.get(f"/briefings/{briefing_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == briefing_id
        assert data["company_name"] == "Acme Holdings"

    def test_get_briefing_endpoint_not_found(self, client: TestClient) -> None:
        """Test GET /briefings/{id} with non-existent ID."""
        response = client.get("/briefings/999")

        assert response.status_code == 404

    def test_generate_briefing_endpoint_success(self, client: TestClient, valid_briefing_payload: dict) -> None:
        """Test POST /briefings/{id}/generate endpoint."""
        create_response = client.post("/briefings", json=valid_briefing_payload)
        briefing_id = create_response.json()["id"]

        response = client.post(f"/briefings/{briefing_id}/generate")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == briefing_id
        assert data["generated_at"] is not None
        assert data["html_content"] is not None

    def test_generate_briefing_endpoint_not_found(self, client: TestClient) -> None:
        """Test POST /briefings/{id}/generate with non-existent ID."""
        response = client.post("/briefings/999/generate")

        assert response.status_code == 404

    def test_get_html_endpoint_success(self, client: TestClient, valid_briefing_payload: dict) -> None:
        """Test GET /briefings/{id}/html endpoint."""
        create_response = client.post("/briefings", json=valid_briefing_payload)
        briefing_id = create_response.json()["id"]

        client.post(f"/briefings/{briefing_id}/generate")
        response = client.get(f"/briefings/{briefing_id}/html")

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/html; charset=utf-8"
        assert "<html" in response.text
        assert "Acme Holdings" in response.text
        assert "ACME" in response.text

    def test_get_html_endpoint_not_generated(self, client: TestClient, valid_briefing_payload: dict) -> None:
        """Test GET /briefings/{id}/html when report not generated."""
        create_response = client.post("/briefings", json=valid_briefing_payload)
        briefing_id = create_response.json()["id"]

        response = client.get(f"/briefings/{briefing_id}/html")

        assert response.status_code == 404
        assert "not been generated yet" in response.json()["detail"]

    def test_get_html_endpoint_not_found(self, client: TestClient) -> None:
        """Test GET /briefings/{id}/html with non-existent ID."""
        response = client.get("/briefings/999/html")

        assert response.status_code == 404


# ============================================================================
# Schema Validation Tests
# ============================================================================


class TestBriefingValidation:
    """Test suite for briefing schema validation."""

    def test_validate_ticker_normalized(self, valid_briefing_payload: dict) -> None:
        """Test that ticker is normalized to uppercase."""
        payload = BriefingCreate(**valid_briefing_payload)
        assert payload.ticker == "ACME"

    def test_validate_company_name_required(self, valid_briefing_payload: dict) -> None:
        """Test that company name is required."""
        payload_dict = valid_briefing_payload.copy()
        del payload_dict["companyName"]

        with pytest.raises(ValueError):
            BriefingCreate(**payload_dict)

    def test_validate_key_points_minimum_two(self, valid_briefing_payload: dict) -> None:
        """Test that at least 2 key points are required."""
        from pydantic import ValidationError
        
        payload_dict = valid_briefing_payload.copy()
        payload_dict["keyPoints"] = ["Only one"]

        with pytest.raises(ValidationError):
            BriefingCreate(**payload_dict)

    def test_validate_risks_minimum_one(self, valid_briefing_payload: dict) -> None:
        """Test that at least 1 risk is required."""
        from pydantic import ValidationError
        
        payload_dict = valid_briefing_payload.copy()
        payload_dict["risks"] = []

        with pytest.raises(ValidationError):
            BriefingCreate(**payload_dict)

    def test_validate_metric_names_unique(self, valid_briefing_payload: dict) -> None:
        """Test that metric names must be unique."""
        payload_dict = valid_briefing_payload.copy()
        payload_dict["metrics"] = [
            {"name": "Revenue Growth", "value": "18%"},
            {"name": "Revenue Growth", "value": "20%"},  # Duplicate
        ]

        with pytest.raises(ValueError, match="Metric names must be unique"):
            BriefingCreate(**payload_dict)

    def test_validate_summary_minimum_length(self, valid_briefing_payload: dict) -> None:
        """Test that summary has minimum length."""
        payload_dict = valid_briefing_payload.copy()
        payload_dict["summary"] = "Too short"

        with pytest.raises(ValueError):
            BriefingCreate(**payload_dict)

    def test_validate_recommendation_minimum_length(self, valid_briefing_payload: dict) -> None:
        """Test that recommendation has minimum length."""
        payload_dict = valid_briefing_payload.copy()
        payload_dict["recommendation"] = "Too short"

        with pytest.raises(ValueError):
            BriefingCreate(**payload_dict)

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import BriefingCreate, BriefingRead
from app.services.briefing_service import BriefingService
from app.services.report_formatter import ReportFormatter

router = APIRouter(prefix="/briefings", tags=["briefings"])

# Setup Jinja2 template environment with absolute path
template_dir = Path(__file__).parent.parent / "templates"
template_env = Environment(loader=FileSystemLoader(str(template_dir)))


@router.post("", response_model=BriefingRead, status_code=status.HTTP_201_CREATED)
def create_briefing(
    payload: BriefingCreate,
    db: Annotated[Session, Depends(get_db)],
) -> BriefingRead:
    """
    Create a new briefing.

    Accepts structured JSON with company details, summary, recommendation,
    key points, risks, and optional metrics.

    Returns the created briefing with all related data.
    """
    service = BriefingService(db)
    return service.create_briefing(payload)


@router.get("/{briefing_id}", response_model=BriefingRead)
def get_briefing(
    briefing_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> BriefingRead:
    """
    Retrieve a briefing by ID.

    Returns the briefing with all related key points, risks, and metrics.
    """
    service = BriefingService(db)
    briefing = service.get_briefing(briefing_id)

    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing with id {briefing_id} not found",
        )

    return briefing


@router.post("/{briefing_id}/generate", response_model=BriefingRead)
def generate_briefing_report(
    briefing_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> BriefingRead:
    """
    Generate an HTML report for a briefing.

    Reads the stored briefing data, transforms it into a report view model,
    renders the HTML template, and saves the generated HTML to the database.

    Returns the updated briefing with generated_at timestamp.
    """
    service = BriefingService(db)

    # Retrieve the briefing
    try:
        briefing = service.get_briefing_by_id_or_raise(briefing_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing with id {briefing_id} not found",
        )

    # Transform to report view model
    report = ReportFormatter.format_briefing_to_report(briefing)

    # Render HTML template
    template = template_env.get_template("briefing_report.html")
    html_content = template.render(report=report)

    # Save HTML to database
    updated_briefing = service.update_briefing_html(briefing_id, html_content)

    return updated_briefing


@router.get("/{briefing_id}/html", response_class=HTMLResponse)
def get_briefing_html(
    briefing_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> str:
    """
    Retrieve the generated HTML report for a briefing.

    Returns the actual HTML content (not JSON) that can be displayed in a browser.
    If the report hasn't been generated yet, returns a 404 error.
    """
    service = BriefingService(db)

    # Retrieve the briefing
    try:
        briefing = service.get_briefing_by_id_or_raise(briefing_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing with id {briefing_id} not found",
        )

    # Check if HTML has been generated
    html_content = service.get_html_content(briefing_id)
    if not html_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report for briefing {briefing_id} has not been generated yet. "
            f"Call POST /briefings/{briefing_id}/generate first.",
        )

    return html_content

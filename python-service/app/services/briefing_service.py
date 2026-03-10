from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Briefing, BriefingKeyPoint, BriefingMetric, BriefingRisk
from app.schemas import BriefingCreate, BriefingRead


class BriefingService:
    """Service layer for briefing operations."""

    def __init__(self, db: Session):
        self.db = db

    def create_briefing(self, payload: BriefingCreate) -> BriefingRead:
        """
        Create a new briefing with all related data.

        Args:
            payload: BriefingCreate schema with validated data

        Returns:
            BriefingRead schema with created briefing data
        """
        # Create the main briefing record
        briefing = Briefing(
            company_name=payload.company_name,
            ticker=payload.ticker,
            sector=payload.sector,
            analyst_name=payload.analyst_name,
            summary=payload.summary,
            recommendation=payload.recommendation,
        )

        # Add key points
        for idx, point_text in enumerate(payload.key_points):
            key_point = BriefingKeyPoint(
                point_text=point_text,
                display_order=idx,
            )
            briefing.key_points.append(key_point)

        # Add risks
        for idx, risk_text in enumerate(payload.risks):
            risk = BriefingRisk(
                risk_text=risk_text,
                display_order=idx,
            )
            briefing.risks.append(risk)

        # Add metrics if provided
        if payload.metrics:
            for idx, metric in enumerate(payload.metrics):
                briefing_metric = BriefingMetric(
                    metric_name=metric.name,
                    metric_value=metric.value,
                    display_order=idx,
                )
                briefing.metrics.append(briefing_metric)

        # Save to database
        self.db.add(briefing)
        self.db.commit()
        self.db.refresh(briefing)

        return BriefingRead.model_validate(briefing)

    def get_briefing(self, briefing_id: int) -> BriefingRead | None:
        """
        Retrieve a briefing by ID.

        Args:
            briefing_id: ID of the briefing to retrieve

        Returns:
            BriefingRead schema or None if not found
        """
        query = select(Briefing).where(Briefing.id == briefing_id)
        briefing = self.db.scalars(query).first()

        if not briefing:
            return None

        return BriefingRead.model_validate(briefing)

    def list_briefings(self, limit: int = 100, offset: int = 0) -> list[BriefingRead]:
        """
        List all briefings with pagination.

        Args:
            limit: Maximum number of briefings to return
            offset: Number of briefings to skip

        Returns:
            List of BriefingRead schemas
        """
        query = (
            select(Briefing)
            .order_by(Briefing.created_at.desc(), Briefing.id.desc())
            .limit(limit)
            .offset(offset)
        )
        briefings = self.db.scalars(query).all()

        return [BriefingRead.model_validate(b) for b in briefings]

    def get_briefing_by_id_or_raise(self, briefing_id: int) -> Briefing:
        """
        Retrieve a briefing by ID or raise an exception.

        Args:
            briefing_id: ID of the briefing to retrieve

        Returns:
            Briefing ORM model

        Raises:
            ValueError: If briefing not found
        """
        query = select(Briefing).where(Briefing.id == briefing_id)
        briefing = self.db.scalars(query).first()

        if not briefing:
            raise ValueError(f"Briefing with id {briefing_id} not found")

        return briefing

    def update_briefing_html(self, briefing_id: int, html_content: str) -> BriefingRead:
        """
        Update a briefing with generated HTML content.

        Args:
            briefing_id: ID of the briefing to update
            html_content: Generated HTML content

        Returns:
            Updated BriefingRead schema
        """
        briefing = self.get_briefing_by_id_or_raise(briefing_id)

        briefing.html_content = html_content
        # generated_at is set by the database trigger or manually here
        from datetime import datetime
        from sqlalchemy import func

        briefing.generated_at = datetime.now(datetime.now().astimezone().tzinfo)

        self.db.commit()
        self.db.refresh(briefing)

        return BriefingRead.model_validate(briefing)

    def get_html_content(self, briefing_id: int) -> str | None:
        """
        Retrieve the generated HTML content for a briefing.

        Args:
            briefing_id: ID of the briefing

        Returns:
            HTML content or None if not generated
        """
        briefing = self.get_briefing_by_id_or_raise(briefing_id)
        return briefing.html_content

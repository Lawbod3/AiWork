from datetime import datetime

from app.models import Briefing
from app.schemas import BriefingReport


class ReportFormatter:
    """Service layer for transforming briefing data into report view models."""

    @staticmethod
    def format_briefing_to_report(briefing: Briefing) -> BriefingReport:
        """
        Transform a Briefing ORM model into a BriefingReport view model.

        This formatter handles:
        - Constructing a professional report title
        - Sorting key points by display order
        - Sorting risks by display order
        - Formatting metrics with normalized labels
        - Generating display-ready timestamp

        Args:
            briefing: Briefing ORM model with all related data

        Returns:
            BriefingReport schema ready for template rendering
        """
        # Construct professional report title
        title = ReportFormatter._construct_title(briefing.company_name, briefing.ticker)

        # Sort and format key points
        key_points = ReportFormatter._format_key_points(briefing.key_points)

        # Sort and format risks
        risks = ReportFormatter._format_risks(briefing.risks)

        # Format metrics with normalized labels
        metrics = ReportFormatter._format_metrics(briefing.metrics)

        # Generate display-ready timestamp
        generated_at = briefing.generated_at or datetime.now()

        return BriefingReport(
            title=title,
            company_name=briefing.company_name,
            ticker=briefing.ticker,
            sector=briefing.sector,
            analyst_name=briefing.analyst_name,
            summary=briefing.summary,
            recommendation=briefing.recommendation,
            key_points=key_points,
            risks=risks,
            metrics=metrics,
            generated_at=generated_at,
            created_at=briefing.created_at,
        )

    @staticmethod
    def _construct_title(company_name: str, ticker: str) -> str:
        """
        Construct a professional report title.

        Args:
            company_name: Name of the company
            ticker: Stock ticker symbol

        Returns:
            Formatted title string
        """
        return f"Briefing Report: {company_name} ({ticker})"

    @staticmethod
    def _format_key_points(key_points: list) -> list[str]:
        """
        Sort and format key points for display.

        Args:
            key_points: List of BriefingKeyPoint ORM models

        Returns:
            Sorted list of key point text strings
        """
        # Sort by display_order
        sorted_points = sorted(key_points, key=lambda p: p.display_order)

        # Extract text and strip whitespace
        return [point.point_text.strip() for point in sorted_points]

    @staticmethod
    def _format_risks(risks: list) -> list[str]:
        """
        Sort and format risks for display.

        Args:
            risks: List of BriefingRisk ORM models

        Returns:
            Sorted list of risk text strings
        """
        # Sort by display_order
        sorted_risks = sorted(risks, key=lambda r: r.display_order)

        # Extract text and strip whitespace
        return [risk.risk_text.strip() for risk in sorted_risks]

    @staticmethod
    def _format_metrics(metrics: list) -> list[dict]:
        """
        Format metrics with normalized labels for display.

        Handles:
        - Sorting by display order
        - Normalizing metric names (title case)
        - Grouping name and value together
        - Handling empty metrics gracefully

        Args:
            metrics: List of BriefingMetric ORM models

        Returns:
            Sorted list of metric dictionaries with normalized labels
        """
        if not metrics:
            return []

        # Sort by display_order
        sorted_metrics = sorted(metrics, key=lambda m: m.display_order)

        # Format each metric
        formatted = []
        for metric in sorted_metrics:
            formatted.append(
                {
                    "name": ReportFormatter._normalize_metric_label(metric.metric_name),
                    "value": metric.metric_value.strip(),
                }
            )

        return formatted

    @staticmethod
    def _normalize_metric_label(label: str) -> str:
        """
        Normalize metric label for display.

        Converts to title case and ensures consistent formatting.

        Args:
            label: Raw metric name from database

        Returns:
            Normalized metric label
        """
        # Strip whitespace
        label = label.strip()

        # Convert to title case (capitalize first letter of each word)
        return label.title()

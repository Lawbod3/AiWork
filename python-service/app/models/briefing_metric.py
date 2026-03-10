from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BriefingMetric(Base):
    __tablename__ = "briefing_metrics"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    briefing_id: Mapped[int] = mapped_column(ForeignKey("briefings.id"), nullable=False)
    metric_name: Mapped[str] = mapped_column(String(255), nullable=False)
    metric_value: Mapped[str] = mapped_column(String(255), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship back to Briefing
    briefing: Mapped["Briefing"] = relationship("Briefing", back_populates="metrics")

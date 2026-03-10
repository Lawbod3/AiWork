from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Briefing(Base):
    __tablename__ = "briefings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ticker: Mapped[str] = mapped_column(String(10), nullable=False)
    sector: Mapped[str] = mapped_column(String(255), nullable=False)
    analyst_name: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    html_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    key_points: Mapped[list["BriefingKeyPoint"]] = relationship(
        "BriefingKeyPoint",
        back_populates="briefing",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    risks: Mapped[list["BriefingRisk"]] = relationship(
        "BriefingRisk",
        back_populates="briefing",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    metrics: Mapped[list["BriefingMetric"]] = relationship(
        "BriefingMetric",
        back_populates="briefing",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BriefingRisk(Base):
    __tablename__ = "briefing_risks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    briefing_id: Mapped[int] = mapped_column(ForeignKey("briefings.id"), nullable=False)
    risk_text: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship back to Briefing
    briefing: Mapped["Briefing"] = relationship("Briefing", back_populates="risks")

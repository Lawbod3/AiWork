from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MetricCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    value: str = Field(min_length=1, max_length=255)


class MetricRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    metric_name: str
    metric_value: str
    display_order: int


class KeyPointCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class KeyPointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    point_text: str
    display_order: int


class RiskCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class RiskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    risk_text: str
    display_order: int


class BriefingCreate(BaseModel):
    company_name: str = Field(min_length=1, max_length=255)
    ticker: str = Field(min_length=1, max_length=10)
    sector: str = Field(min_length=1, max_length=255)
    analyst_name: str = Field(min_length=1, max_length=255)
    summary: str = Field(min_length=10, max_length=5000)
    recommendation: str = Field(min_length=10, max_length=5000)
    key_points: list[str] = Field(min_length=2, max_length=50)
    risks: list[str] = Field(min_length=1, max_length=50)
    metrics: list[MetricCreate] | None = Field(default=None, max_length=50)

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, v: str) -> str:
        """Normalize ticker to uppercase."""
        return v.upper().strip()

    @field_validator("company_name", "sector", "analyst_name")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        """Strip leading/trailing whitespace."""
        return v.strip()

    @field_validator("summary", "recommendation")
    @classmethod
    def strip_text_fields(cls, v: str) -> str:
        """Strip leading/trailing whitespace from text fields."""
        return v.strip()

    @field_validator("key_points")
    @classmethod
    def validate_key_points(cls, v: list[str]) -> list[str]:
        """Validate key points: minimum 2, strip whitespace."""
        if len(v) < 2:
            raise ValueError("At least 2 key points are required")
        return [point.strip() for point in v if point.strip()]

    @field_validator("risks")
    @classmethod
    def validate_risks(cls, v: list[str]) -> list[str]:
        """Validate risks: minimum 1, strip whitespace."""
        if len(v) < 1:
            raise ValueError("At least 1 risk is required")
        return [risk.strip() for risk in v if risk.strip()]

    @field_validator("metrics")
    @classmethod
    def validate_metrics(cls, v: list[MetricCreate] | None) -> list[MetricCreate] | None:
        """Validate metrics: ensure unique names within the briefing."""
        if v is None:
            return None
        
        metric_names = [m.name.lower() for m in v]
        if len(metric_names) != len(set(metric_names)):
            raise ValueError("Metric names must be unique within the same briefing")
        
        return v


class BriefingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str
    key_points: list[KeyPointRead]
    risks: list[RiskRead]
    metrics: list[MetricRead]
    html_content: str | None
    generated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class BriefingReport(BaseModel):
    """Formatted briefing data for HTML template rendering."""

    title: str
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str
    key_points: list[str]
    risks: list[str]
    metrics: list[dict]
    generated_at: datetime
    created_at: datetime

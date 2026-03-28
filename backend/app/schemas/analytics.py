from pydantic import BaseModel, Field
from typing import Any, Optional, Union


class ColumnStats(BaseModel):
    type: str
    count: int
    missing: int
    unique: Optional[int] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    min: Optional[Union[float, str]] = None
    max: Optional[Union[float, str]] = None
    q1: Optional[float] = None
    q3: Optional[float] = None
    top_values: Optional[list[dict]] = None


class AnalyticsRequest(BaseModel):
    analysis_type: str = Field(default="full")
    anomaly_threshold: float = Field(default=1.5, gt=0)
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class AnalyticsResponse(BaseModel):
    dataset_id: int
    total_records: int
    columns: dict[str, ColumnStats]
    insights: list[str]
    anomalies: list[dict]
    trends: Optional[dict] = None

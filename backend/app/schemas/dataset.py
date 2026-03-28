from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class DatasetOut(BaseModel):
    id: int
    filename: str
    file_type: str
    upload_time: datetime
    record_count: int
    file_size: int
    user_id: int
    status: str
    owner_email: Optional[str] = None
    owner_name: Optional[str] = None

    model_config = {"from_attributes": True}


class DatasetDetail(DatasetOut):
    metadata_: Optional[dict] = None
    preview: list[dict] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class PaginatedDatasets(BaseModel):
    items: list[DatasetOut]
    total: int
    page: int
    limit: int
    pages: int

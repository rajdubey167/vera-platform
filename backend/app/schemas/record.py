from pydantic import BaseModel
from typing import Any
from datetime import datetime


class RecordOut(BaseModel):
    id: int
    dataset_id: int
    data: dict
    row_number: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RecordUpdate(BaseModel):
    data: dict


class PaginatedRecords(BaseModel):
    items: list[RecordOut]
    total: int
    page: int
    limit: int
    pages: int

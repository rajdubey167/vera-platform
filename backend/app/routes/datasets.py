import math
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import Dataset
from app.models.record import Record
from app.schemas.dataset import DatasetOut, DatasetDetail, PaginatedDatasets
from app.utils.security import get_current_user
from app.utils.logger import logger

router = APIRouter(tags=["Datasets"])


@router.get("/datasets", response_model=PaginatedDatasets)
def list_datasets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    file_type: str = Query(None),
    sort_by: str = Query("upload_time"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Dataset)

    # Admin sees all; user sees own
    if current_user.role != "admin":
        query = query.filter(Dataset.user_id == current_user.id)

    if search:
        if search.strip().isdigit():
            query = query.filter(
                (Dataset.filename.ilike(f"%{search}%")) | (Dataset.id == int(search))
            )
        else:
            query = query.filter(Dataset.filename.ilike(f"%{search}%"))
    if file_type:
        query = query.filter(Dataset.file_type == file_type)
    if sort_by not in {"upload_time", "filename", "record_count", "file_size"}:
        raise HTTPException(status_code=400, detail=f"Unsupported sort field '{sort_by}'")
    if sort_order not in {"asc", "desc"}:
        raise HTTPException(status_code=400, detail="sort_order must be 'asc' or 'desc'")

    total = query.count()
    order_col = getattr(Dataset, sort_by)
    if sort_order == "desc":
        order_col = order_col.desc()
    items = query.order_by(order_col).offset((page - 1) * limit).limit(limit).all()

    return PaginatedDatasets(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 1,
    )


@router.get("/datasets/{dataset_id}", response_model=DatasetDetail)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if current_user.role != "admin" and dataset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Preview first 10 records
    preview_records = (
        db.query(Record)
        .filter(Record.dataset_id == dataset_id)
        .order_by(Record.row_number)
        .limit(10)
        .all()
    )
    preview = [r.data for r in preview_records]

    result = DatasetDetail.model_validate(dataset)
    result.preview = preview
    return result

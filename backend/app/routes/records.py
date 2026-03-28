import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Text, cast
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.dataset import Dataset
from app.models.record import Record
from app.schemas.record import PaginatedRecords, RecordOut, RecordUpdate
from app.services.ws_manager import manager
from app.utils.logger import logger
from app.utils.security import get_current_user
from app.services.neo4j_service import delete_dataset as neo4j_delete_dataset

router = APIRouter(tags=["Records"])

ALLOWED_SORT_FIELDS = {"row_number", "created_at", "updated_at"}


def _check_dataset_access(dataset_id: int, current_user, db: Session) -> Dataset:
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if current_user.role != "admin" and dataset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return dataset


@router.get("/records", response_model=PaginatedRecords)
def get_records(
    dataset_id: int = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    sort_by: str = Query("row_number"),
    sort_order: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _check_dataset_access(dataset_id, current_user, db)

    if sort_by not in ALLOWED_SORT_FIELDS:
        raise HTTPException(status_code=400, detail=f"Unsupported sort field '{sort_by}'")
    if sort_order not in {"asc", "desc"}:
        raise HTTPException(status_code=400, detail="sort_order must be 'asc' or 'desc'")

    query = db.query(Record).filter(Record.dataset_id == dataset_id)

    if search:
        query = query.filter(cast(Record.data, Text).ilike(f"%{search}%"))

    order_col = getattr(Record, sort_by)
    if sort_order == "desc":
        order_col = order_col.desc()

    total = query.count()
    items = query.order_by(order_col).offset((page - 1) * limit).limit(limit).all()

    return PaginatedRecords(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 1,
    )


@router.put("/records/{record_id}", response_model=RecordOut)
def update_record(
    record_id: int,
    payload: RecordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    _check_dataset_access(record.dataset_id, current_user, db)

    record.data = payload.data
    db.commit()
    db.refresh(record)
    logger.info(f"Record {record_id} updated by user {current_user.id}")
    return record


@router.delete("/records/{record_id}")
async def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    _check_dataset_access(record.dataset_id, current_user, db)

    db.delete(record)

    dataset = db.query(Dataset).filter(Dataset.id == record.dataset_id).first()
    if dataset:
        dataset.record_count = max(0, dataset.record_count - 1)

    db.commit()
    logger.info(f"Record {record_id} deleted by user {current_user.id}")
    await manager.send_to_user(
        str(current_user.id),
        "record_deleted",
        {"record_id": record_id, "dataset_id": record.dataset_id},
    )
    return {"message": "Record deleted successfully"}


@router.delete("/dataset/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = _check_dataset_access(dataset_id, current_user, db)

    record_count = db.query(Record).filter(Record.dataset_id == dataset_id).count()
    db.delete(dataset)
    db.commit()
    neo4j_delete_dataset(dataset_id)

    logger.info(f"Dataset {dataset_id} deleted by user {current_user.id}, {record_count} records removed")
    await manager.send_to_user(
        str(current_user.id),
        "dataset_deleted",
        {"dataset_id": dataset_id, "record_count": record_count},
    )
    return {"message": f"Dataset deleted successfully. {record_count} records removed."}

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.dataset import DatasetOut
from app.services.upload_service import store_dataset
from app.services.ws_manager import manager
from app.utils.security import get_current_user
from app.utils.validators import validate_file, validate_file_size
from app.utils.logger import logger
from app.services.neo4j_service import sync_dataset

router = APIRouter(tags=["Upload"])


@router.post("/upload", response_model=DatasetOut, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    ext = validate_file(file)
    content = await validate_file_size(file)

    logger.info(f"Upload started: {file.filename} by user {current_user.id}")

    dataset = store_dataset(
        filename=file.filename,
        file_type=ext,
        content=content,
        user_id=current_user.id,
        db=db,
    )
    # Sync to Neo4j — get column names from first record
    from app.models.record import Record
    first = db.query(Record).filter(Record.dataset_id == dataset.id).first()
    columns = list(first.data.keys()) if first else []
    sync_dataset(dataset.id, dataset.filename, dataset.file_type, dataset.record_count, columns, user_id=current_user.id)

    await manager.send_to_user(
        str(current_user.id),
        "upload_complete",
        {
            "dataset_id": dataset.id,
            "filename": dataset.filename,
            "record_count": dataset.record_count,
        },
    )
    return dataset

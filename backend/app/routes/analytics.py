from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import Dataset
from app.schemas.analytics import AnalyticsRequest, AnalyticsResponse
from app.services.analytics_service import run_analysis
from app.services.ws_manager import manager
from app.utils.security import get_current_user
from app.utils.logger import logger

router = APIRouter(tags=["Analytics"])


@router.post("/analyze/{dataset_id}", response_model=AnalyticsResponse)
async def analyze_dataset(
    dataset_id: int,
    payload: AnalyticsRequest | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if current_user.role != "admin" and dataset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    logger.info(f"Analysis triggered for dataset {dataset_id} by user {current_user.id}")
    options = payload or AnalyticsRequest()
    result = run_analysis(
        dataset_id,
        db,
        analysis_type=options.analysis_type,
        anomaly_threshold=options.anomaly_threshold,
        date_from=options.date_from,
        date_to=options.date_to,
    )
    await manager.send_to_user(
        str(current_user.id),
        "analysis_complete",
        {
            "dataset_id": dataset_id,
            "anomaly_count": len(result.get("anomalies", [])),
            "total_records": result.get("total_records", 0),
        },
    )
    return result

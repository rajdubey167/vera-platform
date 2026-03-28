import io
import json
import pandas as pd
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.dataset import Dataset
from app.models.record import Record
from app.utils.logger import logger


def parse_csv(content: bytes) -> pd.DataFrame:
    try:
        return pd.read_csv(io.BytesIO(content), encoding="utf-8")
    except UnicodeDecodeError:
        return pd.read_csv(io.BytesIO(content), encoding="latin-1")
    except pd.errors.EmptyDataError as exc:
        raise HTTPException(status_code=400, detail="CSV file is empty") from exc


def parse_json(content: bytes) -> pd.DataFrame:
    try:
        data = json.loads(content.decode("utf-8"))
    except UnicodeDecodeError:
        try:
            data = json.loads(content.decode("latin-1"))
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Invalid JSON file") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON file") from exc

    if isinstance(data, list):
        return pd.DataFrame(data)
    if isinstance(data, dict):
        # Try to normalize nested structures
        return pd.json_normalize(data)
    raise HTTPException(status_code=400, detail="JSON must be an array or object")


def _normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty and len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file does not contain tabular data")

    df.columns = [str(c).strip() or f"column_{index + 1}" for index, c in enumerate(df.columns)]

    seen_columns: dict[str, int] = {}
    normalized_columns = []
    for column in df.columns:
        seen_columns[column] = seen_columns.get(column, 0) + 1
        normalized_columns.append(column if seen_columns[column] == 1 else f"{column}_{seen_columns[column]}")
    df.columns = normalized_columns

    return df.where(pd.notnull(df), None)


def store_dataset(
    filename: str,
    file_type: str,
    content: bytes,
    user_id: int,
    db: Session,
) -> Dataset:
    # Parse file
    if file_type == "csv":
        df = parse_csv(content)
    else:
        df = parse_json(content)

    df = _normalize_dataframe(df)

    import math
    records_data = df.to_dict(orient="records")
    records_data = [
        {k: (None if isinstance(v, float) and math.isnan(v) else v) for k, v in row.items()}
        for row in records_data
    ]
    record_count = len(records_data)
    if record_count == 0:
        raise HTTPException(status_code=400, detail="Uploaded file contains no records")

    # Build metadata
    metadata = {
        "columns": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
    }

    dataset = Dataset(
        filename=filename,
        file_type=file_type,
        record_count=record_count,
        file_size=len(content),
        user_id=user_id,
        status="ready",
        metadata_=metadata,
    )
    db.add(dataset)
    db.flush()  # Get dataset.id before inserting records

    # Bulk insert records
    records = [
        Record(dataset_id=dataset.id, data=row, row_number=i + 1)
        for i, row in enumerate(records_data)
    ]
    db.bulk_save_objects(records)
    db.commit()
    db.refresh(dataset)

    logger.info(f"Dataset stored: id={dataset.id}, file={filename}, records={record_count}")
    return dataset

import math
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.models.record import Record, AnalyticsResult
from app.utils.logger import logger


def _safe_float(val) -> float | None:
    try:
        f = float(val)
        return None if math.isnan(f) or math.isinf(f) else round(f, 4)
    except (TypeError, ValueError):
        return None


def _detect_anomalies_iqr(
    df: pd.DataFrame,
    numeric_cols: list[str],
    threshold: float = 1.5,
) -> list[dict]:
    """IQR-based anomaly detection across all numeric columns."""
    anomaly_indices = set()
    anomaly_details = {}

    for col in numeric_cols:
        series = pd.to_numeric(df[col], errors="coerce").dropna().astype(float)
        if len(series) < 4:
            continue
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - threshold * iqr
        upper = q3 + threshold * iqr

        outlier_mask = (pd.to_numeric(df[col], errors="coerce") < lower) | (
            pd.to_numeric(df[col], errors="coerce") > upper
        )
        for idx in df[outlier_mask].index:
            anomaly_indices.add(idx)
            if idx not in anomaly_details:
                anomaly_details[idx] = []
            anomaly_details[idx].append(f"{col}={df.at[idx, col]}")

    anomalies = []
    for idx in sorted(list(anomaly_indices))[:50]:  # Cap at 50
        row = df.iloc[idx].to_dict()
        row = {k: (None if (isinstance(v, float) and math.isnan(v)) else v) for k, v in row.items()}
        anomalies.append({"row_index": int(idx) + 1, "data": row, "flags": anomaly_details.get(idx, [])})
    return anomalies


def run_analysis(
    dataset_id: int,
    db: Session,
    analysis_type: str = "full",
    anomaly_threshold: float = 1.5,
    date_from: str | None = None,
    date_to: str | None = None,
) -> dict:
    # Load all records
    records = db.query(Record).filter(Record.dataset_id == dataset_id).order_by(Record.row_number).all()
    if not records:
        return {
            "dataset_id": dataset_id,
            "total_records": 0,
            "columns": {},
            "insights": ["Dataset is empty"],
            "anomalies": [],
            "trends": None,
        }

    df = pd.DataFrame([r.data for r in records])

    # Apply date range filter if requested
    if date_from or date_to:
        for col in df.columns:
            dt_series = pd.to_datetime(df[col], errors="coerce")
            if dt_series.notna().sum() > len(df) * 0.5:
                mask = pd.Series([True] * len(df), index=df.index)
                if date_from:
                    mask &= dt_series >= pd.to_datetime(date_from)
                if date_to:
                    mask &= dt_series <= pd.to_datetime(date_to)
                df = df[mask].reset_index(drop=True)
                break
    total_records = len(df)
    columns_stats = {}
    insights = []
    trends = None

    numeric_cols = []
    datetime_cols = []

    for col in df.columns:
        series = df[col]
        missing = int(series.isna().sum())
        unique = int(series.nunique())

        # Try numeric
        numeric_series = pd.to_numeric(series, errors="coerce")
        if numeric_series.notna().sum() > len(series) * 0.5:
            numeric_cols.append(col)
            valid = numeric_series.dropna().astype(float)
            stats = {
                "type": "numeric",
                "count": int(valid.count()),
                "missing": missing,
                "unique": unique,
                "mean": _safe_float(valid.mean()),
                "median": _safe_float(valid.median()),
                "std": _safe_float(valid.std()),
                "min": _safe_float(valid.min()),
                "max": _safe_float(valid.max()),
                "q1": _safe_float(valid.quantile(0.25)),
                "q3": _safe_float(valid.quantile(0.75)),
            }
            columns_stats[col] = stats

            # Insight: high variance
            if stats["std"] and stats["mean"] and stats["mean"] != 0:
                cv = abs(stats["std"] / stats["mean"])
                if cv > 1:
                    insights.append(f"High variance detected in '{col}' (CV={cv:.2f})")

        else:
            # Try datetime
            datetime_series = pd.to_datetime(series, errors="coerce")
            if datetime_series.notna().sum() > len(series) * 0.5:
                datetime_cols.append(col)
                valid_dt = datetime_series.dropna()
                columns_stats[col] = {
                    "type": "datetime",
                    "count": int(valid_dt.count()),
                    "missing": missing,
                    "unique": unique,
                    "min": str(valid_dt.min()),
                    "max": str(valid_dt.max()),
                }
            else:
                # Categorical
                top = series.value_counts().head(5)
                top_values = [
                    {"value": "null" if pd.isna(k) else str(k), "count": int(v)}
                    for k, v in top.items()
                ]
                columns_stats[col] = {
                    "type": "categorical",
                    "count": int(series.count()),
                    "missing": missing,
                    "unique": unique,
                    "top_values": top_values,
                }
                if unique == 1:
                    insights.append(f"Column '{col}' has only one unique value — may be constant")
                if unique > total_records * 0.95 and total_records > 10:
                    insights.append(f"Column '{col}' appears to be a unique identifier")

    # Missing data insights
    for col, stats in columns_stats.items():
        missing = stats.get("missing", 0)
        if missing > 0:
            pct = round(missing / total_records * 100, 1)
            if pct > 10:
                insights.append(f"Column '{col}' has {pct}% missing values")

    # Anomaly detection
    anomalies = _detect_anomalies_iqr(df, numeric_cols, threshold=anomaly_threshold)
    if anomalies:
        insights.append(
            f"{len(anomalies)} anomalous row(s) detected using IQR method "
            f"(threshold={anomaly_threshold})"
        )

    # Time trends
    if datetime_cols:
        dt_col = datetime_cols[0]
        dt_series = pd.to_datetime(df[dt_col], errors="coerce").dropna()
        if len(dt_series) > 1:
            trends = {
                "date_column": dt_col,
                "earliest": str(dt_series.min()),
                "latest": str(dt_series.max()),
                "span_days": int((dt_series.max() - dt_series.min()).days),
            }
            insights.append(f"Time series data spans {trends['span_days']} days in column '{dt_col}'")

    if not insights:
        insights.append(f"Dataset contains {total_records} records across {len(df.columns)} columns")

    result = {
        "dataset_id": dataset_id,
        "total_records": total_records,
        "columns": columns_stats,
        "insights": insights,
        "anomalies": anomalies,
        "trends": trends,
    }

    # Cache result
    existing = (
        db.query(AnalyticsResult)
        .filter(
            AnalyticsResult.dataset_id == dataset_id,
            AnalyticsResult.analysis_type == analysis_type,
        )
        .first()
    )
    if existing:
        existing.analysis_type = analysis_type
        existing.results = result
        db.commit()
    else:
        ar = AnalyticsResult(dataset_id=dataset_id, analysis_type=analysis_type, results=result)
        db.add(ar)
        db.commit()

    logger.info(f"Analysis complete for dataset {dataset_id}: {total_records} records, {len(anomalies)} anomalies")
    return result

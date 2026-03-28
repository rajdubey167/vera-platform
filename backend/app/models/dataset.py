from sqlalchemy import Column, Integer, String, DateTime, BigInteger, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from app.database import Base

JSONType = JSON().with_variant(JSONB, "postgresql")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # "csv" or "json"
    upload_time = Column(DateTime(timezone=True), server_default=func.now())
    record_count = Column(Integer, default=0)
    file_size = Column(BigInteger, default=0)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="ready")
    metadata_ = Column("metadata", JSONType, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="datasets")
    records = relationship("Record", back_populates="dataset", cascade="all, delete-orphan")
    analytics_results = relationship(
        "AnalyticsResult",
        back_populates="dataset",
        cascade="all, delete-orphan",
    )

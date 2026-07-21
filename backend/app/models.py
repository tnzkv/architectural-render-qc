import datetime as dt

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON, Text
)
from sqlalchemy.orm import relationship

from .database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    assets = relationship("Asset", back_populates="project", cascade="all, delete-orphan")
    runs = relationship("AnalysisRun", back_populates="project", cascade="all, delete-orphan")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    kind = Column(String, nullable=False)  # "render" | "drawing"
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=dt.datetime.utcnow)

    project = relationship("Project", back_populates="assets")


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    render_asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    drawing_asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    status = Column(String, default="completed")  # queued | running | completed | failed
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    project = relationship("Project", back_populates="runs")
    render_asset = relationship("Asset", foreign_keys=[render_asset_id])
    drawing_asset = relationship("Asset", foreign_keys=[drawing_asset_id])
    discrepancies = relationship("Discrepancy", back_populates="run", cascade="all, delete-orphan")


class Discrepancy(Base):
    __tablename__ = "discrepancies"

    id = Column(Integer, primary_key=True)
    run_id = Column(Integer, ForeignKey("analysis_runs.id"), nullable=False)

    element_name = Column(String, nullable=False)   # e.g. "Window W-12"
    element_type = Column(String, nullable=False)   # taxonomy.ELEMENT_TYPES
    error_type = Column(String, nullable=False)      # taxonomy.ERROR_TYPES
    description = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)       # 0..1, AI confidence

    # Normalized (0..1) bounding boxes relative to each image, nullable
    # because e.g. an "extra" element may have no drawing bbox.
    drawing_bbox = Column(JSON, nullable=True)  # {x, y, w, h}
    render_bbox = Column(JSON, nullable=True)   # {x, y, w, h}

    review_status = Column(String, default="unreviewed")  # taxonomy.REVIEW_STATUSES
    is_user_added = Column(Boolean, default=False)  # true for manually-added FN entries
    created_at = Column(DateTime, default=dt.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    run = relationship("AnalysisRun", back_populates="discrepancies")

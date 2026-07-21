import datetime as dt
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class BBox(BaseModel):
    x: float
    y: float
    w: float
    h: float


class ProjectCreate(BaseModel):
    name: str


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    created_at: dt.datetime


class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    kind: str
    original_filename: str
    stored_filename: str
    uploaded_at: dt.datetime

    @property
    def url(self) -> str:
        return f"/uploads/{self.stored_filename}"


class DiscrepancyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    run_id: int
    element_name: str
    element_type: str
    error_type: str
    description: str
    confidence: float
    drawing_bbox: Optional[BBox] = None
    render_bbox: Optional[BBox] = None
    review_status: str
    is_user_added: bool
    created_at: dt.datetime


class DiscrepancyReviewUpdate(BaseModel):
    review_status: str  # tp | fp | fn


class DiscrepancyCreate(BaseModel):
    element_name: str
    element_type: str
    error_type: str
    description: str
    drawing_bbox: Optional[BBox] = None
    render_bbox: Optional[BBox] = None


class AnalysisRunCreate(BaseModel):
    render_asset_id: int
    drawing_asset_id: int


class AnalysisRunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    render_asset_id: int
    drawing_asset_id: int
    status: str
    created_at: dt.datetime


class AnalysisRunDetail(AnalysisRunOut):
    discrepancies: List[DiscrepancyOut] = []


class MetricsOut(BaseModel):
    tp: int
    fp: int
    fn: int
    precision: float
    recall: float
    f1: float
    unreviewed: int
    total: int

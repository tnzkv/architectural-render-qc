import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["assets"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_KINDS = {"render", "drawing"}
# Note: DWG uploads are accepted and stored as-is for the MVP; the real
# pipeline would run them through an ODA/DXF converter to rasterize the
# relevant elevations before analysis. See README "Roadmap".
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf", ".dwg"}


@router.post("/projects/{project_id}/assets", response_model=schemas.AssetOut)
async def upload_asset(
    project_id: int,
    kind: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    if kind not in ALLOWED_KINDS:
        raise HTTPException(400, f"kind must be one of {ALLOWED_KINDS}")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type {ext}")

    stored_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, stored_filename)
    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    asset = models.Asset(
        project_id=project_id,
        kind=kind,
        original_filename=file.filename or stored_filename,
        stored_filename=stored_filename,
        content_type=file.content_type,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/projects/{project_id}/assets", response_model=list[schemas.AssetOut])
def list_assets(project_id: int, kind: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Asset).filter(models.Asset.project_id == project_id)
    if kind:
        q = q.filter(models.Asset.kind == kind)
    return q.order_by(models.Asset.uploaded_at.desc()).all()


@router.get("/assets/{asset_id}", response_model=schemas.AssetOut)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.get(models.Asset, asset_id)
    if not asset:
        raise HTTPException(404, "Asset not found")
    return asset

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..taxonomy import REVIEW_STATUSES

router = APIRouter(tags=["discrepancies"])


@router.get("/runs/{run_id}/discrepancies", response_model=list[schemas.DiscrepancyOut])
def list_discrepancies(
    run_id: int,
    element_type: str | None = None,
    review_status: str | None = None,
    db: Session = Depends(get_db),
):
    run = db.get(models.AnalysisRun, run_id)
    if not run:
        raise HTTPException(404, "Run not found")

    q = db.query(models.Discrepancy).filter(models.Discrepancy.run_id == run_id)
    if element_type:
        q = q.filter(models.Discrepancy.element_type == element_type)
    if review_status:
        q = q.filter(models.Discrepancy.review_status == review_status)
    return q.order_by(models.Discrepancy.id.asc()).all()


@router.post("/runs/{run_id}/discrepancies", response_model=schemas.DiscrepancyOut)
def add_manual_discrepancy(run_id: int, payload: schemas.DiscrepancyCreate, db: Session = Depends(get_db)):
    """User-added False Negative: an error the AI missed entirely."""
    run = db.get(models.AnalysisRun, run_id)
    if not run:
        raise HTTPException(404, "Run not found")

    disc = models.Discrepancy(
        run_id=run_id,
        element_name=payload.element_name,
        element_type=payload.element_type,
        error_type=payload.error_type,
        description=payload.description,
        confidence=1.0,
        drawing_bbox=payload.drawing_bbox.model_dump() if payload.drawing_bbox else None,
        render_bbox=payload.render_bbox.model_dump() if payload.render_bbox else None,
        review_status="fn",
        is_user_added=True,
        reviewed_at=dt.datetime.utcnow(),
    )
    db.add(disc)
    db.commit()
    db.refresh(disc)
    return disc


@router.patch("/discrepancies/{discrepancy_id}", response_model=schemas.DiscrepancyOut)
def review_discrepancy(discrepancy_id: int, payload: schemas.DiscrepancyReviewUpdate, db: Session = Depends(get_db)):
    disc = db.get(models.Discrepancy, discrepancy_id)
    if not disc:
        raise HTTPException(404, "Discrepancy not found")
    if payload.review_status not in REVIEW_STATUSES:
        raise HTTPException(400, f"review_status must be one of {REVIEW_STATUSES}")

    disc.review_status = payload.review_status
    disc.reviewed_at = dt.datetime.utcnow()
    db.commit()
    db.refresh(disc)
    return disc

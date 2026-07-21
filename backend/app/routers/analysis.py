from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..services import mock_ai

router = APIRouter(tags=["analysis"])


@router.post("/projects/{project_id}/analysis", response_model=schemas.AnalysisRunDetail)
def create_analysis_run(project_id: int, payload: schemas.AnalysisRunCreate, db: Session = Depends(get_db)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    render = db.get(models.Asset, payload.render_asset_id)
    drawing = db.get(models.Asset, payload.drawing_asset_id)
    if not render or render.project_id != project_id or render.kind != "render":
        raise HTTPException(400, "Invalid render_asset_id")
    if not drawing or drawing.project_id != project_id or drawing.kind != "drawing":
        raise HTTPException(400, "Invalid drawing_asset_id")

    run = models.AnalysisRun(
        project_id=project_id,
        render_asset_id=render.id,
        drawing_asset_id=drawing.id,
        status="completed",
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    findings = mock_ai.run_comparison(run.id)
    for f in findings:
        db.add(models.Discrepancy(run_id=run.id, **f))
    db.commit()
    db.refresh(run)
    return run


@router.get("/runs/{run_id}", response_model=schemas.AnalysisRunDetail)
def get_run(run_id: int, db: Session = Depends(get_db)):
    run = db.get(models.AnalysisRun, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return run

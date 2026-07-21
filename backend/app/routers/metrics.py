import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["metrics"])


def _compute_metrics(discrepancies: list[models.Discrepancy]) -> schemas.MetricsOut:
    tp = sum(1 for d in discrepancies if d.review_status == "tp")
    fp = sum(1 for d in discrepancies if d.review_status == "fp")
    fn = sum(1 for d in discrepancies if d.review_status == "fn")
    unreviewed = sum(1 for d in discrepancies if d.review_status == "unreviewed")

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

    return schemas.MetricsOut(
        tp=tp, fp=fp, fn=fn,
        precision=round(precision, 4),
        recall=round(recall, 4),
        f1=round(f1, 4),
        unreviewed=unreviewed,
        total=len(discrepancies),
    )


@router.get("/runs/{run_id}/metrics", response_model=schemas.MetricsOut)
def run_metrics(run_id: int, db: Session = Depends(get_db)):
    run = db.get(models.AnalysisRun, run_id)
    if not run:
        raise HTTPException(404, "Run not found")
    return _compute_metrics(run.discrepancies)


@router.get("/runs/{run_id}/export")
def export_run(run_id: int, db: Session = Depends(get_db)):
    run = db.get(models.AnalysisRun, run_id)
    if not run:
        raise HTTPException(404, "Run not found")

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "id", "element_name", "element_type", "error_type", "description",
        "confidence", "review_status", "is_user_added", "created_at",
    ])
    for d in run.discrepancies:
        writer.writerow([
            d.id, d.element_name, d.element_type, d.error_type, d.description,
            d.confidence, d.review_status, d.is_user_added, d.created_at,
        ])
    metrics = _compute_metrics(run.discrepancies)
    writer.writerow([])
    writer.writerow(["Precision", metrics.precision])
    writer.writerow(["Recall", metrics.recall])
    writer.writerow(["F1", metrics.f1])
    writer.writerow(["TP", metrics.tp])
    writer.writerow(["FP", metrics.fp])
    writer.writerow(["FN", metrics.fn])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=run_{run_id}_report.csv"},
    )

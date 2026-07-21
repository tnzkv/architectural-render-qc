import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from . import models  # noqa: F401 ensure models are registered before create_all
from .routers import projects, assets, analysis, discrepancies, metrics, meta

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Architectural Render QC API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(projects.router)
app.include_router(assets.router)
app.include_router(analysis.router)
app.include_router(discrepancies.router)
app.include_router(metrics.router)
app.include_router(meta.router)


@app.get("/health")
def health():
    return {"status": "ok"}

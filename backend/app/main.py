import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models import AnalyticsResult, Dataset, Record, User  # noqa: F401
from app.routes import analytics, auth, datasets, graph, records, upload, websocket
from app.utils.logger import logger
from app.utils.security import hash_password

settings = get_settings()


def seed_admin():
    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.getenv("ADMIN_PASSWORD", "").strip()
    if not admin_email or not admin_password:
        return
    db = SessionLocal()
    try:
        exists = db.query(User).filter(User.email == admin_email).first()
        if not exists:
            admin = User(
                email=admin_email,
                hashed_password=hash_password(admin_password),
                full_name="Admin",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.commit()
            logger.info(f"Admin account created: {admin_email}")
        else:
            logger.info(f"Admin account already exists: {admin_email}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting VERA - creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ready")
    seed_admin()
    yield
    logger.info("VERA shutting down")


app = FastAPI(
    title="VERA Data Intelligence Platform",
    description="Upload, manage, and analyze CSV/JSON datasets with role-based authentication.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration}ms)")
    return response


app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(datasets.router)
app.include_router(records.router)
app.include_router(analytics.router)
app.include_router(graph.router)
app.include_router(websocket.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "VERA API"}

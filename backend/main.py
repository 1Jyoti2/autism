import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

# Ensure current and parent directories are in pythonpath
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.routes import api_router
from app.services.child_service import ChildService
from app.services.screening_service import ScreeningService
from app.services.dashboard_service import DashboardService
from app.services.inference_service import InferenceService
from app.utils.logger import logger, ml_logger

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Seed initial data on startup
def init_db_seeds():
    db = SessionLocal()
    try:
        ChildService.seed_initial_if_empty(db)
        ScreeningService.seed_initial_if_empty(db)
        DashboardService.seed_initial_if_empty(db)
    finally:
        db.close()

init_db_seeds()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for warm-up and graceful shutdown."""
    logger.info(f"Starting {settings.APP_NAME} in '{settings.APP_ENV}' environment...")
    # Pre-warm ML models once at startup
    try:
        InferenceService.preload_all_models()
    except Exception as e:
        ml_logger.error(f"Error during ML model pre-warming: {e}")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Full-stack AI Backend for Early Autism Detection & Behavioral Screening",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static media access
uploads_dir = settings.UPLOAD_DIR
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include API routes under /api and /api/v1 for seamless frontend compatibility
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")

# =====================================================================
# GLOBAL EXCEPTION HANDLERS (Consistent Clean JSON Responses)
# =====================================================================

from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from fastapi import status, HTTPException

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    detail = exc.detail
    error_code = getattr(exc, "error_code", f"HTTP_{exc.status_code}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "statusCode": exc.status_code,
            "status_code": exc.status_code,
            "detail": detail,
            "error": detail,
            "message": detail,
            "errorCode": error_code,
            "path": request.url.path
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_messages = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []) if str(l) not in ["body", "query", "path"])
        msg = err.get("msg", "Invalid value")
        if loc:
            error_messages.append(f"{loc}: {msg}")
        else:
            error_messages.append(msg)
    
    summary_msg = "; ".join(error_messages) if error_messages else "Request validation failed"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "statusCode": 422,
            "status_code": 422,
            "detail": summary_msg,
            "error": summary_msg,
            "message": summary_msg,
            "errorCode": "VALIDATION_ERROR",
            "path": request.url.path
        }
    )

@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error on {request.method} {request.url.path}: {exc}", exc_info=True)
    msg = "Database service is temporarily unavailable. Please try again later."
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "error",
            "statusCode": 503,
            "status_code": 503,
            "detail": msg,
            "error": msg,
            "message": msg,
            "errorCode": "DATABASE_UNAVAILABLE",
            "path": request.url.path
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    msg = str(exc) if settings.DEBUG else "An unexpected internal server error occurred. Please try again later."
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "statusCode": 500,
            "status_code": 500,
            "detail": msg,
            "error": msg,
            "message": msg,
            "errorCode": "INTERNAL_SERVER_ERROR",
            "path": request.url.path
        }
    )

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "environment": settings.APP_ENV,
        "database": "connected",
        "models": {
            "emotion_model_available": settings.EMOTION_MODEL_PATH.exists() or settings.EMOTION_MODEL_ALT_PATH.exists(),
            "video_model_available": settings.VIDEO_MODEL_PATH.exists()
        },
        "ml_inference": InferenceService.get_models_health()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

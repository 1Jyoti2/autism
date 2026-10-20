from fastapi import APIRouter
from app.routes.auth import router as auth_router
from app.routes.children import router as children_router
from app.routes.screenings import router as screenings_router
from app.routes.analysis import router as analysis_router
from app.routes.dashboard import router as dashboard_router
from app.routes.notes import router as notes_router
from app.routes.notifications import router as notifications_router
from app.routes.documents import router as documents_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(children_router, prefix="/children", tags=["Children Management"])
api_router.include_router(screenings_router, prefix="/screenings", tags=["Screenings"])
api_router.include_router(analysis_router, tags=["AI Assessments"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(notes_router, prefix="/notes", tags=["Clinical Notes"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(documents_router, prefix="/documents", tags=["Hospital Documents"])

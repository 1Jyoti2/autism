import sys
import logging
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import (
    User,
    Child,
    ScreeningRecord,
    UploadedFile,
    Prediction,
    PredictionHistory,
    Note,
    Notification,
)
from app.services.child_service import ChildService
from app.services.screening_service import ScreeningService
from app.services.dashboard_service import DashboardService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("init_db")

def init_database():
    """Create all PostgreSQL / SQLAlchemy tables and indexes, then seed initial data."""
    logger.info(f"Initializing database at: {settings.DATABASE_URL.split('@')[-1] if '@' in (settings.DATABASE_URL or '') else settings.DATABASE_URL}")
    
    # Create all tables defined in Base
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables and indexes created successfully:")
    for table_name in Base.metadata.tables.keys():
        logger.info(f"  - {table_name}")

    # Seed initial data
    db = SessionLocal()
    try:
        ChildService.seed_initial_if_empty(db)
        ScreeningService.seed_initial_if_empty(db)
        DashboardService.seed_initial_if_empty(db)
        logger.info("Initial seed data checked and populated successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
    logger.info("Database initialization completed.")

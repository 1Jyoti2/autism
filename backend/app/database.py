import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("app.database")

def create_db_engine():
    db_url = settings.DATABASE_URL or ""
    
    if db_url.startswith("sqlite"):
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            echo=False
        )
    elif "postgresql" in db_url:
        return create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            pool_recycle=3600,
            echo=False
        )
    else:
        return create_engine(db_url, pool_pre_ping=True, echo=False)

try:
    engine = create_db_engine()
except Exception as e:
    logger.warning(f"Could not initialize primary database engine ({e}). Falling back to local SQLite.")
    fallback_url = f"sqlite:///{settings.BASE_DIR / 'autism_detection.db'}"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for obtaining a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

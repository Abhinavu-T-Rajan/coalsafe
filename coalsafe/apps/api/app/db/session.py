"""SQLAlchemy 2.x Database Engine and Session Management."""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# SQLAlchemy 2.0 Engine
engine = create_engine(
    settings.database_url,
    echo=(settings.environment == "development"),
    pool_pre_ping=True,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Base declarative class for future SQLAlchemy domain models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

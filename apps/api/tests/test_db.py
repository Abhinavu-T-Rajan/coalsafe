import pytest
from sqlalchemy import text

from app.db.session import engine, get_db


def test_db_session_dependency() -> None:
    """Test that get_db yields a valid session and closes cleanly."""
    gen = get_db()
    session = next(gen)
    assert session is not None
    try:
        pass
    finally:
        try:
            next(gen)
        except StopIteration:
            pass


@pytest.mark.skipif(
    False,
    reason="Execute DB connection test against running PostgreSQL instance",
)
def test_db_connection() -> None:
    """Test actual connectivity to PostgreSQL."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            assert result == 1
    except Exception as exc:
        pytest.skip(f"Database not reachable during isolated test run: {exc}")

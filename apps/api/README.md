# COALSAFE API

FastAPI backend service for the COALSAFE platform.

## Development

```powershell
# Install dependencies
uv sync

# Run migrations
uv run alembic upgrade head

# Start development server
uv run uvicorn app.main:app --reload --port 8000

# Run tests & linter
uv run pytest
uv run ruff check .
```

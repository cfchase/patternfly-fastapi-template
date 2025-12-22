# Backend CLAUDE.md

Guidelines for working with the FastAPI backend.

## Project Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── app/
│   ├── api/
│   │   ├── router.py          # Main API router (mounts v1)
│   │   └── routes/v1/
│   │       ├── router.py      # V1 router (mounts sub-routers)
│   │       └── utils/
│   │           └── health.py  # Health check endpoint
│   └── core/
│       ├── config.py          # Settings (Pydantic Settings)
│       ├── logging.py         # Logging configuration
│       └── middleware.py      # Request logging middleware
├── tests/
│   └── test_main.py           # API tests
├── pyproject.toml             # Python dependencies
└── uv.lock                    # Lock file
```

## API Route Architecture

```
main.py → /api → api/router.py → /v1 → routes/v1/router.py → /utils → health.py
```

Results in: `GET /api/v1/utils/health-check`

## Adding New Endpoints

### 1. Create Route File

```python
# app/api/routes/v1/items.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_items():
    return {"items": []}

@router.post("/")
async def create_item(name: str):
    return {"id": 1, "name": name}
```

### 2. Register in V1 Router

```python
# app/api/routes/v1/router.py
from .items import router as items_router

router.include_router(items_router, prefix="/items", tags=["items"])
```

### 3. Access Endpoints

- `GET /api/v1/items/`
- `POST /api/v1/items/`

## Configuration

Settings are loaded from environment variables via Pydantic Settings:

```python
from app.core.config import settings

# Access settings
print(settings.ENVIRONMENT)  # local, development, staging, production
print(settings.is_development)  # True for local/development
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `local` | Environment name |
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `CORS_ORIGINS` | `["http://localhost:8080", "http://localhost:5173"]` | Allowed CORS origins |

## Logging

Use the logging module for consistent log formatting:

```python
from app.core.logging import get_logger

logger = get_logger(__name__)

logger.info("Processing request")
logger.debug("Debug details")
logger.warning("Something unexpected")
logger.error("Error occurred", exc_info=True)
```

## Testing

```bash
# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test
uv run pytest tests/test_main.py::test_health_check

# Run with coverage
uv run pytest --cov=app --cov-report=term-missing
```

### Writing Tests

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/utils/health-check")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

## Common Tasks

### Add a Dependency

```bash
cd backend
uv add package-name

# Dev dependency
uv add --dev pytest-cov
```

### Run Development Server

```bash
cd backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Check API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Code Style

- Use async functions for route handlers
- Use type hints for all function parameters and returns
- Use Pydantic models for request/response schemas
- Follow PEP 8 naming conventions

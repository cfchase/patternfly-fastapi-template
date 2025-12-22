# Development Guide

This guide covers local development setup and common workflows.

## Prerequisites

- **Node.js 22+** - For frontend development
- **Python 3.11+** - For backend development
- **uv** - Python package manager ([install](https://docs.astral.sh/uv/getting-started/installation/))
- **Docker** or **Podman** - For container builds (optional)

## Quick Start

```bash
# Install all dependencies
make setup

# Start development servers (frontend + backend)
make dev
```

This starts:
- Frontend: http://localhost:8080 (Vite dev server)
- Backend: http://localhost:8000 (FastAPI with hot reload)

## Development Servers

### Run Both Servers

```bash
make dev
```

### Run Individually

```bash
# Frontend only
make dev-frontend

# Backend only
make dev-backend
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/routes/v1/    # API route handlers
│   │   └── core/             # Config, logging, middleware
│   ├── main.py               # FastAPI application
│   └── pyproject.toml        # Python dependencies
├── frontend/
│   ├── src/app/              # React components
│   │   ├── api/              # API client
│   │   ├── contexts/         # React contexts
│   │   └── AppLayout/        # Main layout
│   ├── vite.config.ts        # Vite configuration
│   └── package.json          # Node dependencies
└── k8s/                      # Kubernetes manifests
```

## API Development

### Adding a New Endpoint

1. Create a route file in `backend/app/api/routes/v1/`:

```python
# backend/app/api/routes/v1/example.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/hello")
async def hello():
    return {"message": "Hello, World!"}
```

2. Register the router in `backend/app/api/routes/v1/router.py`:

```python
from .example import router as example_router
router.include_router(example_router, prefix="/example", tags=["example"])
```

3. Access at: `GET /api/v1/example/hello`

### API Documentation

FastAPI automatically generates OpenAPI documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Frontend Development

### Adding a New Page

1. Create component in `frontend/src/app/YourPage/YourPage.tsx`
2. Add route in `frontend/src/app/routeConfig.tsx`
3. Navigation updates automatically from route config

### Using the API Client

```typescript
import apiClient from '@app/api/apiClient';

// GET request
const response = await apiClient.get('/v1/example/hello');

// POST request
const result = await apiClient.post('/v1/items', { name: 'Test' });
```

### Using Toast Notifications

```typescript
import { useToast } from '@app/contexts/ToastContext';

const MyComponent = () => {
  const { addSuccessToast, addErrorToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      addSuccessToast('Saved successfully');
    } catch (error) {
      addErrorToast('Failed to save', error.message);
    }
  };
};
```

## Environment Variables

### Backend

Create `backend/.env`:

```bash
ENVIRONMENT=local          # local, development, staging, production
HOST=0.0.0.0
PORT=8000
```

### Frontend

Environment variables must be prefixed with `VITE_` to be exposed to the browser.

## Testing

```bash
# Run all tests
make test

# Frontend tests
make test-frontend
cd frontend && npm run test:watch  # Watch mode

# Backend tests
make test-backend
make test-backend-verbose          # Verbose output
make test-backend-coverage         # With coverage
```

## Linting & Type Checking

```bash
# Frontend linting
make lint

# TypeScript type checking
cd frontend && npm run typecheck
```

## Version Management

```bash
# Show current version
make version

# Bump versions
make bump-patch  # 1.0.0 → 1.0.1
make bump-minor  # 1.0.0 → 1.1.0
make bump-major  # 1.0.0 → 2.0.0

# Sync VERSION to package.json and pyproject.toml
make sync-version
```

## Building Containers

```bash
# Build with 'latest' tag
make build

# Build with 'prod' tag
make build-prod

# Custom tag
make TAG=v1.0.0 build

# Use podman instead of docker
make CONTAINER_TOOL=podman build
```

## Troubleshooting

### Frontend not connecting to backend

Check that Vite proxy is configured in `frontend/vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

### Backend import errors

Ensure you're in the backend directory and dependencies are installed:
```bash
cd backend && uv sync
```

### Port already in use

Kill existing processes:
```bash
# Find process using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

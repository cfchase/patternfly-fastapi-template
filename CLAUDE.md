# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Web application template with React frontend using PatternFly design system and FastAPI REST API backend, designed for OpenShift deployment via Kustomize.

## Project Structure

```
├── backend/
│   ├── app/api/routes/v1/    # Versioned API routes
│   ├── main.py               # FastAPI app with CORS middleware
│   ├── pyproject.toml        # Python dependencies (managed by uv)
│   └── Dockerfile            # Backend container
├── frontend/
│   ├── src/app/              # React components and layouts
│   │   ├── AppLayout/        # Main layout with PatternFly Masthead & PageSidebar
│   │   ├── Dashboard/        # Example dashboard with health check
│   │   └── Settings/         # Settings pages (General, Profile)
│   ├── vite.config.ts        # Vite config with /api proxy and path aliases
│   ├── nginx.conf            # Production proxy config
│   └── Dockerfile            # Multi-stage build (Node → Nginx)
├── k8s/
│   ├── base/                 # Base kustomize resources
│   └── overlays/{dev,prod}/  # Environment-specific patches
└── scripts/                  # Build and deployment automation
```

## Development Commands

### Local Development
```bash
make setup             # Install all dependencies
make dev              # Run both frontend (8080) and backend (8000)
make dev-frontend     # Run React dev server only
make dev-backend      # Run FastAPI server only
```

### Testing
```bash
make test                      # Run all tests (frontend + backend)
make test-frontend             # Run frontend Vitest tests once
cd frontend && npm run test:watch  # Run frontend tests in watch mode
make test-backend              # Run backend pytest
make test-backend-verbose      # Run backend pytest with -v
make lint                      # Run frontend ESLint
cd frontend && npm run typecheck   # TypeScript type checking
```

### Building and Deployment
```bash
# Build container images
make build                                      # Build with 'latest' tag
make build-prod                                 # Build with 'prod' tag
make TAG=v1.0.0 build                           # Build with custom tag
make CONTAINER_TOOL=podman build                # Use podman instead of docker
make TAG=v1.0.0 CONTAINER_TOOL=podman build     # Combine options

# Push to registry (default: quay.io/cfchase)
make push                  # Push 'latest' tag
make push-prod             # Push 'prod' tag

# Deploy to OpenShift
make deploy                # Deploy to dev (requires 'latest' tag)
make deploy-prod           # Deploy to prod (requires 'prod' tag)
make kustomize             # Preview dev manifests
make undeploy              # Remove dev deployment
```

**Important**: K8s overlays expect specific image tags:
- Development: `latest` (default)
- Production: `prod`

## Architecture

### Frontend (React + PatternFly + Vite)

**Stack**: React 18.3 with TypeScript, PatternFly 6.x, Vite 7.x, React Router 7.x

**Key Components**:
- `AppLayout/AppLayout.tsx` - Main layout with PatternFly Masthead (header) and PageSidebar (collapsible navigation)
- `Dashboard/Dashboard.tsx` - Example page with health check integration
- `routeConfig.tsx` - Central route configuration for navigation

**Design System**:
- Uses PatternFly components (`@patternfly/react-core`, `@patternfly/react-icons`)
- PatternFly Chatbot components available (`@patternfly/chatbot`)
- Path alias `@app` → `frontend/src/app`
- Path alias `@assets` → PatternFly assets
- SVG support via `vite-plugin-svgr` (excludes PatternFly fonts/icons)

**API Communication**:
- Axios for HTTP requests
- Local dev: Vite proxy forwards `/api/*` to `http://localhost:8000` (vite.config.ts:30-35)
- Production: Nginx proxy forwards `/api/*` to backend service (nginx.conf)

**Production Build**:
- Multi-stage Dockerfile: Node 22 Alpine → Nginx Alpine
- Nginx serves static files and proxies `/api/` routes
- Optimized for OpenShift (non-root user, proper permissions)

### Backend (FastAPI with Versioned API)

**Stack**: Python 3.11, FastAPI, Uvicorn, Pydantic Settings, Anthropic SDK

**Package Management**: UV package manager for fast, reliable dependency management

**API Architecture** (nested routers):
```
main.py → /api → api/router.py → /v1 → routes/v1/router.py → /utils → health.py
```

Results in endpoint: `GET /api/v1/utils/health-check`

**Key Files**:
- `main.py` - FastAPI app setup, CORS middleware, includes `/api` router
- `app/api/router.py` - Mounts v1 router at `/api/v1`
- `app/api/routes/v1/router.py` - Mounts utils router at `/api/v1/utils`
- `app/api/routes/v1/utils/health.py` - Health check endpoint

**Adding New Endpoints**:
1. Create new route file in `app/api/routes/v1/`
2. Create router and define endpoints
3. Include router in `app/api/routes/v1/router.py`

Example:
```python
# app/api/routes/v1/foo/bar.py
from fastapi import APIRouter
router = APIRouter()

@router.get("/baz")
async def get_baz():
    return {"result": "baz"}

# app/api/routes/v1/router.py
from .foo.bar import router as bar_router
router.include_router(bar_router, prefix="/foo")
# Results in: GET /api/v1/foo/baz
```

**CORS Configuration**:
- Allows origins: `http://localhost:8080`, `http://localhost:5173`
- Configured in main.py:14-20

### Deployment (OpenShift/Kubernetes)

**Kustomize Structure**:
- `k8s/base/` - Base resources (deployments, services, routes)
- `k8s/overlays/dev/` - Development patches (namespace: patternfly-fastapi-dev, image tag: latest)
- `k8s/overlays/prod/` - Production patches (namespace: patternfly-fastapi-prod, image tag: prod)

**Security**:
- Runs as non-root user (both containers)
- Security contexts configured for OpenShift SCC compatibility
- Health probes configured (backend: `/api/v1/utils/health-check`, frontend: `/`)

**Routes**:
- Frontend: TLS edge termination
- Backend: TLS edge termination
- Both exposed via OpenShift Routes (see `k8s/base/route.yaml`)

## API Endpoints

Current endpoints:
- `GET /` - Root endpoint (returns API metadata)
- `GET /api/v1/utils/health-check` - Health check endpoint

Frontend calls health check at: `frontend/src/app/Dashboard/Dashboard.tsx:16`

## Key Configuration

- `frontend/vite.config.ts` - Vite dev server (port 8080), proxy `/api` to backend, path aliases
- `frontend/nginx.conf` - Production proxy: `/api/` → `http://backend-service:8000/api/`
- `backend/main.py` - FastAPI setup, CORS for local dev ports
- `backend/pyproject.toml` - Python dependencies managed by uv
- `k8s/base/kustomization.yaml` - Image registry and tags
- `k8s/overlays/*/kustomization.yaml` - Environment-specific namespaces and image tags

## Common Tasks

### Adding New Dependencies
- Frontend: `cd frontend && npm install <package>`
- Backend: `cd backend && uv add <package>` (automatically updates pyproject.toml and uv.lock)

## Git Commit Guidelines

When creating git commits:
- Use clear, descriptive commit messages
- Follow conventional commit format when appropriate
- Do NOT include any AI assistant attribution or co-authorship
- Keep commit messages focused on the actual changes made

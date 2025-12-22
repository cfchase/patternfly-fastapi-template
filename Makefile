# React FastAPI Template Makefile

# Container Registry Operations
REGISTRY ?= quay.io/cfchase
TAG ?= latest

# Auto-detect container tool (check which daemon is actually running, podman preferred)
CONTAINER_TOOL ?= $(shell if podman info >/dev/null 2>&1; then echo podman; elif docker info >/dev/null 2>&1; then echo docker; else echo docker; fi)


.PHONY: help setup setup-ci dev build build-prod test test-frontend test-backend update-tests clean push push-prod deploy deploy-prod undeploy undeploy-prod kustomize kustomize-prod version bump-patch bump-minor bump-major sync-version lint typecheck

# Default target
help: ## Show this help message
	@echo "React FastAPI Template - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Setup and Installation
setup: ## Install all dependencies
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing backend dependencies..."
	cd backend && uv sync --extra dev
	@echo "Setup complete!"

setup-frontend: ## Install frontend dependencies only
	cd frontend && npm install

setup-backend: ## Install backend dependencies only
	cd backend && uv sync --extra dev

setup-ci: ## Install all dependencies for CI (uses npm ci for reproducible builds)
	@echo "Installing frontend dependencies (CI mode)..."
	cd frontend && npm ci
	@echo "Installing backend dependencies..."
	cd backend && uv sync --extra dev
	@echo "CI setup complete!"

# Development
dev: ## Run both frontend and backend in development mode
	@echo "Starting development servers..."
	npx concurrently "make dev-backend" "make dev-frontend"

dev-frontend: ## Run frontend development server
	cd frontend && npm run dev

dev-backend: ## Run backend development server
	cd backend && uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Building
build-frontend: ## Build frontend for production
	cd frontend && npm run build

build: build-frontend ## Build frontend and container images
	@echo "Building container images for $(REGISTRY) with tag $(TAG) using $(CONTAINER_TOOL)..."
	./scripts/build-images.sh $(TAG) $(REGISTRY) $(CONTAINER_TOOL)

build-prod: build-frontend ## Build frontend and container images for production
	@echo "Building container images for $(REGISTRY) with tag prod using $(CONTAINER_TOOL)..."
	./scripts/build-images.sh prod $(REGISTRY) $(CONTAINER_TOOL)

# Testing
test: test-frontend test-backend ## Run all tests (frontend and backend)

test-frontend: lint ## Run frontend linting, type checking, and tests
	@echo "Running TypeScript type checking..."
	cd frontend && npx tsc --noEmit
	@echo "Running frontend tests..."
	cd frontend && npm run test

test-backend: ## Run backend tests (use VERBOSE=1, COVERAGE=1, FILE=path as needed)
	@echo "Syncing backend dependencies..."
	@cd backend && uv sync --extra dev
	@echo "Running backend tests..."
	@PYTEST_ARGS=""; \
	if [ "$(VERBOSE)" = "1" ]; then PYTEST_ARGS="$$PYTEST_ARGS -v"; fi; \
	if [ "$(COVERAGE)" = "1" ]; then PYTEST_ARGS="$$PYTEST_ARGS --cov=app --cov-report=term-missing"; fi; \
	if [ -n "$(FILE)" ]; then PYTEST_ARGS="$$PYTEST_ARGS $(FILE)"; fi; \
	cd backend && uv run pytest $$PYTEST_ARGS

update-tests: ## Update frontend test snapshots
	@echo "Updating frontend test snapshots..."
	cd frontend && npm run test -- --update

lint: ## Run linting on frontend
	cd frontend && npm run lint

typecheck: ## Run TypeScript type checking on frontend
	cd frontend && npm run typecheck

push: ## Push container images to registry
	@echo "Pushing images to $(REGISTRY) with tag $(TAG) using $(CONTAINER_TOOL)..."
	./scripts/push-images.sh $(TAG) $(REGISTRY) $(CONTAINER_TOOL)

push-prod: ## Push container images to registry with prod tag
	@echo "Pushing images to $(REGISTRY) with tag prod using $(CONTAINER_TOOL)..."
	./scripts/push-images.sh prod $(REGISTRY) $(CONTAINER_TOOL)

# OpenShift/Kubernetes Deployment
kustomize: ## Preview development deployment manifests
	kustomize build k8s/overlays/dev

kustomize-prod: ## Preview production deployment manifests
	kustomize build k8s/overlays/prod

deploy: ## Deploy to development environment
	@echo "Deploying to development..."
	./scripts/deploy.sh dev

deploy-prod: ## Deploy to production environment
	@echo "Deploying to production..."
	./scripts/deploy.sh prod

undeploy: ## Remove development deployment
	@echo "Removing development deployment..."
	./scripts/undeploy.sh dev

undeploy-prod: ## Remove production deployment
	@echo "Removing production deployment..."
	./scripts/undeploy.sh prod

# Environment Setup
env-setup: ## Copy environment example files
	@echo "Setting up environment files..."
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; echo "Created backend/.env"; fi
	@if [ ! -f frontend/.env ]; then cp frontend/.env.example frontend/.env; echo "Created frontend/.env"; fi

# Health Checks
health-backend: ## Check backend health
	@echo "Checking backend health..."
	@curl -f http://localhost:8000/api/v1/utils/health-check || echo "Backend not responding"

health-frontend: ## Check if frontend is running
	@echo "Checking frontend..."
	@curl -f http://localhost:8080 || echo "Frontend not responding"

# Cleanup
clean: ## Clean build artifacts and dependencies
	@echo "Cleaning build artifacts..."
	rm -rf frontend/dist
	rm -rf frontend/node_modules
	rm -rf backend/__pycache__
	rm -rf backend/.pytest_cache

clean-all: clean ## Clean everything

# Development Workflow
fresh-start: clean setup env-setup ## Clean setup for new development
	@echo "Fresh development environment ready!"

quick-start: setup env-setup dev ## Quick start for development

# Version Management
version: ## Show current version
	@cat VERSION

bump-patch: ## Bump patch version (1.0.0 → 1.0.1)
	./scripts/bump-version.sh patch

bump-minor: ## Bump minor version (1.0.0 → 1.1.0)
	./scripts/bump-version.sh minor

bump-major: ## Bump major version (1.0.0 → 2.0.0)
	./scripts/bump-version.sh major

sync-version: ## Sync VERSION to package.json and pyproject.toml
	./scripts/sync-version.sh


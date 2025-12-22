# Deployment Guide

This guide covers deploying the application to Kubernetes/OpenShift.

## Prerequisites

- **kubectl** or **oc** - Kubernetes/OpenShift CLI
- **kustomize** - Kubernetes configuration management
- Container registry access (default: quay.io)

## Quick Deploy

```bash
# Build and push images
make build
make push

# Deploy to development environment
make deploy

# Deploy to production
make build-prod
make push-prod
make deploy-prod
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    OpenShift Route                       │
│                  (TLS termination)                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend (Nginx:8080)                       │
│    - Serves static React app                            │
│    - Proxies /api/* to backend (internal)               │
└─────────────────────┬───────────────────────────────────┘
                      │ /api/* (internal only)
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (FastAPI:8000)                      │
│    - No external route (cluster-internal only)          │
│    - Accessed only via frontend proxy                   │
└─────────────────────────────────────────────────────────┘
```

The backend has no external route - all traffic flows through the frontend nginx proxy.

## Container Images

### Building

```bash
# Build with default tag (latest)
make build

# Build with production tag
make build-prod

# Build with custom tag
make TAG=v1.0.0 build

# Use podman instead of docker
make CONTAINER_TOOL=podman build
```

### Pushing to Registry

```bash
# Push to default registry (quay.io/cfchase)
make push

# Push with custom registry
make REGISTRY=quay.io/myorg push

# Push production images
make push-prod
```

## Kubernetes Resources

### Directory Structure

```
k8s/
├── base/                          # Base resources
│   ├── kustomization.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   └── route.yaml
└── overlays/
    ├── dev/                       # Development environment
    │   ├── kustomization.yaml
    │   └── deployment-patch.yaml
    └── prod/                      # Production environment
        ├── kustomization.yaml
        └── deployment-patch.yaml
```

### Preview Manifests

```bash
# Preview development manifests
make kustomize

# Preview production manifests
make kustomize-prod
```

### Deploy

```bash
# Deploy to development
make deploy

# Deploy to production
make deploy-prod

# Remove deployment
make undeploy
make undeploy-prod
```

## Environment Configuration

### Development

- Namespace: `patternfly-fastapi-dev`
- Image tag: `latest`
- Replicas: 1 frontend, 1 backend

### Production

- Namespace: `patternfly-fastapi-prod`
- Image tag: `prod`
- Replicas: 2 frontend, 3 backend

## Resource Limits

### Backend

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Frontend

```yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

## Health Checks

### Backend

```yaml
readinessProbe:
  httpGet:
    path: /api/v1/utils/health-check
    port: 8000
livenessProbe:
  tcpSocket:
    port: 8000
```

### Frontend

```yaml
readinessProbe:
  httpGet:
    path: /
    port: 8080
livenessProbe:
  tcpSocket:
    port: 8080
```

## Customizing Deployment

### Change Registry

Edit `k8s/base/kustomization.yaml`:

```yaml
images:
  - name: backend
    newName: your-registry.io/your-org/backend
  - name: frontend
    newName: your-registry.io/your-org/frontend
```

### Change Namespace

Edit `k8s/overlays/dev/kustomization.yaml`:

```yaml
namespace: your-namespace
```

### Add Environment Variables

Add to `k8s/overlays/dev/deployment-patch.yaml`:

```yaml
- op: add
  path: /spec/template/spec/containers/0/env/-
  value:
    name: MY_VAR
    value: "my-value"
```

### Add Secrets

1. Create secret:
```bash
kubectl create secret generic my-secret \
  --from-literal=API_KEY=xxx \
  -n patternfly-fastapi-dev
```

2. Reference in deployment patch:
```yaml
- op: add
  path: /spec/template/spec/containers/0/envFrom/-
  value:
    secretRef:
      name: my-secret
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n patternfly-fastapi-dev
kubectl describe pod <pod-name> -n patternfly-fastapi-dev
```

### View Logs

```bash
# Backend logs
kubectl logs -l app=backend -n patternfly-fastapi-dev

# Frontend logs
kubectl logs -l app=frontend -n patternfly-fastapi-dev

# Follow logs
kubectl logs -f <pod-name> -n patternfly-fastapi-dev
```

### Check Services

```bash
kubectl get svc -n patternfly-fastapi-dev
kubectl get routes -n patternfly-fastapi-dev  # OpenShift
```

### Debug Pod

```bash
# Shell into pod
kubectl exec -it <pod-name> -n patternfly-fastapi-dev -- /bin/sh

# Port forward for local testing
kubectl port-forward svc/backend-service 8000:8000 -n patternfly-fastapi-dev
```

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) handles:

1. **On Pull Request**: Run tests
2. **On Push to Main**: Build and push `latest` images
3. **On Release**: Build and push versioned + `prod` images

### Required Secrets

Set these in GitHub repository settings:

- `QUAY_USERNAME` - Quay.io username
- `QUAY_PASSWORD` - Quay.io password or token

## OAuth2 Proxy Authentication (Optional)

This template includes optional OAuth2-proxy support for authentication.

### Architecture with OAuth2-Proxy

```
┌─────────────────────────────────────────────────────────┐
│                    OpenShift Route                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   OAuth2-Proxy                           │
│         (handles authentication, sets headers)           │
└─────────────────────┬───────────────────────────────────┘
                      │ X-Forwarded-User headers
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│    Frontend     │       │    Backend      │
│  (Nginx:8080)   │──────▶│  (FastAPI:8000) │
└─────────────────┘       └─────────────────┘
```

### Important Security Note

The backend trusts `X-Forwarded-*` headers for user identity. You MUST ensure:

1. **Network isolation**: Backend is only accessible from OAuth2-proxy
2. **No direct access**: Use NetworkPolicy to block direct backend access
3. **Proxy required**: All traffic must flow through OAuth2-proxy

### Configuration Files

OAuth2 proxy configuration templates are provided but **not enabled by default**:

- `k8s/base/oauth2-proxy-config.yaml` - ConfigMap template
- `k8s/base/oauth2-proxy-secret.yaml.example` - Secret template
- `k8s/base/serviceaccount.yaml` - Service account for OpenShift OAuth

### Enabling OAuth2 Proxy

1. Copy and configure the secret:
   ```bash
   cp k8s/base/oauth2-proxy-secret.yaml.example k8s/base/oauth2-proxy-secret.yaml
   # Edit with your OAuth provider credentials
   ```

2. Add to `k8s/base/kustomization.yaml`:
   ```yaml
   resources:
     - oauth2-proxy-config.yaml
     - oauth2-proxy-secret.yaml
     - serviceaccount.yaml
   ```

3. Add OAuth2-proxy as sidecar or separate deployment
4. Configure NetworkPolicy to restrict backend access

### Local Development

In local development (`ENVIRONMENT=local`), the backend returns a default
dev-user without requiring OAuth headers, allowing development without
the full proxy setup.

## Security

### Container Security

Both containers run as non-root with these security contexts:

```yaml
securityContext:
  allowPrivilegeEscalation: false
  runAsNonRoot: true
  capabilities:
    drop:
      - ALL
```

### Network Security

- TLS termination at Route/Ingress level
- Internal communication over cluster network
- No direct external access to backend

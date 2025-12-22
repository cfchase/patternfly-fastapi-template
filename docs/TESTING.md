# Testing Guide

This guide covers testing strategies for both frontend and backend.

## Quick Reference

```bash
# Run all tests
make test

# Frontend
make test-frontend
cd frontend && npm run test:watch  # Watch mode

# Backend
make test-backend
make test-backend-verbose          # Verbose output
make test-backend-coverage         # With coverage report
```

## Frontend Testing

### Stack

- **Vitest** - Test runner (Jest-compatible)
- **React Testing Library** - Component testing
- **Playwright** - Browser provider for Vitest
- **@testing-library/user-event** - User interaction simulation

### Running Tests

```bash
cd frontend

# Run once
npm run test

# Watch mode (re-runs on file changes)
npm run test:watch

# Type checking
npm run typecheck
```

### Writing Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Using Test Utilities

The `test-utils.tsx` file provides PatternFly-specific helpers:

```typescript
import { tableHelpers, modalHelpers, formHelpers } from '@app/test-utils';

// Table helpers
const rowCount = tableHelpers.getRowCount();
const columnData = tableHelpers.getColumnData('Name');
tableHelpers.expectAllRowCheckboxes(true);

// Modal helpers
expect(modalHelpers.isModalOpen('Confirm Delete')).toBe(true);
await modalHelpers.closeModal(user);

// Form helpers
await formHelpers.fillInput(user, 'Name', 'John Doe');
await formHelpers.selectOption(user, 'Status', 'Active');
```

### Testing with Providers

When components need context providers:

```typescript
import { ToastProvider } from '@app/contexts/ToastContext';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ToastProvider>
      {ui}
    </ToastProvider>
  );
};

it('should show toast on error', async () => {
  renderWithProviders(<MyComponent />);
  // ... test code
});
```

### Mocking API Calls

```typescript
import { vi } from 'vitest';
import apiClient from '@app/api/apiClient';

vi.mock('@app/api/apiClient');

it('should fetch data', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({
    data: { items: [{ id: 1, name: 'Test' }] }
  });

  render(<MyComponent />);
  await screen.findByText('Test');
});
```

## Backend Testing

### Stack

- **pytest** - Test framework
- **pytest-asyncio** - Async test support
- **httpx** - Async HTTP client for testing FastAPI
- **FastAPI TestClient** - Sync testing helper

### Running Tests

```bash
cd backend

# Run all tests
uv run pytest

# Verbose output
uv run pytest -v

# Specific test file
uv run pytest tests/test_main.py

# Specific test function
uv run pytest tests/test_main.py::test_health_check

# With coverage
uv run pytest --cov=app --cov-report=term-missing
```

### Writing Tests

```python
# tests/test_example.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "API" in response.json()["message"]

def test_health_check():
    response = client.get("/api/v1/utils/health-check")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

### Async Tests

```python
import pytest
from httpx import AsyncClient, ASGITransport
from main import app

@pytest.mark.asyncio
async def test_async_endpoint():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/utils/health-check")
        assert response.status_code == 200
```

### Test Fixtures

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)

@pytest.fixture
def auth_headers():
    """Simulate authenticated user headers."""
    return {
        "X-Forwarded-User": "testuser",
        "X-Forwarded-Email": "test@example.com",
    }
```

### Testing with Environment Variables

```python
import os
import pytest

@pytest.fixture(autouse=True)
def set_test_env():
    """Set test environment variables."""
    os.environ["ENVIRONMENT"] = "local"
    yield
    # Cleanup if needed
```

## Test Organization

### Frontend

```
frontend/
├── src/app/
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   └── Dashboard.test.tsx    # Co-located tests
│   └── __tests__/                # Shared test utilities
└── vitest.config.ts
```

### Backend

```
backend/
├── tests/
│   ├── conftest.py               # Shared fixtures
│   ├── test_main.py              # Main app tests
│   └── test_api/
│       └── test_health.py        # API endpoint tests
└── pytest.ini                    # pytest configuration
```

## CI Integration

Tests run automatically in GitHub Actions:

```yaml
# .github/workflows/ci.yml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run frontend tests
      run: cd frontend && npm ci && npm run test
    - name: Run backend tests
      run: cd backend && uv sync && uv run pytest
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the user sees
2. **Use meaningful test names** - Describe expected behavior
3. **Keep tests independent** - Each test should run in isolation
4. **Mock external dependencies** - API calls, timers, etc.
5. **Test edge cases** - Empty states, errors, loading states
6. **Maintain test coverage** - Aim for critical paths, not 100%

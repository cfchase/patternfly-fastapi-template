# Frontend CLAUDE.md

Guidelines for working with the React frontend.

## Project Structure

```
frontend/
├── src/
│   └── app/
│       ├── api/
│       │   └── apiClient.ts      # Centralized axios client
│       ├── contexts/
│       │   └── ToastContext.tsx  # Toast notification context
│       ├── AppLayout/
│       │   └── AppLayout.tsx     # Main layout with navigation
│       ├── Dashboard/
│       │   └── Dashboard.tsx     # Dashboard page
│       ├── Settings/
│       │   ├── General/
│       │   └── Profile/
│       ├── routeConfig.tsx       # Route definitions
│       ├── routes.tsx            # React Router setup
│       ├── index.tsx             # App entry point
│       └── test-utils.tsx        # PatternFly test helpers
├── vite.config.ts                # Vite configuration
├── vitest.config.ts              # Test configuration
└── package.json                  # Dependencies
```

## Technology Stack

- **React 18.3** - UI framework
- **TypeScript 5.8** - Type safety
- **Vite 7.x** - Build tool and dev server
- **PatternFly 6.x** - Design system
- **React Router 7.x** - Routing
- **Axios** - HTTP client
- **Vitest** - Testing

## Path Aliases

```typescript
import Something from '@app/components/Something';  // src/app/
import logo from '@assets/images/logo.svg';          // PatternFly assets
```

Configured in `vite.config.ts` and `tsconfig.json`.

## Adding a New Page

### 1. Create Component

```typescript
// src/app/MyPage/MyPage.tsx
import * as React from 'react';
import { PageSection, Title } from '@patternfly/react-core';

const MyPage: React.FC = () => {
  return (
    <PageSection>
      <Title headingLevel="h1">My Page</Title>
    </PageSection>
  );
};

export { MyPage };
```

### 2. Add Route

```typescript
// src/app/routeConfig.tsx
import { MyPage } from '@app/MyPage/MyPage';

export const routes: IAppRoute[] = [
  // ... existing routes
  {
    component: MyPage,
    exact: true,
    label: 'My Page',
    path: '/my-page',
    title: 'My Page',
  },
];
```

Navigation updates automatically from route config.

## API Calls

Use the centralized API client:

```typescript
import apiClient from '@app/api/apiClient';

// GET request
const response = await apiClient.get('/v1/items');

// POST request
const result = await apiClient.post('/v1/items', { name: 'Test' });

// With error handling
try {
  const data = await apiClient.get('/v1/items');
} catch (error) {
  if (isAxiosError(error)) {
    console.error(error.response?.data?.detail);
  }
}
```

## Toast Notifications

```typescript
import { useToast } from '@app/contexts/ToastContext';

const MyComponent = () => {
  const { addSuccessToast, addErrorToast, addInfoToast, addWarningToast } = useToast();

  const handleSuccess = () => {
    addSuccessToast('Operation completed', 'Optional details here');
  };

  const handleError = () => {
    addErrorToast('Something went wrong', 'Error details');
  };
};
```

## Testing

```bash
# Run once
npm run test

# Watch mode
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Writing Tests

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Using Test Utilities

```typescript
import { tableHelpers, modalHelpers, formHelpers } from '@app/test-utils';

// Table helpers
const rowCount = tableHelpers.getRowCount();
const data = tableHelpers.getColumnData('Name');

// Modal helpers
const isOpen = modalHelpers.isModalOpen('Confirm');

// Form helpers
await formHelpers.fillInput(user, 'Name', 'John');
```

## PatternFly Components

Import from `@patternfly/react-core`:

```typescript
import {
  Button,
  Card,
  CardBody,
  PageSection,
  Title,
  Alert,
  Modal,
  Form,
  FormGroup,
  TextInput,
} from '@patternfly/react-core';
```

Icons from `@patternfly/react-icons`:

```typescript
import { CogIcon, UserIcon, HomeIcon } from '@patternfly/react-icons';
```

## Development Server

```bash
npm run dev
```

Runs on http://localhost:8080 with:
- Hot module replacement
- API proxy to backend (`/api` → `http://localhost:8000`)

## Code Style

- Use functional components with hooks
- Use TypeScript interfaces for props
- Follow PatternFly design patterns
- Use React.FC for component typing
- Prefer named exports over default exports

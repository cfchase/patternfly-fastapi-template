import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppLayout } from '@app/AppLayout/AppLayout';
import { AppRoutes } from '@app/routes';
import { AppProvider } from '@app/contexts/AppContext';
import { ToastProvider } from '@app/contexts/ToastContext';
import '@app/app.css';

const App: React.FunctionComponent = () => (
  <Router>
    <AppProvider>
      <ToastProvider>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </ToastProvider>
    </AppProvider>
  </Router>
);

export default App;

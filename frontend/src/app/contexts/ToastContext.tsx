import * as React from 'react';
import { Alert, AlertGroup, AlertActionCloseButton, AlertVariant } from '@patternfly/react-core';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  variant: AlertVariant;
  timeout?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  addSuccessToast: (title: string, message?: string) => void;
  addErrorToast: (title: string, message?: string) => void;
  addInfoToast: (title: string, message?: string) => void;
  addWarningToast: (title: string, message?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

const DEFAULT_TIMEOUT = 8000; // 8 seconds

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const timeout = toast.timeout ?? DEFAULT_TIMEOUT;

    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-remove toast after timeout
    if (timeout > 0) {
      setTimeout(() => {
        removeToast(id);
      }, timeout);
    }
  }, [removeToast]);

  const addSuccessToast = React.useCallback((title: string, message?: string) => {
    addToast({ title, message, variant: AlertVariant.success });
  }, [addToast]);

  const addErrorToast = React.useCallback((title: string, message?: string) => {
    addToast({ title, message, variant: AlertVariant.danger, timeout: 0 }); // Errors don't auto-dismiss
  }, [addToast]);

  const addInfoToast = React.useCallback((title: string, message?: string) => {
    addToast({ title, message, variant: AlertVariant.info });
  }, [addToast]);

  const addWarningToast = React.useCallback((title: string, message?: string) => {
    addToast({ title, message, variant: AlertVariant.warning });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        addSuccessToast,
        addErrorToast,
        addInfoToast,
        addWarningToast,
      }}
    >
      {children}
      <AlertGroup isToast isLiveRegion>
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            actionClose={
              <AlertActionCloseButton
                title={toast.title}
                onClose={() => removeToast(toast.id)}
              />
            }
          >
            {toast.message}
          </Alert>
        ))}
      </AlertGroup>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

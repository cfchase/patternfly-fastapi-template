import * as React from 'react';
import { userService, CurrentUser, HealthCheckResponse } from '@app/services/userService';

interface AppContextType {
  /** Current authenticated user, null if not loaded or not authenticated */
  currentUser: CurrentUser | null;
  /** Whether user data is currently being fetched */
  isLoadingUser: boolean;
  /** Error message if user fetch failed */
  userError: string | null;
  /** Health check response */
  healthCheck: HealthCheckResponse | null;
  /** Whether health check is loading */
  isLoadingHealthCheck: boolean;
  /** Refresh user data */
  refreshUser: () => Promise<void>;
  /** Sign out the current user */
  signOut: () => void;
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);
  const [userError, setUserError] = React.useState<string | null>(null);
  const [healthCheck, setHealthCheck] = React.useState<HealthCheckResponse | null>(null);
  const [isLoadingHealthCheck, setIsLoadingHealthCheck] = React.useState(true);

  const fetchCurrentUser = React.useCallback(async (signal?: AbortSignal) => {
    setIsLoadingUser(true);
    setUserError(null);
    try {
      const userData = await userService.getCurrentUser();
      if (!signal?.aborted) {
        setCurrentUser(userData);
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error('Failed to fetch current user:', error);
      setCurrentUser(null);
      // Don't set error for 401 - that's expected when not authenticated
      if (error instanceof Error && !error.message.includes('401')) {
        setUserError('Failed to load user information');
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoadingUser(false);
      }
    }
  }, []);

  const fetchHealthCheck = React.useCallback(async (signal?: AbortSignal) => {
    setIsLoadingHealthCheck(true);
    try {
      const healthData = await userService.getHealthCheck();
      if (!signal?.aborted) {
        setHealthCheck(healthData);
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error('Failed to fetch health check:', error);
      setHealthCheck(null);
    } finally {
      if (!signal?.aborted) {
        setIsLoadingHealthCheck(false);
      }
    }
  }, []);

  const signOut = React.useCallback(() => {
    userService.signOut();
  }, []);

  React.useEffect(() => {
    const abortController = new AbortController();

    fetchCurrentUser(abortController.signal);
    fetchHealthCheck(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchCurrentUser, fetchHealthCheck]);

  const value = React.useMemo(
    () => ({
      currentUser,
      isLoadingUser,
      userError,
      healthCheck,
      isLoadingHealthCheck,
      refreshUser: fetchCurrentUser,
      signOut,
    }),
    [currentUser, isLoadingUser, userError, healthCheck, isLoadingHealthCheck, fetchCurrentUser, signOut]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

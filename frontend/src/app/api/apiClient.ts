import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

/**
 * Centralized API client for making HTTP requests.
 *
 * Features:
 * - Base URL configuration (defaults to /api)
 * - Response interceptors for error handling
 * - 401 handling for authentication errors
 */

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      // If using OAuth2-proxy, redirect to sign out which will trigger re-auth
      // window.location.href = '/oauth2/sign_out';
      console.error('Authentication required');
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied');
    }

    // Handle 500+ Server errors
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.status);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * Helper type for API error responses
 */
export interface ApiError {
  detail: string;
  status_code?: number;
}

/**
 * Type guard to check if an error is an Axios error
 */
export function isAxiosError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error);
}

/**
 * Extract error message from an API error
 */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.detail || error.message || 'An unexpected error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

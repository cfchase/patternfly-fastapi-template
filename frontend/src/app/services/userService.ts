import apiClient from '@app/api/apiClient';

/**
 * User information from the backend.
 */
export interface CurrentUser {
  username: string;
  email: string;
  display_name: string;
}

/**
 * Health check response from the backend.
 */
export interface HealthCheckResponse {
  status: string;
  message: string;
}

/**
 * User service for authentication-related API calls.
 */
export const userService = {
  /**
   * Get the current authenticated user.
   *
   * In local development, returns a dev user.
   * In production, requires OAuth2-proxy authentication.
   */
  async getCurrentUser(): Promise<CurrentUser> {
    const response = await apiClient.get<CurrentUser>('/v1/users/me');
    return response.data;
  },

  /**
   * Get health check status.
   */
  async getHealthCheck(): Promise<HealthCheckResponse> {
    const response = await apiClient.get<HealthCheckResponse>('/v1/utils/health-check');
    return response.data;
  },

  /**
   * Sign out the current user.
   *
   * Redirects to OAuth2-proxy sign out endpoint which clears
   * the session and redirects to the identity provider's logout.
   */
  signOut(): void {
    window.location.href = '/oauth2/sign_out';
  },
};

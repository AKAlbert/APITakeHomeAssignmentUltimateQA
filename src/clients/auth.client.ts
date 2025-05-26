import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from '@/core/base-api-client';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ApiResponse,
  ApiClientConfig
} from '@/types';

export class AuthClient extends BaseApiClient {
  constructor(config: ApiClientConfig, requestContext?: APIRequestContext) {
    super(config, requestContext);
  }

  // Login user
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    this.logger.info('Attempting user login', { email: credentials.email });

    // Validate credentials
    this.validateLoginRequest(credentials);

    const response = await this.post<LoginResponse>('/api/login', credentials);

    this.logger.info('User logged in successfully', {
      email: credentials.email,
      tokenLength: response.data.token?.length || 0
    });

    return response;
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    this.logger.info('Attempting user registration', { email: userData.email });

    // Validate registration data
    this.validateRegisterRequest(userData);

    const response = await this.post<RegisterResponse>('/api/register', userData);

    this.logger.info('User registered successfully', {
      email: userData.email,
      userId: response.data.id,
      tokenLength: response.data.token?.length || 0
    });

    return response;
  }

  // Logout user
  async logout(token?: string): Promise<ApiResponse<void>> {
    this.logger.info('Attempting user logout');

    const headers = token ? { 'Authorization': `Bearer ${token}` } : undefined;

    try {
      const response = await this.post<void>('/api/logout', {}, headers);
      this.logger.info('User logged out successfully');
      return response;
    } catch (error) {
      
      if ((error as Error).message.includes('404')) {
        this.logger.info('Logout endpoint not available (demo API)');
        return {
          data: undefined as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { method: 'POST', url: '/api/logout' }
        };
      }
      throw error;
    }
  }

  /**
   * Validate token (mock implementation)
   */
  async validateToken(token: string): Promise<boolean> {
    this.logger.info('Validating token');

    if (!token || token.trim().length === 0) {
      return false;
    }

    try {
      const isValid = token.length > 10; 
      this.logger.info('Token validation result', { isValid });
      return isValid;
    } catch (error) {
      this.logger.error('Token validation failed', { error: (error as Error).message });
      return false;
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<ApiResponse<LoginResponse>> {
    this.logger.info('Attempting token refresh');

    if (!refreshToken || refreshToken.trim().length === 0) {
      throw new Error('Refresh token is required');
    }

    try {
      // In a real API, this would be a token refresh endpoint
      // For demo purposes, we'll simulate a refresh
      const response: ApiResponse<LoginResponse> = {
        data: {
          token: `refreshed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { method: 'POST', url: '/api/refresh' }
      };

      this.logger.info('Token refreshed successfully', {
        tokenLength: response.data.token.length
      });

      return response;
    } catch (error) {
      this.logger.error('Token refresh failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Validate login request
   */
  private validateLoginRequest(credentials: LoginRequest): void {
    if (!credentials.email || credentials.email.trim().length === 0) {
      throw new Error('Email is required for login');
    }

    if (!credentials.password || credentials.password.trim().length === 0) {
      throw new Error('Password is required for login');
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Invalid email format');
    }

    if (credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  }

  /**
   * Validate register request
   */
  private validateRegisterRequest(userData: RegisterRequest): void {
    if (!userData.email || userData.email.trim().length === 0) {
      throw new Error('Email is required for registration');
    }

    if (!userData.password || userData.password.trim().length === 0) {
      throw new Error('Password is required for registration');
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (userData.password.length > 128) {
      throw new Error('Password cannot exceed 128 characters');
    }
  }

  /**
   * Get authentication status
   */
  async getAuthStatus(token: string): Promise<{ isAuthenticated: boolean; user?: any }> {
    this.logger.info('Checking authentication status');

    try {
      const isValid = await this.validateToken(token);

      if (isValid) {
        // In a real API, you might fetch user details here
        return {
          isAuthenticated: true,
          user: { token }
        };
      } else {
        return {
          isAuthenticated: false
        };
      }
    } catch (error) {
      this.logger.error('Failed to check auth status', { error: (error as Error).message });
      return {
        isAuthenticated: false
      };
    }
  }
}

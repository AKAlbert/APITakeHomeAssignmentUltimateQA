/**
 * API Clients Index
 * Central export point for all API client classes
 */

export { BaseApiClient } from '@/core/base-api-client';
export { UserClient } from './user.client';
export { AuthClient } from './auth.client';

// Client Factory
import { APIRequestContext } from '@playwright/test';
import { ApiClientConfig } from '@/types';
import { getEnvironmentConfig } from '@/config';
import { UserClient } from './user.client';
import { AuthClient } from './auth.client';

/**
 * API Client Factory
 * Creates and configures API client instances
 */
export class ApiClientFactory {
  private config: ApiClientConfig;
  private requestContext?: APIRequestContext;

  constructor(requestContext?: APIRequestContext, customConfig?: Partial<ApiClientConfig>) {
    const envConfig = getEnvironmentConfig();
    
    this.config = {
      baseURL: envConfig.baseURL,
      timeout: envConfig.timeout,
      retries: envConfig.retries,
      retryDelay: envConfig.retryDelay,
      headers: envConfig.headers,
      ...customConfig
    };
    
    this.requestContext = requestContext;
  }

  /**
   * Set request context for all clients
   */
  setRequestContext(context: APIRequestContext): void {
    this.requestContext = context;
  }

  /**
   * Create User API client
   */
  createUserClient(): UserClient {
    return new UserClient(this.config, this.requestContext);
  }

  /**
   * Create Auth API client
   */
  createAuthClient(): AuthClient {
    return new AuthClient(this.config, this.requestContext);
  }


  /**
   * Create all clients at once
   */
  createAllClients(): {
    userClient: UserClient;
    authClient: AuthClient;
  } {
    return {
      userClient: this.createUserClient(),
      authClient: this.createAuthClient(),
    };
  }

  /**
   * Update configuration for all future clients
   */
  updateConfig(newConfig: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }
}

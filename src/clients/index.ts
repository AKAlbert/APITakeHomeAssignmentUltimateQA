export { BaseApiClient } from '@/core/base-api-client';
export { UserClient } from './user.client';
export { AuthClient } from './auth.client';

import { APIRequestContext } from '@playwright/test';
import { ApiClientConfig } from '@/types';
import { getEnvironmentConfig } from '@/config';
import { UserClient } from './user.client';
import { AuthClient } from './auth.client';

// Factory for creating configured API client instances
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

  setRequestContext(context: APIRequestContext): void {
    this.requestContext = context;
  }

  createUserClient(): UserClient {
    return new UserClient(this.config, this.requestContext);
  }

  createAuthClient(): AuthClient {
    return new AuthClient(this.config, this.requestContext);
  }


  // Create all clients with shared configuration
  createAllClients(): {
    userClient: UserClient;
    authClient: AuthClient;
  } {
    return {
      userClient: this.createUserClient(),
      authClient: this.createAuthClient(),
    };
  }

  updateConfig(newConfig: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ApiClientConfig {
    return { ...this.config };
  }
}

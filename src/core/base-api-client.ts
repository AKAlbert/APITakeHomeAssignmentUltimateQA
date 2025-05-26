import { APIRequestContext } from '@playwright/test';
import {
  ApiClientConfig,
  RequestConfig,
  ApiResponse,
  ApiErrorResponse
} from '@/types';
import { Logger } from '../utils/logger';
import { CircuitBreaker, CircuitBreakerConfig } from '../utils/circuit-breaker';

export class BaseApiClient {
  protected config: ApiClientConfig;
  protected logger: Logger;
  protected requestContext?: APIRequestContext;
  protected circuitBreaker: CircuitBreaker;

  constructor(config: ApiClientConfig, requestContext?: APIRequestContext) {
    this.config = config;
    this.requestContext = requestContext;
    this.logger = new Logger('BaseApiClient');

    const circuitBreakerConfig: CircuitBreakerConfig = {
      failureThreshold: config.circuitBreaker?.failureThreshold || 5,
      recoveryTimeout: config.circuitBreaker?.recoveryTimeout || 60000,
      monitoringPeriod: config.circuitBreaker?.monitoringPeriod || 10000,
      expectedErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'Network Error', 'timeout']
    };

    this.circuitBreaker = new CircuitBreaker(circuitBreakerConfig);
  }

  setRequestContext(context: APIRequestContext): void {
    this.requestContext = context;
  }

  // Core request method with circuit breaker and retry logic
  async request<T = any>(requestConfig: RequestConfig): Promise<ApiResponse<T>> {
    if (!this.requestContext) {
      throw new Error('Request context not initialized. Call setRequestContext() first.');
    }

    const fullUrl = this.buildUrl(requestConfig.url);
    const headers = this.mergeHeaders(requestConfig.headers);

    this.logger.info(`Making ${requestConfig.method} request to ${fullUrl}`, {
      method: requestConfig.method,
      url: fullUrl,
      data: requestConfig.data,
      params: requestConfig.params,
      circuitState: this.circuitBreaker.getState()
    });

    return await this.circuitBreaker.execute(async () => {
      let lastError: Error | null = null;
      const maxRetries = this.config.retries || 0;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await this.executeRequest(requestConfig, fullUrl, headers);

          this.logger.info(`Request successful`, {
            status: response.status,
            statusText: response.statusText,
            attempt: attempt + 1,
            circuitState: this.circuitBreaker.getState()
          });

          return response as ApiResponse<T>;
        } catch (error) {
          lastError = error as Error;

          this.logger.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
            error: (error as Error).message,
            url: fullUrl,
            method: requestConfig.method,
            circuitState: this.circuitBreaker.getState()
          });

          if (attempt < maxRetries) {
            const delay = this.config.retryDelay || 1000;
            this.logger.info(`Retrying in ${delay}ms...`);
            await this.sleep(delay);
          }
        }
      }

      this.logger.error(`Request failed after ${maxRetries + 1} attempts`, {
        error: lastError?.message,
        url: fullUrl,
        method: requestConfig.method,
        circuitState: this.circuitBreaker.getState()
      });

      throw lastError || new Error('Request failed after all retry attempts');
    });
  }

  private async executeRequest<T>(
    requestConfig: RequestConfig,
    url: string,
    headers: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const options: any = {
      headers,
      timeout: requestConfig.timeout || this.config.timeout
    };

    if (requestConfig.data) {
      options.data = requestConfig.data;
    }

    if (requestConfig.params) {
      const urlWithParams = new URL(url);
      Object.entries(requestConfig.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlWithParams.searchParams.append(key, String(value));
        }
      });
      url = urlWithParams.toString();
    }

    let response: any;

    switch (requestConfig.method) {
      case 'GET':
        response = await this.requestContext!.get(url, options);
        break;
      case 'POST':
        response = await this.requestContext!.post(url, options);
        break;
      case 'PUT':
        response = await this.requestContext!.put(url, options);
        break;
      case 'PATCH':
        response = await this.requestContext!.patch(url, options);
        break;
      case 'DELETE':
        response = await this.requestContext!.delete(url, options);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${requestConfig.method}`);
    }

    if (!response.ok()) {
      const errorBody: any = await this.safeJsonParse(response);
      const error: ApiErrorResponse = {
        error: errorBody?.error || `HTTP ${response.status()}`,
        message: errorBody?.message || response.statusText(),
        statusCode: response.status(),
        timestamp: new Date().toISOString()
      };

      throw new Error(`API Error: ${error.error} - ${error.message}`);
    }

    const data = await this.safeJsonParse<T>(response);

    return {
      data,
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      config: requestConfig
    };
  }

  private async safeJsonParse<T>(response: any): Promise<T> {
    try {
      return await response.json();
    } catch (error) {
      this.logger.warn('Failed to parse response as JSON', { error: (error as Error).message });
      return {} as T;
    }
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }

    const baseUrl = this.config.baseURL.endsWith('/')
      ? this.config.baseURL.slice(0, -1)
      : this.config.baseURL;

    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
  }

  private mergeHeaders(requestHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.config.headers,
      ...requestHeaders
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP method convenience wrappers
  async get<T = any>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, params, headers });
  }

  async post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, headers });
  }

  async put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, headers });
  }

  async patch<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, data, headers });
  }

  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, headers });
  }

  getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }

  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  resetCircuitBreaker() {
    this.circuitBreaker.reset();
    this.logger.info('Circuit breaker reset');
  }

  isCircuitBreakerHealthy() {
    return this.circuitBreaker.isHealthy();
  }
}

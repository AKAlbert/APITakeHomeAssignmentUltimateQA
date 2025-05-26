import { test as base } from '@playwright/test';
import { ApiClientFactory } from '@/clients';
import { TestDataManager } from '@/data';
import { Logger } from '@/utils/logger';
import { TestContext, CleanupTask } from '@/types';

export interface ExtendedTestContext {
  apiClients: {
    userClient: any;
    authClient: any;
    resourceClient: any;
  };
  dataManager: TestDataManager;
  logger: Logger;
  testContext: TestContext;
}

// Enhanced test fixture with API testing capabilities
export const test = base.extend<ExtendedTestContext>({
  apiClients: async ({ request }, use) => {
    const factory = new ApiClientFactory(request);
    const clients = {
      ...factory.createAllClients(),
      resourceClient: {} // Temporary placeholder
    };
    const logger = new Logger('ApiClients');
    logger.info('API clients initialized');
    await use(clients);
  },

  dataManager: async ({}, use) => {
    const manager = new TestDataManager();
    await use(manager);
    await manager.cleanup();
  },

  logger: async ({}, use) => {
    const logger = new Logger('Test');
    await use(logger);
  },

  testContext: async ({ logger }, use) => {
    const context: TestContext = {
      testId: `test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      environment: process.env.NODE_ENV || 'development',
      startTime: new Date(),
      userData: new Map(),
      cleanup: []
    };

    logger.logTestStart(context.testId, {
      environment: context.environment,
      startTime: context.startTime
    });

    await use(context);

    for (const cleanupFn of context.cleanup) {
      try {
        await cleanupFn();
      } catch (error) {
        logger.error('Cleanup task failed', { error: (error as Error).message });
      }
    }

    const duration = Date.now() - context.startTime.getTime();
    logger.logTestEnd(context.testId, 'passed', duration);
  }
});

// Helper class for test environment setup and cleanup management
export class TestSetupHelper {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TestSetupHelper');
  }

  async setupTestEnvironment(context: TestContext): Promise<void> {
    this.logger.info('Setting up test environment', { testId: context.testId });

    context.userData.set('setupComplete', true);
    context.userData.set('setupTime', new Date());
  }

  createCleanupTask(
    id: string,
    description: string,
    execute: () => Promise<void>,
    priority: number = 1
  ): CleanupTask {
    return {
      id,
      description,
      execute,
      priority
    };
  }

  addApiCleanupTask(
    context: TestContext,
    apiCall: () => Promise<void>,
    description: string,
    priority: number = 1
  ): void {
    const task = this.createCleanupTask(
      `api_cleanup_${Date.now()}`,
      description,
      apiCall,
      priority
    );

    context.cleanup.push(task.execute);
    this.logger.debug('Added API cleanup task', { description, priority });
  }

  async waitForCondition(
    condition: () => Promise<boolean>,
    timeoutMs: number = 30000,
    intervalMs: number = 1000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return true;
      }
      await this.sleep(intervalMs);
    }

    return false;
  }

  // Retry operations with exponential backoff for flaky tests
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          this.logger.warn(`Operation failed, retrying in ${delay}ms`, {
            attempt: attempt + 1,
            maxRetries: maxRetries + 1,
            error: (error as Error).message
          });
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateTestDataId(prefix: string = 'test'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  validateApiResponse(response: any, expectedFields: string[]): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    for (const field of expectedFields) {
      if (!(field in response)) {
        missingFields.push(field);
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  createTestMetadata(testName: string, tags: string[] = []): any {
    return {
      testName,
      tags,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      testId: this.generateTestDataId('meta')
    };
  }
}

// Validates API response structure and content
export class ApiResponseValidator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ApiResponseValidator');
  }

  validateUserResponse(response: any): boolean {
    const requiredFields = ['id', 'email', 'first_name', 'last_name', 'avatar'];
    return this.validateFields(response, requiredFields);
  }

  validateResourceResponse(response: any): boolean {
    const requiredFields = ['id', 'name', 'year', 'color', 'pantone_value'];
    return this.validateFields(response, requiredFields);
  }

  validatePaginationResponse(response: any): boolean {
    const requiredFields = ['page', 'per_page', 'total', 'total_pages', 'data'];
    return this.validateFields(response, requiredFields);
  }

  validateAuthResponse(response: any): boolean {
    const requiredFields = ['token'];
    return this.validateFields(response, requiredFields);
  }

  private validateFields(obj: any, requiredFields: string[]): boolean {
    for (const field of requiredFields) {
      if (!(field in obj)) {
        this.logger.error(`Missing required field: ${field}`, { obj });
        return false;
      }
    }
    return true;
  }

  validateStatusCode(actual: number, expected: number): boolean {
    if (actual !== expected) {
      this.logger.error(`Status code mismatch`, { actual, expected });
      return false;
    }
    return true;
  }

  validateResponseTime(duration: number, maxDuration: number): boolean {
    if (duration > maxDuration) {
      this.logger.warn(`Response time exceeded threshold`, { duration, maxDuration });
      return false;
    }
    return true;
  }
}

// Helper for performance testing and load testing scenarios
export class PerformanceTestHelper {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('PerformanceTestHelper');
  }

  async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      this.logger.logPerformance(operationName, duration);

      return { result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Operation failed after ${duration}ms`, {
        operation: operationName,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async runLoadTest(
    operation: () => Promise<any>,
    concurrency: number,
    iterations: number
  ): Promise<{
    totalDuration: number;
    averageResponseTime: number;
    successCount: number;
    errorCount: number;
    errors: string[];
  }> {
    this.logger.info('Starting load test', { concurrency, iterations });

    const startTime = Date.now();
    const results: Array<{ success: boolean; duration: number; error?: string }> = [];

    for (let batch = 0; batch < iterations; batch += concurrency) {
      const batchSize = Math.min(concurrency, iterations - batch);
      const promises = Array.from({ length: batchSize }, async () => {
        const opStartTime = Date.now();
        try {
          await operation();
          return {
            success: true,
            duration: Date.now() - opStartTime
          };
        } catch (error) {
          return {
            success: false,
            duration: Date.now() - opStartTime,
            error: (error as Error).message
          };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const averageResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const errors = results.filter(r => r.error).map(r => r.error!);

    this.logger.info('Load test completed', {
      totalDuration,
      averageResponseTime,
      successCount,
      errorCount,
      successRate: (successCount / results.length) * 100
    });

    return {
      totalDuration,
      averageResponseTime,
      successCount,
      errorCount,
      errors
    };
  }
}

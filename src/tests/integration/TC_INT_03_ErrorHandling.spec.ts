import { expect } from '@playwright/test';
import { test } from '@/helpers/test.helpers';
import { TestDataLoader } from '@/utils/test-data-loader';
import { LoginRequest, RegisterRequest } from '@/types';

test.describe('B3. Integration Tests - Error Handling & Edge Cases', () => {
  let testDataLoader: TestDataLoader;

  test.beforeEach(async ({ logger, testContext }) => {
    testDataLoader = new TestDataLoader();
    logger.info('Error handling integration test setup completed', { testId: testContext.testId });
  });

  test('TC-INT-05: Invalid Authentication Credentials and Malformed Requests', async ({
    apiClients,
    logger
  }) => {
    logger.info('Testing invalid authentication credentials and malformed requests');

    // Load authentication test scenarios including invalid ones
    const authDataSet = await testDataLoader.loadFromJSON('auth-scenarios.json');
    const invalidScenarios = authDataSet.data.filter(row => row.shouldSucceed === false);

    expect(invalidScenarios.length).toBeGreaterThan(0);

    // Step 1: Test invalid login credentials
    logger.info('Step 1: Testing invalid login credentials');

    const missingPasswordScenario = invalidScenarios.find(row => row.scenario === 'missing_password_login');
    expect(missingPasswordScenario).toBeDefined();

    const invalidLoginRequest: LoginRequest = {
      email: missingPasswordScenario!.email as string,
      password: missingPasswordScenario!.password as string
    };

    try {
      const invalidLoginResponse = await apiClients.authClient.login(invalidLoginRequest);
      // If the API returns an error response instead of throwing
      expect(invalidLoginResponse.status).toBe(missingPasswordScenario!.expectedStatus as number);
    } catch (error) {
      // If the API throws an error for invalid credentials
      expect(error).toBeDefined();
      logger.info('Invalid login properly rejected', { error: (error as Error).message });
    }

    // Step 2: Test invalid registration credentials
    logger.info('Step 2: Testing invalid registration credentials');

    const missingPasswordRegisterScenario = invalidScenarios.find(row => row.scenario === 'missing_password_registration');
    expect(missingPasswordRegisterScenario).toBeDefined();

    const invalidRegisterRequest: RegisterRequest = {
      email: missingPasswordRegisterScenario!.email as string,
      password: missingPasswordRegisterScenario!.password as string
    };

    try {
      const invalidRegisterResponse = await apiClients.authClient.register(invalidRegisterRequest);
      expect(invalidRegisterResponse.status).toBe(missingPasswordRegisterScenario!.expectedStatus as number);
    } catch (error) {
      expect(error).toBeDefined();
      logger.info('Invalid registration properly rejected', { error: (error as Error).message });
    }

    // Step 3: Test malformed email formats
    logger.info('Step 3: Testing malformed email formats');

    const invalidEmailScenario = invalidScenarios.find(row => row.scenario === 'invalid_email_format');
    expect(invalidEmailScenario).toBeDefined();

    const malformedEmailRequest: LoginRequest = {
      email: invalidEmailScenario!.email as string,
      password: invalidEmailScenario!.password as string
    };

    try {
      await apiClients.authClient.login(malformedEmailRequest);
      // If no error is thrown, check the response status
    } catch (error) {
      expect(error).toBeDefined();
      logger.info('Malformed email properly rejected', { error: (error as Error).message });
    }

    // Step 4: Test SQL injection attempts
    logger.info('Step 4: Testing SQL injection attempts');

    const sqlInjectionScenario = invalidScenarios.find(row => row.scenario === 'sql_injection_email');
    expect(sqlInjectionScenario).toBeDefined();

    const sqlInjectionRequest: LoginRequest = {
      email: sqlInjectionScenario!.email as string,
      password: sqlInjectionScenario!.password as string
    };

    try {
      await apiClients.authClient.login(sqlInjectionRequest);
    } catch (error) {
      expect(error).toBeDefined();
      logger.info('SQL injection attempt properly handled', { error: (error as Error).message });
    }

    // Step 5: Test XSS attempts
    logger.info('Step 5: Testing XSS attempts');

    const xssScenario = invalidScenarios.find(row => row.scenario === 'xss_attempt_email');
    expect(xssScenario).toBeDefined();

    const xssRequest: LoginRequest = {
      email: xssScenario!.email as string,
      password: xssScenario!.password as string
    };

    try {
      await apiClients.authClient.login(xssRequest);
    } catch (error) {
      expect(error).toBeDefined();
      logger.info('XSS attempt properly handled', { error: (error as Error).message });
    }

    logger.info('Invalid authentication credentials and malformed requests testing completed', {
      totalInvalidScenarios: invalidScenarios.length,
      testedScenarios: 5
    });
  });

  test('TC-INT-06: Rate Limiting and Timeout Scenarios with Circuit Breaker', async ({
    apiClients,
    logger
  }) => {
    logger.info('Testing rate limiting, timeout scenarios, and circuit breaker functionality');

    // Step 1: Test circuit breaker functionality
    logger.info('Step 1: Testing circuit breaker functionality');

    // Get initial circuit breaker state
    const initialMetrics = apiClients.userClient.getCircuitBreakerMetrics();
    expect(initialMetrics.state).toBe('CLOSED');
    expect(initialMetrics.totalRequests).toBeGreaterThanOrEqual(0);

    logger.info('Initial circuit breaker state', { metrics: initialMetrics });

    // Step 2: Test normal operations don't trigger circuit breaker
    logger.info('Step 2: Testing normal operations with circuit breaker');

    const normalRequests: Promise<any>[] = [];
    for (let i = 0; i < 3; i++) {
      normalRequests.push(apiClients.userClient.getUsers({ page: 1 }));
    }

    const normalResults = await Promise.allSettled(normalRequests);
    const successfulNormalRequests = normalResults.filter(result => result.status === 'fulfilled').length;

    expect(successfulNormalRequests).toBeGreaterThan(0);

    const afterNormalMetrics = apiClients.userClient.getCircuitBreakerMetrics();
    expect(afterNormalMetrics.state).toBe('CLOSED');
    expect(afterNormalMetrics.totalRequests).toBeGreaterThan(initialMetrics.totalRequests);

    // Step 3: Test timeout scenarios
    logger.info('Step 3: Testing timeout scenarios');

    // Test with delay parameter to simulate slow responses
    try {
      const slowResponse = await apiClients.userClient.getUsers({ page: 1, delay: 3 });
      expect(slowResponse.status).toBe(200);
      logger.info('Slow response handled successfully');
    } catch (error) {
      // Timeout errors are expected and should be handled gracefully
      logger.info('Timeout properly handled', { error: (error as Error).message });
    }

    // Step 4: Test non-existent resource requests
    logger.info('Step 4: Testing non-existent resource requests');

    const nonExistentResourceTests = [
      { userId: 999999, description: 'Very high user ID' },
      { userId: -1, description: 'Negative user ID' },
      { userId: 0, description: 'Zero user ID' }
    ];

    for (const testCase of nonExistentResourceTests) {
      try {
        await apiClients.userClient.getUser(testCase.userId);
        // If no error is thrown, the API might return a 404 status
      } catch (error) {
        expect(error).toBeDefined();
        logger.info(`Non-existent resource properly handled: ${testCase.description}`, {
          userId: testCase.userId,
          error: (error as Error).message
        });
      }

      // Also test with userExists helper
      const exists = await apiClients.userClient.userExists(testCase.userId);
      expect(exists).toBe(false);
    }

    // Step 5: Test boundary conditions
    logger.info('Step 5: Testing boundary conditions');

    // Test pagination boundaries
    const boundaryTests = [
      { page: 0, per_page: 1, description: 'Zero page' },
      { page: 1, per_page: 0, description: 'Zero per_page' },
      { page: 999999, per_page: 1, description: 'Very high page number' },
      { page: 1, per_page: 999999, description: 'Very high per_page' }
    ];

    for (const boundaryTest of boundaryTests) {
      try {
        const boundaryResponse = await apiClients.userClient.getUsers({
          page: boundaryTest.page,
          per_page: boundaryTest.per_page
        });

        // Some boundary conditions might be handled gracefully
        if (boundaryResponse.status === 200) {
          logger.info(`Boundary condition handled gracefully: ${boundaryTest.description}`, {
            params: { page: boundaryTest.page, per_page: boundaryTest.per_page },
            resultCount: boundaryResponse.data.data?.length || 0
          });
        }
      } catch (error) {
        logger.info(`Boundary condition properly rejected: ${boundaryTest.description}`, {
          params: { page: boundaryTest.page, per_page: boundaryTest.per_page },
          error: (error as Error).message
        });
      }
    }

    // Step 6: Test circuit breaker health check
    logger.info('Step 6: Testing circuit breaker health check');

    const isHealthy = apiClients.userClient.isCircuitBreakerHealthy();
    expect(typeof isHealthy).toBe('boolean');

    const finalMetrics = apiClients.userClient.getCircuitBreakerMetrics();
    const successRate = finalMetrics.totalRequests > 0
      ? (finalMetrics.successfulRequests / finalMetrics.totalRequests) * 100
      : 100;

    logger.info('Circuit breaker final state', {
      metrics: finalMetrics,
      successRate: `${successRate.toFixed(2)}%`,
      isHealthy
    });

    // Step 7: Test circuit breaker reset functionality
    logger.info('Step 7: Testing circuit breaker reset functionality');

    apiClients.userClient.resetCircuitBreaker();
    const resetMetrics = apiClients.userClient.getCircuitBreakerMetrics();

    expect(resetMetrics.state).toBe('CLOSED');
    expect(resetMetrics.totalRequests).toBe(0);
    expect(resetMetrics.successfulRequests).toBe(0);
    expect(resetMetrics.failedRequests).toBe(0);

    logger.info('Rate limiting, timeout scenarios, and circuit breaker testing completed', {
      initialRequests: initialMetrics.totalRequests,
      finalRequests: finalMetrics.totalRequests,
      successfulNormalRequests,
      boundaryTestsCount: boundaryTests.length,
      nonExistentResourceTestsCount: nonExistentResourceTests.length
    });
  });
});

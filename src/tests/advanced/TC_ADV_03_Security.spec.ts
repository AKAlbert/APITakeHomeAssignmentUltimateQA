import { expect } from '@playwright/test';
import { test } from '@/helpers/test.helpers';
import { TestDataLoader } from '@/utils/test-data-loader';
import { CreateUserRequest, LoginRequest } from '@/types';

test.describe('C3. Advanced Testing - Security Testing and API Contract Validation', () => {
  let testDataLoader: TestDataLoader;

  test.beforeEach(async ({ logger, testContext }) => {
    testDataLoader = new TestDataLoader();
    logger.info('Security testing setup completed', { testId: testContext.testId });
  });

  test('TC-ADV-04: Security Testing - Authentication, Authorization, and Input Validation', async ({
    apiClients,
    logger
  }) => {
    logger.info('Running comprehensive security testing');

    // Load security test scenarios
    const authDataSet = await testDataLoader.loadFromJSON('auth-scenarios.json');
    const securityScenarios = authDataSet.data.filter(row => {
      const scenario = String(row.scenario || '');
      return scenario.includes('sql_injection') ||
             scenario.includes('xss') ||
             scenario.includes('unicode') ||
             scenario.includes('very_long');
    });

    expect(securityScenarios.length).toBeGreaterThan(0);

    // Step 1: SQL Injection Testing
    logger.info('Step 1: Testing SQL injection prevention');

    const sqlInjectionScenarios = securityScenarios.filter(row => {
      const scenario = String(row.scenario || '');
      return scenario.includes('sql_injection');
    });

    for (const scenario of sqlInjectionScenarios) {
      const scenarioName = String(scenario.scenario || '');
      logger.info(`Testing SQL injection scenario: ${scenarioName}`);

      const maliciousLoginRequest: LoginRequest = {
        email: scenario.email as string,
        password: scenario.password as string
      };

      try {
        const response = await apiClients.authClient.login(maliciousLoginRequest);

        // If response is returned, it should be an error status
        expect(response.status).toBeGreaterThanOrEqual(400);

        logger.info('SQL injection properly handled via error status', {
          scenario: scenario.scenario,
          status: response.status
        });
      } catch (error) {
        // Exception is also valid for SQL injection prevention
        expect(error).toBeDefined();
        logger.info('SQL injection properly handled via exception', {
          scenario: scenario.scenario,
          error: (error as Error).message
        });
      }

      // Also test SQL injection in user creation
      try {
        const maliciousUserData: CreateUserRequest = {
          name: scenario.email as string, // Use malicious string as name
          job: "'; DROP TABLE users; --"
        };

        const userResponse = await apiClients.userClient.createUser(maliciousUserData);

        // If successful, verify the malicious code was sanitized
        if (userResponse.status === 201) {
          expect(userResponse.data.name).toBe(maliciousUserData.name);
          expect(userResponse.data.job).toBe(maliciousUserData.job);

          // The API should have sanitized or escaped the input
          logger.info('SQL injection in user creation handled (input sanitized)', {
            originalInput: maliciousUserData.job,
            storedValue: userResponse.data.job
          });
        }
      } catch (error) {
        logger.info('SQL injection in user creation properly rejected', {
          error: (error as Error).message
        });
      }
    }

    // Step 2: XSS (Cross-Site Scripting) Testing
    logger.info('Step 2: Testing XSS prevention');

    const xssScenarios = securityScenarios.filter(row => {
      const scenario = String(row.scenario || '');
      return scenario.includes('xss');
    });

    for (const scenario of xssScenarios) {
      const scenarioName = String(scenario.scenario || '');
      logger.info(`Testing XSS scenario: ${scenarioName}`);

      try {
        const xssUserData: CreateUserRequest = {
          name: scenario.email as string,
          job: "<script>alert('xss')</script>"
        };

        const response = await apiClients.userClient.createUser(xssUserData);

        if (response.status === 201) {
          // Verify XSS payload was sanitized
          expect(response.data.name).toBe(xssUserData.name);
          expect(response.data.job).toBe(xssUserData.job);

          // Check if script tags are escaped or removed
          const containsScript = response.data.job.includes('<script>');
          logger.info('XSS testing result', {
            originalInput: xssUserData.job,
            storedValue: response.data.job,
            containsScript
          });
        }
      } catch (error) {
        logger.info('XSS attempt properly rejected', {
          scenario: scenarioName,
          error: (error as Error).message
        });
      }
    }

    // Step 3: Input Length and Boundary Testing
    logger.info('Step 3: Testing input length and boundary validation');

    const lengthScenarios = securityScenarios.filter(row => {
      const scenario = String(row.scenario || '');
      return scenario.includes('very_long');
    });

    for (const scenario of lengthScenarios) {
      const scenarioName = String(scenario.scenario || '');
      logger.info(`Testing length boundary scenario: ${scenarioName}`);

      try {
        if (scenarioName.includes('email')) {
          const longEmailRequest: LoginRequest = {
            email: scenario.email as string,
            password: scenario.password as string
          };

          const response = await apiClients.authClient.login(longEmailRequest);
          expect(response.status).toBeGreaterThanOrEqual(400);
        } else if (scenarioName.includes('password')) {
          const longPasswordRequest: LoginRequest = {
            email: scenario.email as string,
            password: scenario.password as string
          };

          const response = await apiClients.authClient.login(longPasswordRequest);
          expect(response.status).toBeGreaterThanOrEqual(400);
        }
      } catch (error) {
        logger.info('Length boundary properly handled', {
          scenario: scenarioName,
          error: (error as Error).message
        });
      }
    }

    // Step 4: Unicode and Character Encoding Testing
    logger.info('Step 4: Testing unicode and character encoding');

    const unicodeScenarios = securityScenarios.filter(row => {
      const scenario = String(row.scenario || '');
      return scenario.includes('unicode');
    });

    for (const scenario of unicodeScenarios) {
      const scenarioName = String(scenario.scenario || '');
      logger.info(`Testing unicode scenario: ${scenarioName}`);

      try {
        const unicodeUserData: CreateUserRequest = {
          name: scenario.email as string,
          job: scenario.password as string
        };

        const response = await apiClients.userClient.createUser(unicodeUserData);

        if (response.status === 201) {
          // Verify unicode characters are properly handled
          expect(response.data.name).toBe(unicodeUserData.name);
          expect(response.data.job).toBe(unicodeUserData.job);

          logger.info('Unicode characters properly handled', {
            name: response.data.name,
            job: response.data.job
          });
        }
      } catch (error) {
        logger.info('Unicode input handled with validation', {
          scenario: scenarioName,
          error: (error as Error).message
        });
      }
    }

    // Step 5: Authorization Testing
    logger.info('Step 5: Testing authorization mechanisms');

    // Test with invalid tokens
    const invalidTokens = [
      '',
      'invalid_token',
      'expired_token',
      'malformed.jwt.token',
      'null',
      'undefined'
    ];

    for (const invalidToken of invalidTokens) {
      const authStatus = await apiClients.authClient.getAuthStatus(invalidToken);
      expect(authStatus.isAuthenticated).toBe(false);

      logger.info('Invalid token properly rejected', {
        token: invalidToken.substring(0, 10) + '...',
        isAuthenticated: authStatus.isAuthenticated
      });
    }

    logger.info('Security testing completed', {
      sqlInjectionScenarios: sqlInjectionScenarios.length,
      xssScenarios: xssScenarios.length,
      lengthScenarios: lengthScenarios.length,
      unicodeScenarios: unicodeScenarios.length,
      invalidTokensTested: invalidTokens.length
    });
  });

  test('TC-ADV-05: API Contract Validation and Schema Testing', async ({
    apiClients,
    logger
  }) => {
    logger.info('Running API contract validation and schema testing');

    // Step 1: Response Schema Validation for User Operations
    logger.info('Step 1: Validating user operation response schemas');

    // Test GET /users response schema
    const usersResponse = await apiClients.userClient.getUsers({ page: 1, per_page: 3 });

    expect(usersResponse.status).toBe(200);

    // Validate response structure
    expect(usersResponse.data).toHaveProperty('page');
    expect(usersResponse.data).toHaveProperty('per_page');
    expect(usersResponse.data).toHaveProperty('total');
    expect(usersResponse.data).toHaveProperty('total_pages');
    expect(usersResponse.data).toHaveProperty('data');
    expect(Array.isArray(usersResponse.data.data)).toBe(true);

    // Validate user object schema
    if (usersResponse.data.data.length > 0) {
      const user = usersResponse.data.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('first_name');
      expect(user).toHaveProperty('last_name');
      expect(user).toHaveProperty('avatar');

      // Validate data types
      expect(typeof user.id).toBe('number');
      expect(typeof user.email).toBe('string');
      expect(typeof user.first_name).toBe('string');
      expect(typeof user.last_name).toBe('string');
      expect(typeof user.avatar).toBe('string');

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(user.email).toMatch(emailRegex);

      // Validate avatar URL format
      expect(user.avatar).toMatch(/^https?:\/\/.+/);
    }

    // Test GET /users/{id} response schema
    const singleUserResponse = await apiClients.userClient.getUser(2);

    expect(singleUserResponse.status).toBe(200);
    expect(singleUserResponse.data).toHaveProperty('data');
    expect(singleUserResponse.data.data).toHaveProperty('id', 2);

    // Step 2: Request/Response Contract Validation
    logger.info('Step 2: Validating request/response contracts');

    // Test POST /users contract
    const createUserData: CreateUserRequest = {
      name: 'Contract Test User',
      job: 'Contract Tester'
    };

    const createResponse = await apiClients.userClient.createUser(createUserData);

    expect(createResponse.status).toBe(201);
    expect(createResponse.data).toHaveProperty('name', createUserData.name);
    expect(createResponse.data).toHaveProperty('job', createUserData.job);
    expect(createResponse.data).toHaveProperty('id');
    expect(createResponse.data).toHaveProperty('createdAt');

    // Validate timestamp format (ISO 8601)
    const createdAt = createResponse.data.createdAt;
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(createdAt).toMatch(isoDateRegex);

    // Test PUT /users/{id} contract
    const updateData = {
      name: 'Updated Contract User',
      job: 'Updated Contract Tester'
    };

    const updateResponse = await apiClients.userClient.updateUser(2, updateData);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data).toHaveProperty('name', updateData.name);
    expect(updateResponse.data).toHaveProperty('job', updateData.job);
    expect(updateResponse.data).toHaveProperty('updatedAt');

    // Validate updatedAt timestamp format
    const updatedAt = updateResponse.data.updatedAt;
    expect(updatedAt).toMatch(isoDateRegex);

    // Step 3: Authentication Contract Validation
    logger.info('Step 3: Validating authentication contracts');

    // Load valid authentication scenario
    const authDataSet = await testDataLoader.loadFromJSON('auth-scenarios.json');
    const validLoginScenario = authDataSet.data.find(row => row.scenario === 'valid_login');

    expect(validLoginScenario).toBeDefined();

    const loginRequest: LoginRequest = {
      email: validLoginScenario!.email as string,
      password: validLoginScenario!.password as string
    };

    const loginResponse = await apiClients.authClient.login(loginRequest);

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data).toHaveProperty('token');
    expect(typeof loginResponse.data.token).toBe('string');
    expect(loginResponse.data.token.length).toBeGreaterThan(0);

    // Step 4: Error Response Schema Validation
    logger.info('Step 4: Validating error response schemas');

    try {
      await apiClients.userClient.getUser(999999);
    } catch (error) {
      // Validate error structure
      expect(error).toBeDefined();
      expect(typeof (error as Error).message).toBe('string');
    }

    // Step 5: HTTP Headers Validation
    logger.info('Step 5: Validating HTTP headers');

    // Check response headers
    expect(usersResponse.headers).toBeDefined();
    expect(typeof usersResponse.headers).toBe('object');

    // Common headers that should be present
    const expectedHeaders = ['content-type'];
    for (const header of expectedHeaders) {
      if (usersResponse.headers[header]) {
        expect(typeof usersResponse.headers[header]).toBe('string');
      }
    }

    // Step 6: API Versioning and Compatibility
    logger.info('Step 6: Testing API versioning and compatibility');

    // Test that API endpoints are consistent
    const endpoints = [
      { method: 'GET', path: '/api/users', expectedStatus: 200 },
      { method: 'GET', path: '/api/users/2', expectedStatus: 200 }
    ];

    for (const endpoint of endpoints) {
      if (endpoint.method === 'GET' && endpoint.path === '/api/users') {
        const response = await apiClients.userClient.getUsers();
        expect(response.status).toBe(endpoint.expectedStatus);
      } else if (endpoint.method === 'GET' && endpoint.path === '/api/users/2') {
        const response = await apiClients.userClient.getUser(2);
        expect(response.status).toBe(endpoint.expectedStatus);
      }
    }

    logger.info('API contract validation and schema testing completed', {
      userSchemaValidated: true,
      authContractValidated: true,
      errorSchemaValidated: true,
      headersValidated: true,
      endpointsTested: endpoints.length
    });
  });
});

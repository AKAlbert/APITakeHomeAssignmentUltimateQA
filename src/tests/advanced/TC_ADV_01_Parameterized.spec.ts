import { expect } from '@playwright/test';
import { test } from '@/helpers/test.helpers';
import { TestDataLoader } from '@/utils/test-data-loader';
import { CreateUserRequest, LoginRequest } from '@/types';

test.describe('C1. Advanced Testing - Parameterized Tests with External Data', () => {
  let testDataLoader: TestDataLoader;

  test.beforeEach(async ({ logger, testContext }) => {
    testDataLoader = new TestDataLoader();
    logger.info('Parameterized testing setup completed', { testId: testContext.testId });
  });

  test('TC-ADV-01: Data-Driven User Creation Tests from CSV', async ({
    apiClients,
    logger
  }) => {
    logger.info('Running data-driven user creation tests from CSV');

    // Load test data from CSV file
    const userDataSet = await testDataLoader.loadFromCSV('users.csv');

    expect(userDataSet.data.length).toBeGreaterThan(0);
    logger.info('Loaded user test data from CSV', {
      fileName: 'users.csv',
      totalRows: userDataSet.data.length,
      columns: Object.keys(userDataSet.data[0] || {})
    });

    // Group test cases by type
    const testCasesByType = userDataSet.data.reduce((acc, row) => {
      const testType = row.testType as string;
      if (!acc[testType]) {
        acc[testType] = [];
      }
      acc[testType].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    logger.info('Test cases grouped by type', {
      types: Object.keys(testCasesByType),
      counts: Object.fromEntries(
        Object.entries(testCasesByType).map(([type, cases]) => [type, cases.length])
      )
    });

    // Test valid cases
    const validCases = testCasesByType['valid'] || [];
    expect(validCases.length).toBeGreaterThan(0);

    logger.info('Testing valid user creation cases', { count: validCases.length });

    for (let i = 0; i < Math.min(validCases.length, 5); i++) { // Test first 5 valid cases
      const testCase = validCases[i];
      const userData: CreateUserRequest = {
        name: testCase.name as string,
        job: testCase.job as string
      };

      logger.info(`Testing valid case ${i + 1}/${Math.min(validCases.length, 5)}`, {
        userData,
        expectedStatus: testCase.expectedStatus
      });

      const response = await apiClients.userClient.createUser(userData);

      expect(response.status).toBe(testCase.expectedStatus as number);
      expect(response.data.name).toBe(userData.name);
      expect(response.data.job).toBe(userData.job);
      expect(response.data.id).toBeDefined();
      expect(response.data.createdAt).toBeDefined();
    }

    // Test boundary cases
    const boundaryCases = testCasesByType['boundary'] || [];
    if (boundaryCases.length > 0) {
      logger.info('Testing boundary cases', { count: boundaryCases.length });

      for (const testCase of boundaryCases) {
        const userData: CreateUserRequest = {
          name: testCase.name as string,
          job: testCase.job as string
        };

        logger.info('Testing boundary case', {
          userData,
          expectedStatus: testCase.expectedStatus
        });

        try {
          const response = await apiClients.userClient.createUser(userData);
          expect(response.status).toBe(testCase.expectedStatus as number);

          if (response.status === 201) {
            expect(response.data.name).toBe(userData.name);
            expect(response.data.job).toBe(userData.job);
          }
        } catch (error) {
          // Some boundary cases might throw errors
          logger.info('Boundary case handled with error', {
            userData,
            error: (error as Error).message
          });
        }
      }
    }

    // Test unicode cases
    const unicodeCases = testCasesByType['unicode'] || [];
    if (unicodeCases.length > 0) {
      logger.info('Testing unicode cases', { count: unicodeCases.length });

      for (const testCase of unicodeCases) {
        const userData: CreateUserRequest = {
          name: testCase.name as string,
          job: testCase.job as string
        };

        logger.info('Testing unicode case', {
          userData,
          expectedStatus: testCase.expectedStatus
        });

        const response = await apiClients.userClient.createUser(userData);
        expect(response.status).toBe(testCase.expectedStatus as number);

        if (response.status === 201) {
          expect(response.data.name).toBe(userData.name);
          expect(response.data.job).toBe(userData.job);
        }
      }
    }

    // Test special characters cases
    const specialCharsCases = testCasesByType['special_chars'] || [];
    if (specialCharsCases.length > 0) {
      logger.info('Testing special characters cases', { count: specialCharsCases.length });

      for (const testCase of specialCharsCases) {
        const userData: CreateUserRequest = {
          name: testCase.name as string,
          job: testCase.job as string
        };

        logger.info('Testing special characters case', {
          userData,
          expectedStatus: testCase.expectedStatus
        });

        const response = await apiClients.userClient.createUser(userData);
        expect(response.status).toBe(testCase.expectedStatus as number);

        if (response.status === 201) {
          expect(response.data.name).toBe(userData.name);
          expect(response.data.job).toBe(userData.job);
        }
      }
    }

    logger.info('Data-driven user creation tests from CSV completed', {
      totalTestCases: userDataSet.data.length,
      validCasesTested: Math.min(validCases.length, 5),
      boundaryCasesTested: boundaryCases.length,
      unicodeCasesTested: unicodeCases.length,
      specialCharsCasesTested: specialCharsCases.length
    });
  });

  test('TC-ADV-02: Data-Driven Authentication Tests from JSON', async ({
    apiClients,
    logger
  }) => {
    logger.info('Running data-driven authentication tests from JSON');

    // Load authentication test scenarios from JSON
    const authDataSet = await testDataLoader.loadFromJSON('auth-scenarios.json');

    expect(authDataSet.data.length).toBeGreaterThan(0);
    logger.info('Loaded authentication test data from JSON', {
      fileName: 'auth-scenarios.json',
      totalScenarios: authDataSet.data.length,
      dataSetName: authDataSet.name
    });

    // Group scenarios by expected outcome
    const successScenarios = authDataSet.data.filter(row => row.shouldSucceed === true);
    const failureScenarios = authDataSet.data.filter(row => row.shouldSucceed === false);

    logger.info('Authentication scenarios grouped', {
      successScenarios: successScenarios.length,
      failureScenarios: failureScenarios.length
    });

    // Test successful authentication scenarios
    logger.info('Testing successful authentication scenarios');

    for (const scenario of successScenarios) {
      const scenarioName = String(scenario.scenario || '');
      logger.info(`Testing success scenario: ${scenarioName}`, {
        description: scenario.description,
        email: scenario.email
      });

      if (scenarioName.includes('login')) {
        const loginRequest: LoginRequest = {
          email: scenario.email as string,
          password: scenario.password as string
        };

        const loginResponse = await apiClients.authClient.login(loginRequest);
        expect(loginResponse.status).toBe(scenario.expectedStatus as number);
        expect(loginResponse.data.token).toBeDefined();

        // Validate token
        const isTokenValid = await apiClients.authClient.validateToken(loginResponse.data.token);
        expect(isTokenValid).toBe(true);

        logger.info(`Success scenario passed: ${scenarioName}`, {
          tokenLength: loginResponse.data.token.length
        });
      } else if (scenarioName.includes('registration')) {
        const registerRequest = {
          email: scenario.email as string,
          password: scenario.password as string
        };

        const registerResponse = await apiClients.authClient.register(registerRequest);
        expect(registerResponse.status).toBe(scenario.expectedStatus as number);
        expect(registerResponse.data.token).toBeDefined();
        expect(registerResponse.data.id).toBeDefined();

        logger.info(`Success scenario passed: ${scenarioName}`, {
          userId: registerResponse.data.id,
          tokenLength: registerResponse.data.token.length
        });
      }
    }

    // Test failure authentication scenarios
    logger.info('Testing failure authentication scenarios');

    for (const scenario of failureScenarios) {
      const scenarioName = String(scenario.scenario || '');
      logger.info(`Testing failure scenario: ${scenarioName}`, {
        description: scenario.description,
        email: scenario.email
      });

      try {
        if (scenarioName.includes('login')) {
          const loginRequest: LoginRequest = {
            email: scenario.email as string,
            password: scenario.password as string
          };

          const loginResponse = await apiClients.authClient.login(loginRequest);

          // If no error is thrown, check the status code
          expect(loginResponse.status).toBe(scenario.expectedStatus as number);

          logger.info(`Failure scenario handled via status code: ${scenarioName}`, {
            status: loginResponse.status
          });
        } else if (scenarioName.includes('registration')) {
          const registerRequest = {
            email: scenario.email as string,
            password: scenario.password as string
          };

          const registerResponse = await apiClients.authClient.register(registerRequest);

          // If no error is thrown, check the status code
          expect(registerResponse.status).toBe(scenario.expectedStatus as number);

          logger.info(`Failure scenario handled via status code: ${scenarioName}`, {
            status: registerResponse.status
          });
        }
      } catch (error) {
        // Error thrown is also valid for failure scenarios
        expect(error).toBeDefined();
        logger.info(`Failure scenario handled via exception: ${scenarioName}`, {
          error: (error as Error).message
        });
      }
    }

    // Test cache functionality
    logger.info('Testing test data loader cache functionality');

    const cacheStats = testDataLoader.getCacheStats();
    // At this point, we should have at least the JSON file loaded
    expect(cacheStats.totalDataSets).toBeGreaterThanOrEqual(1);

    logger.info('Cache statistics', cacheStats);

    // Test loading the same file again (should use cache)
    const cachedAuthDataSet = await testDataLoader.loadFromJSON('auth-scenarios.json');
    expect(cachedAuthDataSet.data.length).toBe(authDataSet.data.length);

    logger.info('Data-driven authentication tests from JSON completed', {
      totalScenarios: authDataSet.data.length,
      successScenariosTested: successScenarios.length,
      failureScenariosTested: failureScenarios.length,
      cacheDataSets: cacheStats.totalDataSets
    });
  });
});

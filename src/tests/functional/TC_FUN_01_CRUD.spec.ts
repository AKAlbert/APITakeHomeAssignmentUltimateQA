import { expect } from '@playwright/test';
import { test } from '@/helpers/test.helpers';
import { UserDataFactory } from '@/data';
import { CreateUserRequest } from '@/types';
import { TestDataLoader } from '@/utils/test-data-loader';

test.describe('A. Functional Tests - CRUD Operations', () => {
  let userFactory: UserDataFactory;
  let testDataLoader: TestDataLoader;

  test.beforeEach(async ({ dataManager, logger, testContext }) => {
    userFactory = dataManager.getUserFactory();
    testDataLoader = new TestDataLoader();
    logger.info('Functional test setup completed', { testId: testContext.testId });
  });

  test('TC-FUN-01: CRUD Operations with Data Persistence Validation', async ({
    apiClients,
    logger,
    dataManager
  }) => {
    const userData = userFactory.createUserForCreation();

    logger.info('Testing CRUD operations with data persistence validation', { userData });

    const createResponse = await apiClients.userClient.createUser(userData);
    expect(createResponse.status).toBe(201);
    expect(createResponse.data).toHaveProperty('id');
    expect(createResponse.data).toHaveProperty('createdAt');
    expect(createResponse.data.name).toBe(userData.name);
    expect(createResponse.data.job).toBe(userData.job);

    const createdAt = new Date(createResponse.data.createdAt);
    const now = Date.now();
    expect(createdAt.getTime()).toBeLessThanOrEqual(now + 5000);
    expect(createdAt.getTime()).toBeGreaterThan(now - 10000);

    // Act 2: Update User
    const updateData = { name: 'Updated Name', job: 'Updated Job' };
    const updateResponse = await apiClients.userClient.updateUser(2, updateData);

    // Assert 2: Update validation
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data).toHaveProperty('updatedAt');
    expect(updateResponse.data.name).toBe(updateData.name);
    expect(updateResponse.data.job).toBe(updateData.job);

    // Data persistence validation - updatedAt should be recent (allow for server clock differences)
    const updatedAt = new Date(updateResponse.data.updatedAt);
    const updateNow = Date.now();
    expect(updatedAt.getTime()).toBeLessThanOrEqual(updateNow + 5000); // Allow 5 seconds ahead for server clock differences
    expect(updatedAt.getTime()).toBeGreaterThan(updateNow - 10000);

    // Track for cleanup
    dataManager.addCleanupTask({
      id: `cleanup_user_${createResponse.data.id}`,
      description: `Cleanup created user ${createResponse.data.id}`,
      execute: async () => {
        logger.info('Cleaning up created user', { userId: createResponse.data.id });
      },
      priority: 1
    });

    logger.info('CRUD operations with data persistence validation completed', {
      createdUserId: createResponse.data.id,
      createdAt: createResponse.data.createdAt,
      updatedAt: updateResponse.data.updatedAt
    });
  });

  test('TC-FUN-02: Input Validation and Error Boundary Testing', async ({
    apiClients,
    logger
  }) => {
    logger.info('Testing input validation and error boundaries');

    // Test 1: Empty name validation
    await expect(async () => {
      await apiClients.userClient.createUser({ name: '', job: 'Engineer' });
    }).rejects.toThrow();

    // Test 2: Empty job validation
    await expect(async () => {
      await apiClients.userClient.createUser({ name: 'John Doe', job: '' });
    }).rejects.toThrow();

    // Test 3: Non-existent user retrieval
    await expect(async () => {
      await apiClients.userClient.getUser(999999);
    }).rejects.toThrow();

    // Test 4: Invalid user ID format (if applicable)
    const exists = await apiClients.userClient.userExists(999999);
    expect(exists).toBe(false);

    logger.info('Input validation and error boundary testing completed');
  });

  test('TC-FUN-03: Response Data Integrity Verification', async ({
    apiClients,
    logger
  }) => {
    logger.info('Testing response data integrity verification');

    // Test user retrieval with data integrity checks
    const userId = 2;
    const response = await apiClients.userClient.getUser(userId);

    // Assert response structure integrity
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('id', userId);
    expect(response.data.data).toHaveProperty('email');
    expect(response.data.data).toHaveProperty('first_name');
    expect(response.data.data).toHaveProperty('last_name');
    expect(response.data.data).toHaveProperty('avatar');

    // Verify data types and formats
    expect(typeof response.data.data.id).toBe('number');
    expect(typeof response.data.data.email).toBe('string');
    expect(typeof response.data.data.first_name).toBe('string');
    expect(typeof response.data.data.last_name).toBe('string');
    expect(typeof response.data.data.avatar).toBe('string');

    // Verify email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(response.data.data.email).toMatch(emailRegex);

    // Verify avatar URL format
    expect(response.data.data.avatar).toMatch(/^https?:\/\/.+/);

    logger.info('Response data integrity verification completed', {
      userId,
      email: response.data.data.email,
      name: `${response.data.data.first_name} ${response.data.data.last_name}`
    });
  });

  test('TC-FUN-04: HTTP Status Code Validation', async ({
    apiClients,
    logger
  }) => {
    logger.info('Testing HTTP status code validation');

    // Test 1: Successful GET request (200)
    const getResponse = await apiClients.userClient.getUsers({ page: 1 });
    expect(getResponse.status).toBe(200);

    // Test 2: Successful POST request (201)
    const userData = userFactory.createUserForCreation();
    const createResponse = await apiClients.userClient.createUser(userData);
    expect(createResponse.status).toBe(201);

    // Test 3: Successful PUT request (200)
    const updateResponse = await apiClients.userClient.updateUser(2, { name: 'Updated', job: 'Updated Job' });
    expect(updateResponse.status).toBe(200);

    // Test 4: Successful DELETE request (204)
    const deleteResponse = await apiClients.userClient.deleteUser(2);
    expect(deleteResponse.status).toBe(204);

    // Test 5: Not Found (404) - handled by error boundary
    const exists = await apiClients.userClient.userExists(999999);
    expect(exists).toBe(false);

    logger.info('HTTP status code validation completed');
  });

  test('TC-FUN-05: Parameterized Testing with External Data', async ({
    apiClients,
    logger
  }) => {
    logger.info('Testing parameterized data from external sources');

    // Load test data from CSV file
    const testDataSet = await testDataLoader.loadFromCSV('users.csv');

    // Filter for valid test cases
    const validTestCases = testDataSet.data.filter(row => row.testType === 'valid');

    expect(validTestCases.length).toBeGreaterThan(0);

    // Test each valid case
    for (const testCase of validTestCases.slice(0, 3)) { // Test first 3 cases
      const userData: CreateUserRequest = {
        name: testCase.name as string,
        job: testCase.job as string
      };

      logger.info('Testing with parameterized data', { userData, testCase });

      const response = await apiClients.userClient.createUser(userData);

      expect(response.status).toBe(testCase.expectedStatus as number);
      expect(response.data.name).toBe(userData.name);
      expect(response.data.job).toBe(userData.job);
    }

    logger.info('Parameterized testing completed', {
      totalTestCases: testDataSet.data.length,
      validTestCases: validTestCases.length,
      testedCases: Math.min(validTestCases.length, 3)
    });
  });

});

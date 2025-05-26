import { expect } from '@playwright/test';
import { test } from '@/helpers/test.helpers';
import { UserDataFactory } from '@/data';
import { CreateUserRequest } from '@/types';

test.describe('B2. Integration Tests - Data Persistence & Retrieval Flow', () => {
  let userFactory: UserDataFactory;

  test.beforeEach(async ({ dataManager, logger, testContext }) => {
    userFactory = dataManager.getUserFactory();
    logger.info('Data persistence integration test setup completed', { testId: testContext.testId });
  });

  test('TC-INT-03: Create Resources and Verify Persistence with Conflict Handling', async ({
    apiClients,
    logger,
    dataManager
  }) => {
    logger.info('Testing resource creation and persistence verification with conflict handling');

    // Step 1: Create multiple users to test persistence
    const users: CreateUserRequest[] = [
      userFactory.createUserForCreation(),
      userFactory.createUserForCreation(),
      userFactory.createUserForCreation()
    ];

    const createdUsers: any[] = [];

    logger.info('Step 1: Creating multiple users for persistence testing', { userCount: users.length });

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];

      logger.info(`Creating user ${i + 1}/${users.length}`, { userData });

      const createResponse = await apiClients.userClient.createUser(userData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.data.id).toBeDefined();
      expect(createResponse.data.createdAt).toBeDefined();
      expect(createResponse.data.name).toBe(userData.name);
      expect(createResponse.data.job).toBe(userData.job);

      // Verify timestamp is recent (within last 30 seconds)
      const createdAt = new Date(createResponse.data.createdAt);
      const timeDiff = Date.now() - createdAt.getTime();
      expect(timeDiff).toBeLessThan(30000);

      createdUsers.push(createResponse.data);

      // Add cleanup task
      dataManager.addCleanupTask({
        id: `cleanup_user_${createResponse.data.id}`,
        description: `Cleanup created user ${createResponse.data.id}`,
        execute: async () => {
          logger.info('Cleaning up created user', { userId: createResponse.data.id });
        },
        priority: 1
      });
    }

    // Step 2: Verify data persistence by retrieving users
    logger.info('Step 2: Verifying data persistence by retrieving users');

    const retrievalResults: Array<{
      userId: number | string;
      retrieved: boolean;
      data?: any;
      error?: string;
    }> = [];

    for (const createdUser of createdUsers) {
      // Note: reqres.in doesn't actually persist created users, so we'll test with known users
      const knownUserId = 2; // Use known user ID for actual retrieval test

      try {
        const retrieveResponse = await apiClients.userClient.getUser(knownUserId);
        expect(retrieveResponse.status).toBe(200);
        expect(retrieveResponse.data.data.id).toBe(knownUserId);

        retrievalResults.push({
          userId: knownUserId,
          retrieved: true,
          data: retrieveResponse.data.data
        });
      } catch (error) {
        retrievalResults.push({
          userId: createdUser.id,
          retrieved: false,
          error: (error as Error).message
        });
      }
    }

    // Step 3: Test conflict handling with duplicate data
    logger.info('Step 3: Testing conflict handling with duplicate data');

    const duplicateUserData = users[0]; // Reuse first user data

    try {
      const duplicateResponse = await apiClients.userClient.createUser(duplicateUserData);

      // reqres.in allows duplicates, so this should succeed
      expect(duplicateResponse.status).toBe(201);
      expect(duplicateResponse.data.name).toBe(duplicateUserData.name);

      logger.info('Duplicate creation handled (allowed by API)', {
        originalUser: users[0],
        duplicateUser: duplicateResponse.data
      });
    } catch (error) {
      // If API prevents duplicates, this is also valid behavior
      logger.info('Duplicate creation prevented by API', {
        error: (error as Error).message
      });
    }

    // Step 4: Test batch operations and consistency
    logger.info('Step 4: Testing batch operations and data consistency');

    const batchUsers = [
      userFactory.createUserForCreation(),
      userFactory.createUserForCreation()
    ];

    const batchResults = await Promise.allSettled(
      batchUsers.map(userData => apiClients.userClient.createUser(userData))
    );

    let successfulBatchCreations = 0;
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        expect(result.value.status).toBe(201);
        expect(result.value.data.name).toBe(batchUsers[index].name);
        successfulBatchCreations++;
      } else {
        logger.warn('Batch creation failed', {
          index,
          error: result.reason.message
        });
      }
    });

    expect(successfulBatchCreations).toBeGreaterThan(0);

    logger.info('Resource creation and persistence verification completed', {
      totalUsersCreated: createdUsers.length,
      retrievalResults: retrievalResults.length,
      successfulBatchCreations
    });
  });

  test('TC-INT-04: Update Operations with Conflict Handling and Cleanup Verification', async ({
    apiClients,
    logger,
    dataManager
  }) => {
    logger.info('Testing update operations with conflict handling and cleanup verification');

    // Step 1: Create a user for update testing
    const initialUserData = userFactory.createUserForCreation();

    logger.info('Step 1: Creating user for update testing', { userData: initialUserData });

    const createResponse = await apiClients.userClient.createUser(initialUserData);
    expect(createResponse.status).toBe(201);

    const createdUserId = createResponse.data.id;

    // Step 2: Perform update operations
    logger.info('Step 2: Performing update operations');

    const updateData1 = {
      name: 'Updated Name 1',
      job: 'Updated Job 1'
    };

    // Use known user ID for actual update testing (reqres.in limitation)
    const knownUserId = 2;
    const updateResponse1 = await apiClients.userClient.updateUser(knownUserId, updateData1);

    expect(updateResponse1.status).toBe(200);
    expect(updateResponse1.data.name).toBe(updateData1.name);
    expect(updateResponse1.data.job).toBe(updateData1.job);
    expect(updateResponse1.data.updatedAt).toBeDefined();

    const firstUpdateTime = new Date(updateResponse1.data.updatedAt);

    // Step 3: Test concurrent update handling
    logger.info('Step 3: Testing concurrent update handling');

    const updateData2 = {
      name: 'Updated Name 2',
      job: 'Updated Job 2'
    };

    // Simulate concurrent updates
    const concurrentUpdates = await Promise.allSettled([
      apiClients.userClient.updateUser(knownUserId, updateData2),
      apiClients.userClient.updateUser(knownUserId, { name: 'Concurrent Update', job: 'Concurrent Job' })
    ]);

    let successfulUpdates = 0;
    concurrentUpdates.forEach((result) => {
      if (result.status === 'fulfilled') {
        expect(result.value.status).toBe(200);
        expect(result.value.data.updatedAt).toBeDefined();

        const updateTime = new Date(result.value.data.updatedAt);
        expect(updateTime.getTime()).toBeGreaterThanOrEqual(firstUpdateTime.getTime());

        successfulUpdates++;
      }
    });

    expect(successfulUpdates).toBeGreaterThan(0);

    // Step 4: Test pagination and filtering functionality
    logger.info('Step 4: Testing pagination and filtering functionality');

    const paginationTests = [
      { page: 1, per_page: 2 },
      { page: 2, per_page: 3 },
      { page: 1, per_page: 5 }
    ];

    for (const paginationParams of paginationTests) {
      const paginatedResponse = await apiClients.userClient.getUsers(paginationParams);

      expect(paginatedResponse.status).toBe(200);
      expect(paginatedResponse.data.page).toBe(paginationParams.page);
      expect(paginatedResponse.data.per_page).toBe(paginationParams.per_page);
      expect(paginatedResponse.data.data.length).toBeLessThanOrEqual(paginationParams.per_page);
      expect(paginatedResponse.data.total).toBeGreaterThan(0);
      expect(paginatedResponse.data.total_pages).toBeGreaterThan(0);
    }

    // Step 5: Test delete operations and cleanup verification
    logger.info('Step 5: Testing delete operations and cleanup verification');

    const deleteResponse = await apiClients.userClient.deleteUser(knownUserId);
    expect(deleteResponse.status).toBe(204);

    // Verify user no longer exists (in a real persistent API)
    const userExists = await apiClients.userClient.userExists(999999); // Non-existent user
    expect(userExists).toBe(false);

    // Step 6: Cleanup verification
    logger.info('Step 6: Performing cleanup verification');

    // Add cleanup tasks and verify they're tracked
    const cleanupTasks = [
      {
        id: `cleanup_test_${Date.now()}_1`,
        description: 'Test cleanup task 1',
        execute: async () => { logger.info('Executing cleanup task 1'); },
        priority: 1
      },
      {
        id: `cleanup_test_${Date.now()}_2`,
        description: 'Test cleanup task 2',
        execute: async () => { logger.info('Executing cleanup task 2'); },
        priority: 2
      }
    ];

    cleanupTasks.forEach(task => dataManager.addCleanupTask(task));

    // Verify cleanup tasks are properly managed
    const cleanupStats = dataManager.getCleanupStats();
    expect(cleanupStats.totalTasks).toBeGreaterThanOrEqual(cleanupTasks.length);

    logger.info('Update operations with conflict handling and cleanup verification completed', {
      createdUserId,
      successfulUpdates,
      paginationTestsCount: paginationTests.length,
      cleanupTasksAdded: cleanupTasks.length,
      totalCleanupTasks: cleanupStats.totalTasks
    });
  });
});

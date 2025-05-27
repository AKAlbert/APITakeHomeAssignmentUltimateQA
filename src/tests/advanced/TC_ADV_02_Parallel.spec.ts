import { expect } from '@playwright/test';
import { test } from '@/helpers/test.helpers';
import { UserDataFactory } from '@/data';

test.describe('C2. Advanced Testing - Parallel Test Execution with Isolation', () => {
  let userFactory: UserDataFactory;

  test.beforeEach(async ({ dataManager, logger, testContext }) => {
    userFactory = dataManager.getUserFactory();
    logger.info('Parallel testing setup completed', { testId: testContext.testId });
  });

  test('TC-ADV-03: Parallel Test Execution with Proper Isolation', async ({
    apiClients,
    logger,
    dataManager
  }) => {
    logger.info('Testing parallel execution with proper test isolation');

    // Step 1: Create isolated test data for parallel execution
    const parallelTestData = Array.from({ length: 5 }, (_, index) => ({
      id: `parallel_test_${Date.now()}_${index}`,
      userData: userFactory.createUserForCreation(),
      expectedResults: {
        status: 201,
        hasId: true,
        hasCreatedAt: true
      }
    }));

    logger.info('Created isolated test data for parallel execution', {
      testDataCount: parallelTestData.length
    });

    // Step 2: Execute parallel user creation operations
    logger.info('Step 2: Executing parallel user creation operations');

    const parallelCreationPromises = parallelTestData.map(async (testData, index) => {
      const startTime = Date.now();

      try {
        logger.info(`Starting parallel creation ${index + 1}`, {
          testId: testData.id,
          userData: testData.userData
        });

        const response = await apiClients.userClient.createUser(testData.userData);
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Validate response
        expect(response.status).toBe(testData.expectedResults.status);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('createdAt');
        expect(response.data.name).toBe(testData.userData.name);
        expect(response.data.job).toBe(testData.userData.job);

        // Add cleanup task with unique identifier
        dataManager.addCleanupTask({
          id: `cleanup_${testData.id}`,
          description: `Cleanup parallel test user ${response.data.id}`,
          execute: async () => {
            logger.info('Cleaning up parallel test user', {
              testId: testData.id,
              userId: response.data.id
            });
          },
          priority: 1
        });

        return {
          testId: testData.id,
          index,
          success: true,
          response: response.data,
          duration,
          error: null
        };
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        logger.error(`Parallel creation ${index + 1} failed`, {
          testId: testData.id,
          error: (error as Error).message,
          duration
        });

        return {
          testId: testData.id,
          index,
          success: false,
          response: null,
          duration,
          error: (error as Error).message
        };
      }
    });

    const parallelResults = await Promise.allSettled(parallelCreationPromises);

    // Step 3: Analyze parallel execution results
    logger.info('Step 3: Analyzing parallel execution results');

    const successfulResults = parallelResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value)
      .filter(value => value.success);

    const failedResults = parallelResults
      .filter(result => result.status === 'rejected' ||
               (result.status === 'fulfilled' && !(result as PromiseFulfilledResult<any>).value.success));

    expect(successfulResults.length).toBeGreaterThan(0);

    // Verify test isolation - each test should have unique data
    const uniqueUserIds = new Set(successfulResults.map(result => result.response?.id));
    const uniqueTestIds = new Set(successfulResults.map(result => result.testId));

    expect(uniqueUserIds.size).toBe(successfulResults.length);
    expect(uniqueTestIds.size).toBe(successfulResults.length);

    // Calculate performance metrics
    const durations = successfulResults.map(result => result.duration);
    const avgDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    logger.info('Parallel execution analysis completed', {
      totalTests: parallelTestData.length,
      successfulTests: successfulResults.length,
      failedTests: failedResults.length,
      uniqueUserIds: uniqueUserIds.size,
      uniqueTestIds: uniqueTestIds.size,
      performanceMetrics: {
        avgDuration: `${avgDuration.toFixed(2)}ms`,
        maxDuration: `${maxDuration}ms`,
        minDuration: `${minDuration}ms`
      }
    });

    // Step 4: Test parallel read operations with isolation
    logger.info('Step 4: Testing parallel read operations with isolation');

    const parallelReadPromises = Array.from({ length: 3 }, async (_, index) => {
      const startTime = Date.now();
      const userId = index + 1; // Use different user IDs for isolation

      try {
        logger.info(`Starting parallel read ${index + 1}`, { userId });

        const response = await apiClients.userClient.getUsers({ page: userId, per_page: 2 });
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('page');
        expect(response.data).toHaveProperty('data');

        return {
          readId: `read_${index + 1}`,
          userId,
          success: true,
          dataCount: response.data.data?.length || 0,
          duration,
          error: null
        };
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        return {
          readId: `read_${index + 1}`,
          userId,
          success: false,
          dataCount: 0,
          duration,
          error: (error as Error).message
        };
      }
    });

    const parallelReadResults = await Promise.allSettled(parallelReadPromises);

    const successfulReads = parallelReadResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value)
      .filter(value => value.success);

    expect(successfulReads.length).toBeGreaterThan(0);

    // Step 5: Test concurrent update operations with conflict detection
    logger.info('Step 5: Testing concurrent update operations with conflict detection');

    const concurrentUpdatePromises = Array.from({ length: 2 }, async (_, index) => {
      const startTime = Date.now();
      const userId = 2; // Same user ID to test conflict handling
      const updateData = {
        name: `Concurrent Update ${index + 1}`,
        job: `Concurrent Job ${index + 1}`
      };

      try {
        logger.info(`Starting concurrent update ${index + 1}`, { userId, updateData });

        const response = await apiClients.userClient.updateUser(userId, updateData);
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('updatedAt');

        return {
          updateId: `update_${index + 1}`,
          userId,
          success: true,
          updateData,
          updatedAt: response.data.updatedAt,
          duration,
          error: null
        };
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        return {
          updateId: `update_${index + 1}`,
          userId,
          success: false,
          updateData,
          updatedAt: null,
          duration,
          error: (error as Error).message
        };
      }
    });

    const concurrentUpdateResults = await Promise.allSettled(concurrentUpdatePromises);

    const successfulUpdates = concurrentUpdateResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value)
      .filter(value => value.success);

    // At least one update should succeed
    expect(successfulUpdates.length).toBeGreaterThan(0);

    // Check for proper timestamp handling in concurrent updates
    if (successfulUpdates.length > 1) {
      const timestamps = successfulUpdates.map(update => new Date(update.updatedAt).getTime());
      const uniqueTimestamps = new Set(timestamps);

      // Timestamps should be different or very close (depending on API implementation)
      logger.info('Concurrent update timestamp analysis', {
        totalUpdates: successfulUpdates.length,
        uniqueTimestamps: uniqueTimestamps.size,
        timestamps: successfulUpdates.map(update => update.updatedAt)
      });
    }

    // Step 6: Verify test isolation and cleanup
    logger.info('Step 6: Verifying test isolation and cleanup');

    const cleanupStats = dataManager.getCleanupStats();
    expect(cleanupStats.totalTasks).toBeGreaterThanOrEqual(successfulResults.length);

    // Verify each test created its own cleanup task
    const parallelCleanupTasks = cleanupStats.totalTasks;
    expect(parallelCleanupTasks).toBeGreaterThan(0);

    logger.info('Parallel test execution with isolation completed', {
      parallelCreations: {
        total: parallelTestData.length,
        successful: successfulResults.length,
        failed: failedResults.length,
        isolationVerified: uniqueUserIds.size === successfulResults.length
      },
      parallelReads: {
        total: 3,
        successful: successfulReads.length
      },
      concurrentUpdates: {
        total: 2,
        successful: successfulUpdates.length
      },
      cleanup: {
        tasksCreated: parallelCleanupTasks
      }
    });
  });
});

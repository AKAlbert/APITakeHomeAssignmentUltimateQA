// Enterprise API Testing Suite

import { expect } from '@playwright/test';
import { test } from '@/helpers/test.helpers';
import { getUserForScenario, getResourceForScenario } from '@/fixtures';

test.describe('Enterprise Framework Interview Test ', () => {

  test('Complete API Workflow with Framework Features', async ({
    apiClients,
    dataManager,
    logger,
    testContext
  }) => {
    logger.info('Starting comprehensive API workflow demonstration');

    // 1. Generate realistic test data using factories
    const userFactory = dataManager.getUserFactory();
    const resourceFactory = dataManager.getResourceFactory();

    const newUser = userFactory.createRealisticUser();
    const edgeCaseUser = userFactory.createEdgeCaseUser('unicode');
    const modernResource = resourceFactory.createModernResource();

    logger.info('Generated test data', {
      newUser: { name: newUser.name, job: newUser.job },
      edgeCaseUser: { name: edgeCaseUser.name, job: edgeCaseUser.job },
      modernResource: { name: modernResource.name, year: modernResource.year }
    });

    // 2. Test user operations with automatic error handling and retries
    logger.info('Testing user operations');

    // Create user and track for cleanup
    const createUserResponse = await apiClients.userClient.createUser({
      name: newUser.name!,
      job: newUser.job!
    });

    expect(createUserResponse.status).toBe(201);
    expect(createUserResponse.data.name).toBe(newUser.name);

    testContext.userData.set('createdUserId', createUserResponse.data.id);

    // Get users with pagination
    const usersResponse = await apiClients.userClient.getUsers({ page: 1, per_page: 3 });
    expect(usersResponse.status).toBe(200);
    expect(usersResponse.data.data).toHaveLength(3);

    // Search users
    const searchResponse = await apiClients.userClient.searchUsers('janet');
    expect(searchResponse.status).toBe(200);

    logger.info('User operations completed successfully', {
      createdUserId: createUserResponse.data.id,
      totalUsers: usersResponse.data.total,
      searchResults: searchResponse.data.data.length
    });

    // 3. Test authentication with fixture data
    logger.info('Testing authentication');

    const authUser = getUserForScenario('login_success');
    const loginResponse = await apiClients.authClient.login({
      email: authUser.email!,
      password: authUser.password!
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data.token).toBeDefined();

    // Validate token
    const isValidToken = await apiClients.authClient.validateToken(loginResponse.data.token);
    expect(isValidToken).toBe(true);

    logger.info('Authentication completed successfully', {
      tokenLength: loginResponse.data.token.length,
      isValid: isValidToken
    });


    // 5. Test error handling
    logger.info('Testing error handling');

    // Test non-existent user
    const userExists = await apiClients.userClient.userExists(999999);
    expect(userExists).toBe(false);

    logger.info('Error handling tested successfully');

    // 6. Performance testing
    logger.info('Testing performance');

    const startTime = Date.now();
    await apiClients.userClient.getUsers();
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); 

    logger.info('Performance test completed', { duration: `${duration}ms` });

    // 7. Add cleanup tasks
    dataManager.addCleanupTask({
      id: 'demo-cleanup',
      description: 'Demo test cleanup',
      execute: async () => {
        logger.info('Executing demo cleanup tasks');
      },
      priority: 1
    });

    logger.info('🎉 Framework demonstration completed successfully!', {
      testId: testContext.testId,
      totalDuration: Date.now() - testContext.startTime.getTime()
    });
  });

  test('Data Factory Showcase', async ({ dataManager, logger }) => {
    logger.info('Demonstrating data factory capabilities');

    const userFactory = dataManager.getUserFactory();
    const resourceFactory = dataManager.getResourceFactory();

    // Generate different types of users
    const validUser = userFactory.createValidUser();
    const adminUser = userFactory.createAdminUser();
    const engineeringUser = userFactory.createUserWithJobCategory('engineering');
    const bulkUsers = userFactory.createBulkUsers(5);

    // Generate different types of resources
    const vintageResource = resourceFactory.createVintageResource();
    const warmColorResource = resourceFactory.createResourceWithColorTheme('warm');
    const resourceFor2023 = resourceFactory.createResourceForYear(2023);

    // Validate generated data
    expect(validUser.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(adminUser.job).toContain('Admin');
    expect(engineeringUser.job).toMatch(/Engineer|Developer|Engineering/i);
    expect(bulkUsers).toHaveLength(5);
    expect(vintageResource.year).toBeLessThan(2011);
    expect(resourceFor2023.year).toBe(2023);

    logger.info('Data factory demonstration completed', {
      validUser: validUser.name,
      adminUser: adminUser.name,
      engineeringUser: engineeringUser.name,
      bulkUsersCount: bulkUsers.length,
      vintageResource: vintageResource.name,
      warmColorResource: warmColorResource.name
    });
  });

  test('Fixture Data Testing', async ({ logger }) => {
    logger.info('Testing fixture data capabilities');

    // Use predefined fixture data
    const loginUser = getUserForScenario('login_success');
    const popularResource = getResourceForScenario('popular');
    const vintageResource = getResourceForScenario('vintage');

    // Validate fixture data
    expect(loginUser.email).toBe('eve.holt@reqres.in');
    expect(loginUser.password).toBe('cityslicka');
    expect(popularResource.name).toBe('classic blue');
    expect(vintageResource.name).toBe('emerald');

    logger.info('Fixture data demonstration completed', {
      loginUser: loginUser.email,
      popularResource: popularResource.name,
      vintageResource: vintageResource.name
    });
  });

  test.skip('Environment Configuration Demo', async ({ logger }) => {
    logger.info('Demonstrating environment configuration');

    // Import directly from the environment config file
    const environmentConfig = await import('@/config/environment.config');
    
    const currentEnv = environmentConfig.getCurrentEnvironment();
    const envConfig = environmentConfig.getEnvironmentConfig();

    expect(currentEnv).toBeDefined();
    expect(envConfig.baseURL).toBeDefined();
    expect(envConfig.timeout).toBeGreaterThan(0);
    expect(envConfig.retries).toBeGreaterThanOrEqual(0);

    logger.info('Environment configuration demonstration completed', {
      environment: currentEnv,
      baseURL: envConfig.baseURL,
      timeout: envConfig.timeout,
      retries: envConfig.retries
    });
  });
});

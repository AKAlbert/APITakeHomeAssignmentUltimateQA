/**
 * Refactored CRUD Operations Test
 * Example of using the new enterprise-grade API testing framework
 */

import { expect } from '@playwright/test';
import { test } from '@/helpers/test.helpers';
import { UserDataFactory } from '@/data';
import { CreateUserRequest } from '@/types';

test.describe('User CRUD Operations ', () => {
  let userFactory: UserDataFactory;
  let createdUserId: string;

  test.beforeEach(async ({ dataManager, logger, testContext }) => {
    userFactory = dataManager.getUserFactory();
    logger.info('Test setup completed', { testId: testContext.testId });
  });

  test('TC-FUN-01: Create User with Valid Payload', async ({
    apiClients,
    logger,
    testContext
  }) => {
    // Arrange
    const userData = userFactory.createUserForCreation({
      name: 'John Doe',
      job: 'Software Engineer'
    });

    logger.info('Creating user with data', { userData });

    // Act
    const response = await apiClients.userClient.createUser(userData);

    // Assert
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('createdAt');
    expect(response.data.name).toBe(userData.name);
    expect(response.data.job).toBe(userData.job);

    // Store for cleanup
    createdUserId = response.data.id;
    testContext.userData.set('createdUserId', createdUserId);

    logger.info('User created successfully', {
      userId: createdUserId,
      name: response.data.name,
      job: response.data.job
    });
  });

  test('TC-FUN-02: Retrieve Created User', async ({
    apiClients,
    logger
  }) => {
    // Arrange
    const userId = 2; // Using known user ID from reqres.in

    logger.info('Retrieving user', { userId });

    // Act
    const response = await apiClients.userClient.getUser(userId);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('id', userId);
    expect(response.data.data).toHaveProperty('email');
    expect(response.data.data).toHaveProperty('first_name');
    expect(response.data.data).toHaveProperty('last_name');
    expect(response.data.data).toHaveProperty('avatar');

    logger.info('User retrieved successfully', {
      userId,
      email: response.data.data.email,
      name: `${response.data.data.first_name} ${response.data.data.last_name}`
    });
  });

  test('TC-FUN-03: Update User Information', async ({
    apiClients,
    logger
  }) => {
    // Arrange
    const userId = 2;
    const updateData = {
      name: 'John Updated',
      job: 'Senior Software Engineer'
    };

    logger.info('Updating user', { userId, updateData });

    // Act
    const response = await apiClients.userClient.updateUser(userId, updateData);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('updatedAt');
    expect(response.data.name).toBe(updateData.name);
    expect(response.data.job).toBe(updateData.job);

    // Validate updatedAt is recent
    const updatedAt = new Date(response.data.updatedAt);
    const now = new Date();
    const timeDiff = now.getTime() - updatedAt.getTime();
    expect(timeDiff).toBeLessThan(60000); // Within 1 minute

    logger.info('User updated successfully', {
      userId,
      updatedAt: response.data.updatedAt,
      changes: updateData
    });
  });

  test('TC-FUN-04: Delete User', async ({
    apiClients,
    logger
  }) => {
    // Arrange
    const userId = 2;

    logger.info('Deleting user', { userId });

    // Act
    const response = await apiClients.userClient.deleteUser(userId);

    // Assert
    expect(response.status).toBe(204);

    logger.info('User deleted successfully', { userId });
  });

  test('TC-FUN-05: Create User with Factory Data', async ({
    apiClients,
    dataManager,
    logger
  }) => {
    // Arrange - Using data factory for realistic data
    const userData = userFactory.createRealisticUser();
    const createRequest: CreateUserRequest = {
      name: userData.name!,
      job: userData.job!
    };

    logger.info('Creating user with factory data', { userData: createRequest });

    // Act
    const response = await apiClients.userClient.createUser(createRequest);

    // Assert
    expect(response.status).toBe(201);
    expect(response.data.name).toBe(createRequest.name);
    expect(response.data.job).toBe(createRequest.job);

    // Track for cleanup
    dataManager.addCleanupTask({
      id: `cleanup_user_${response.data.id}`,
      description: `Cleanup created user ${response.data.id}`,
      execute: async () => {
        logger.info('Cleaning up created user', { userId: response.data.id });
        // In a real API, you might delete the user here
      },
      priority: 1
    });

    logger.info('User created with factory data', {
      userId: response.data.id,
      name: response.data.name,
      job: response.data.job
    });
  });

  test('TC-FUN-06: Create User with Edge Case Data', async ({
    apiClients,
    logger
  }) => {
    // Arrange - Using edge case data
    const edgeCaseUser = userFactory.createEdgeCaseUser('special_chars');
    const createRequest: CreateUserRequest = {
      name: edgeCaseUser.name!,
      job: edgeCaseUser.job!
    };

    logger.info('Creating user with edge case data', { userData: createRequest });

    // Act
    const response = await apiClients.userClient.createUser(createRequest);

    // Assert
    expect(response.status).toBe(201);
    expect(response.data.name).toBe(createRequest.name);
    expect(response.data.job).toBe(createRequest.job);

    logger.info('User created with edge case data', {
      userId: response.data.id,
      name: response.data.name,
      job: response.data.job
    });
  });

  test('TC-FUN-07: Get Users with Pagination', async ({
    apiClients,
    logger
  }) => {
    // Arrange
    const paginationParams = { page: 1, per_page: 3 };

    logger.info('Getting users with pagination', { params: paginationParams });

    // Act
    const response = await apiClients.userClient.getUsers(paginationParams);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('page', 1);
    expect(response.data).toHaveProperty('per_page', 3);
    expect(response.data).toHaveProperty('total');
    expect(response.data).toHaveProperty('total_pages');
    expect(response.data.data).toHaveLength(3);

    // Validate user structure
    for (const user of response.data.data) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('first_name');
      expect(user).toHaveProperty('last_name');
      expect(user).toHaveProperty('avatar');
    }

    logger.info('Users retrieved with pagination', {
      page: response.data.page,
      perPage: response.data.per_page,
      total: response.data.total,
      userCount: response.data.data.length
    });
  });

  test('TC-FUN-08: Handle User Not Found', async ({
    apiClients,
    logger
  }) => {
    // Arrange
    const nonExistentUserId = 999999;

    logger.info('Testing user not found scenario', { userId: nonExistentUserId });

    // Act & Assert
    await expect(async () => {
      await apiClients.userClient.getUser(nonExistentUserId);
    }).rejects.toThrow();

    // Verify user doesn't exist using helper method
    const exists = await apiClients.userClient.userExists(nonExistentUserId);
    expect(exists).toBe(false);

    logger.info('User not found scenario handled correctly', { userId: nonExistentUserId });
  });

  test('TC-FUN-09: Search Users (Mock Implementation)', async ({
    apiClients,
    logger
  }) => {
    // Arrange
    const searchQuery = 'janet';

    logger.info('Searching users', { query: searchQuery });

    // Act
    const response = await apiClients.userClient.searchUsers(searchQuery);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data.data).toBeDefined();

    // Verify search results contain the query
    const matchingUsers = response.data.data.filter(user =>
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    expect(matchingUsers.length).toBeGreaterThan(0);

    logger.info('User search completed', {
      query: searchQuery,
      totalResults: response.data.data.length,
      matchingResults: matchingUsers.length
    });
  });
});

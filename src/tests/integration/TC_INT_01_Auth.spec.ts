import { expect } from '@playwright/test';
import { test } from '@/helpers/test.helpers';
import { TestDataLoader } from '@/utils/test-data-loader';
import { LoginRequest, RegisterRequest } from '@/types';

test.describe('B1. Integration Tests - Authentication & Authorization Flow', () => {
  let testDataLoader: TestDataLoader;

  test.beforeEach(async ({ logger, testContext }) => {
    testDataLoader = new TestDataLoader();
    logger.info('Authentication integration test setup completed', { testId: testContext.testId });
  });

  test('TC-INT-01: Complete Authentication Flow with Token Management', async ({
    apiClients,
    logger
  }) => {
    logger.info('Testing complete authentication flow with token management');

    // Load authentication test scenarios
    const authDataSet = await testDataLoader.loadFromJSON('auth-scenarios.json');
    const validLoginScenario = authDataSet.data.find(row => row.scenario === 'valid_login');
    const validRegisterScenario = authDataSet.data.find(row => row.scenario === 'valid_registration');

    expect(validLoginScenario).toBeDefined();
    expect(validRegisterScenario).toBeDefined();

    // Step 1: User Registration
    const registerRequest: RegisterRequest = {
      email: validRegisterScenario!.email as string,
      password: validRegisterScenario!.password as string
    };

    logger.info('Step 1: Testing user registration', { email: registerRequest.email });

    const registerResponse = await apiClients.authClient.register(registerRequest);
    expect(registerResponse.status).toBe(validRegisterScenario!.expectedStatus as number);
    expect(registerResponse.data.token).toBeDefined();
    expect(registerResponse.data.id).toBeDefined();

    const registrationToken = registerResponse.data.token;

    // Step 2: Token Validation
    logger.info('Step 2: Validating registration token');

    const isRegistrationTokenValid = await apiClients.authClient.validateToken(registrationToken);
    expect(isRegistrationTokenValid).toBe(true);

    // Step 3: User Login
    const loginRequest: LoginRequest = {
      email: validLoginScenario!.email as string,
      password: validLoginScenario!.password as string
    };

    logger.info('Step 3: Testing user login', { email: loginRequest.email });

    const loginResponse = await apiClients.authClient.login(loginRequest);
    expect(loginResponse.status).toBe(validLoginScenario!.expectedStatus as number);
    expect(loginResponse.data.token).toBeDefined();

    const loginToken = loginResponse.data.token;

    // Step 4: Token Management - Validate Login Token
    logger.info('Step 4: Validating login token');

    const isLoginTokenValid = await apiClients.authClient.validateToken(loginToken);
    expect(isLoginTokenValid).toBe(true);

    // Step 5: Authentication Status Check
    logger.info('Step 5: Checking authentication status');

    const authStatus = await apiClients.authClient.getAuthStatus(loginToken);
    expect(authStatus.isAuthenticated).toBe(true);
    expect(authStatus.user).toBeDefined();

    // Step 6: Token Refresh (Mock Implementation)
    logger.info('Step 6: Testing token refresh');

    const refreshedTokenResponse = await apiClients.authClient.refreshToken(loginToken);
    expect(refreshedTokenResponse.status).toBe(200);
    expect(refreshedTokenResponse.data.token).toBeDefined();
    expect(refreshedTokenResponse.data.token).not.toBe(loginToken); // Should be different

    // Step 7: Validate Refreshed Token
    logger.info('Step 7: Validating refreshed token');

    const isRefreshedTokenValid = await apiClients.authClient.validateToken(refreshedTokenResponse.data.token);
    expect(isRefreshedTokenValid).toBe(true);

    logger.info('Complete authentication flow with token management completed successfully', {
      registrationToken: registrationToken.substring(0, 10) + '...',
      loginToken: loginToken.substring(0, 10) + '...',
      refreshedToken: refreshedTokenResponse.data.token.substring(0, 10) + '...'
    });
  });

  test('TC-INT-02: Protected Endpoint Access Verification', async ({
    apiClients,
    logger
  }) => {
    logger.info('Testing protected endpoint access verification');

    // Load authentication test scenarios
    const authDataSet = await testDataLoader.loadFromJSON('auth-scenarios.json');
    const validLoginScenario = authDataSet.data.find(row => row.scenario === 'valid_login');

    expect(validLoginScenario).toBeDefined();

    // Step 1: Attempt to access protected resource without authentication
    logger.info('Step 1: Testing access without authentication');

    // In a real API, this would fail. For reqres.in, we'll simulate this
    const unauthorizedAccess = await apiClients.authClient.getAuthStatus('invalid_token');
    expect(unauthorizedAccess.isAuthenticated).toBe(false);

    // Step 2: Authenticate and get valid token
    const loginRequest: LoginRequest = {
      email: validLoginScenario!.email as string,
      password: validLoginScenario!.password as string
    };

    logger.info('Step 2: Authenticating to get valid token');

    const loginResponse = await apiClients.authClient.login(loginRequest);
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data.token).toBeDefined();

    const validToken = loginResponse.data.token;

    // Step 3: Access protected resource with valid token
    logger.info('Step 3: Testing access with valid authentication');

    const authorizedAccess = await apiClients.authClient.getAuthStatus(validToken);
    expect(authorizedAccess.isAuthenticated).toBe(true);
    expect(authorizedAccess.user).toBeDefined();

    // Step 4: Test token expiration simulation
    logger.info('Step 4: Testing token expiration handling');

    // Simulate expired token
    const expiredTokenAccess = await apiClients.authClient.getAuthStatus('expired_token');
    expect(expiredTokenAccess.isAuthenticated).toBe(false);

    // Step 5: Session Management Testing
    logger.info('Step 5: Testing session management');

    // Test multiple concurrent sessions (if supported)
    const secondLoginResponse = await apiClients.authClient.login(loginRequest);
    expect(secondLoginResponse.status).toBe(200);
    expect(secondLoginResponse.data.token).toBeDefined();

    // Both tokens should be valid (if multiple sessions are supported)
    const firstTokenValid = await apiClients.authClient.validateToken(validToken);
    const secondTokenValid = await apiClients.authClient.validateToken(secondLoginResponse.data.token);

    expect(firstTokenValid).toBe(true);
    expect(secondTokenValid).toBe(true);

    logger.info('Protected endpoint access verification completed successfully', {
      validToken: validToken.substring(0, 10) + '...',
      secondToken: secondLoginResponse.data.token.substring(0, 10) + '...'
    });
  });
});

/**
 * Type Definitions Index
 * Central export point for all type definitions
 */

// API Types
export * from './api.types';

// Configuration Types
export * from './config.types';

// Test Types
export * from './test.types';

// Re-export commonly used types for convenience
export type {
  User,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UserListResponse,
  SingleUserResponse,
  Resource,
  ResourceListResponse,
  SingleResourceResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ApiResponse,
  ApiErrorResponse,
  HttpMethod,
  RequestConfig,
  ApiClientConfig
} from './api.types';

export type {
  Environment,
  LogLevel,
  EnvironmentConfig,
  LoggerConfig,
  TestConfig,
  FrameworkConfig,
  EnvironmentVariables
} from './config.types';

export type {
  TestUser,
  TestResource,
  TestCaseMetadata,
  TestResult,
  TestStep,
  UserFactory,
  ResourceFactory,
  TestFixture,
  TestContext,
  PerformanceMetrics,
  TestReport,
  ValidationRule,
  ValidationResult,
  CleanupTask,
  MockResponse,
  MockConfig
} from './test.types';

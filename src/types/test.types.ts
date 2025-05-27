import { User, Resource } from './api.types';
export interface TestUser extends Omit<User, 'id'> {
  password?: string;
  confirmPassword?: string;
}

export interface TestResource extends Omit<Resource, 'id'> {
  description?: string;
}

export interface TestCaseMetadata {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedDuration: number; // in milliseconds
}

export interface TestResult {
  testId: string;
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  duration: number;
  error?: {
    message: string;
    stack?: string;
    screenshot?: string;
  };
  steps: TestStep[];
  metadata: TestCaseMetadata;
}

export interface TestStep {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  attachments?: string[];
}

export interface UserFactory {
  createUser(overrides?: Partial<TestUser>): TestUser;
  createUsers(count: number, overrides?: Partial<TestUser>): TestUser[];
  createValidUser(): TestUser;
  createInvalidUser(): TestUser;
}

export interface ResourceFactory {
  createResource(overrides?: Partial<TestResource>): TestResource;
  createResources(count: number, overrides?: Partial<TestResource>): TestResource[];
  createValidResource(): TestResource;
  createInvalidResource(): TestResource;
}

export interface TestFixture<T = any> {
  name: string;
  data: T;
  description?: string;
  tags?: string[];
}

export interface UserFixtures {
  validUsers: TestFixture<TestUser[]>;
  invalidUsers: TestFixture<TestUser[]>;
  adminUsers: TestFixture<TestUser[]>;
  regularUsers: TestFixture<TestUser[]>;
}

export interface ResourceFixtures {
  validResources: TestFixture<TestResource[]>;
  invalidResources: TestFixture<TestResource[]>;
  popularResources: TestFixture<TestResource[]>;
}

export interface TestContext {
  testId: string;
  environment: string;
  startTime: Date;
  userData: Map<string, any>;
  cleanup: (() => Promise<void>)[];
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface TestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
  results: TestResult[];
  performance: PerformanceMetrics;
  environment: string;
  timestamp: Date;
}

export interface ValidationRule<T = any> {
  field: keyof T;
  rule: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CleanupTask {
  id: string;
  description: string;
  execute: () => Promise<void>;
  priority: number;
}

export interface MockResponse<T = any> {
  status: number;
  data: T;
  headers?: Record<string, string>;
  delay?: number;
}

export interface MockConfig {
  enabled: boolean;
  responses: Map<string, MockResponse>;
  defaultDelay: number;
}

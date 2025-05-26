/**
 * Test Types and Interfaces
 * Type definitions for test data, fixtures, and test utilities
 */

import { User, Resource } from './api.types';

// Test Data Types
export interface TestUser extends Omit<User, 'id'> {
  password?: string;
  confirmPassword?: string;
}

export interface TestResource extends Omit<Resource, 'id'> {
  description?: string;
}

// Test Case Metadata
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

// Test Result Types
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

// Test Data Factory Types
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

// Test Fixture Types
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

// Test Context Types
export interface TestContext {
  testId: string;
  environment: string;
  startTime: Date;
  userData: Map<string, any>;
  cleanup: (() => Promise<void>)[];
}

// Performance Metrics
export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

// Test Report Types
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

// Data Validation Types
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

// Test Cleanup Types
export interface CleanupTask {
  id: string;
  description: string;
  execute: () => Promise<void>;
  priority: number;
}

// Mock Data Types
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

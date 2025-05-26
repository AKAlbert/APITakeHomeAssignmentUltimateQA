/**
 * Configuration Types
 * Type definitions for environment configuration and test settings
 */

// Environment Types
export type Environment = 'development' | 'staging' | 'production' | 'local';

// Log Levels
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

// Test Environment Configuration
export interface EnvironmentConfig {
  name: Environment;
  baseURL: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

// Logger Configuration
export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'simple' | 'combined';
  filename?: string;
  maxSize?: string;
  maxFiles?: number;
  colorize?: boolean;
  timestamp?: boolean;
}

// Test Configuration
export interface TestConfig {
  parallel: boolean;
  workers: number;
  retries: number;
  timeout: number;
  reporter: string[];
  outputDir: string;
  screenshotMode: 'off' | 'only-on-failure' | 'on';
  videoMode: 'off' | 'on' | 'retain-on-failure';
  traceMode: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';
}

// Database Configuration (if needed for test data)
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

// Framework Configuration
export interface FrameworkConfig {
  environment: EnvironmentConfig;
  logger: LoggerConfig;
  test: TestConfig;
  database?: DatabaseConfig;
}

// Environment Variables Interface
export interface EnvironmentVariables {
  NODE_ENV?: Environment;
  API_BASE_URL?: string;
  API_KEY?: string;
  LOG_LEVEL?: LogLevel;
  TEST_TIMEOUT?: string;
  TEST_RETRIES?: string;
  TEST_WORKERS?: string;
  DATABASE_URL?: string;
  CI?: string;
}

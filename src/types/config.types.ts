export type Environment = 'development' | 'staging' | 'production' | 'local';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';
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

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'simple' | 'combined';
  filename?: string;
  maxSize?: string;
  maxFiles?: number;
  colorize?: boolean;
  timestamp?: boolean;
}

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

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface FrameworkConfig {
  environment: EnvironmentConfig;
  logger: LoggerConfig;
  test: TestConfig;
  database?: DatabaseConfig;
}

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

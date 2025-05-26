/**
 * Test Configuration
 * Configuration settings for test execution and reporting
 */

import { TestConfig } from '@/types';
import { getCurrentEnvironment } from './environment.config';

/**
 * Default test configurations for different environments
 */
const testConfigs: Record<string, TestConfig> = {
  development: {
    parallel: true,
    workers: 2,
    retries: 1,
    timeout: 30000,
    reporter: ['html', 'json'],
    outputDir: 'test-results',
    screenshotMode: 'only-on-failure',
    videoMode: 'retain-on-failure',
    traceMode: 'on-first-retry'
  },

  staging: {
    parallel: true,
    workers: 4,
    retries: 2,
    timeout: 20000,
    reporter: ['html', 'json', 'junit'],
    outputDir: 'test-results',
    screenshotMode: 'only-on-failure',
    videoMode: 'retain-on-failure',
    traceMode: 'retain-on-failure'
  },

  production: {
    parallel: true,
    workers: 6,
    retries: 3,
    timeout: 15000,
    reporter: ['html', 'json', 'junit'],
    outputDir: 'test-results',
    screenshotMode: 'only-on-failure',
    videoMode: 'off',
    traceMode: 'retain-on-failure'
  },

  local: {
    parallel: false,
    workers: 1,
    retries: 0,
    timeout: 60000,
    reporter: ['list', 'html'],
    outputDir: 'test-results',
    screenshotMode: 'on',
    videoMode: 'on',
    traceMode: 'on'
  }
};

/**
 * Get test configuration for current environment
 */
export const getTestConfig = (): TestConfig => {
  const environment = getCurrentEnvironment();
  const config = testConfigs[environment];

  if (!config) {
    return testConfigs.development;
  }

  // Override with environment variables if provided
  const envVars = {
    workers: process.env.TEST_WORKERS ? parseInt(process.env.TEST_WORKERS) : undefined,
    retries: process.env.TEST_RETRIES ? parseInt(process.env.TEST_RETRIES) : undefined,
    timeout: process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT) : undefined,
    parallel: process.env.CI ? false : undefined // Disable parallel in CI if needed
  };

  return {
    ...config,
    ...(envVars.workers && { workers: envVars.workers }),
    ...(envVars.retries !== undefined && { retries: envVars.retries }),
    ...(envVars.timeout && { timeout: envVars.timeout }),
    ...(envVars.parallel !== undefined && { parallel: envVars.parallel })
  };
};

/**
 * Get reporter configuration based on environment
 */
export const getReporterConfig = (): any[] => {
  const config = getTestConfig();
  const environment = getCurrentEnvironment();

  const reporters: any[] = [];

  // Always include basic reporters
  if (config.reporter.includes('html')) {
    reporters.push(['html', {
      outputFolder: 'playwright-report',
      open: environment === 'local' ? 'always' : 'never'
    }]);
  }

  if (config.reporter.includes('json')) {
    reporters.push(['json', {
      outputFile: `${config.outputDir}/results.json`
    }]);
  }

  if (config.reporter.includes('junit')) {
    reporters.push(['junit', {
      outputFile: `${config.outputDir}/junit.xml`
    }]);
  }

  if (config.reporter.includes('list')) {
    reporters.push(['list']);
  }

  return reporters;
};

/**
 * Validate test configuration
 */
export const validateTestConfig = (config: TestConfig): boolean => {
  if (config.workers <= 0) {
    throw new Error('Workers must be greater than 0');
  }

  if (config.retries < 0) {
    throw new Error('Retries must be 0 or greater');
  }

  if (config.timeout <= 0) {
    throw new Error('Timeout must be greater than 0');
  }

  const validScreenshotModes = ['off', 'only-on-failure', 'on'];
  if (!validScreenshotModes.includes(config.screenshotMode)) {
    throw new Error(`Invalid screenshot mode: ${config.screenshotMode}`);
  }

  const validVideoModes = ['off', 'on', 'retain-on-failure'];
  if (!validVideoModes.includes(config.videoMode)) {
    throw new Error(`Invalid video mode: ${config.videoMode}`);
  }

  const validTraceModes = ['off', 'on', 'retain-on-failure', 'on-first-retry'];
  if (!validTraceModes.includes(config.traceMode)) {
    throw new Error(`Invalid trace mode: ${config.traceMode}`);
  }

  return true;
};

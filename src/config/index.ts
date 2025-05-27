export * from './environment.config';
export * from './logger.config';
export * from './test.config';
import { FrameworkConfig } from '@/types';
import { getEnvironmentConfig } from './environment.config';
import { getLoggerConfig } from './logger.config';
import { getTestConfig } from './test.config';

export const getFrameworkConfig = (): FrameworkConfig => {
  return {
    environment: getEnvironmentConfig(),
    logger: getLoggerConfig(),
    test: getTestConfig()
  };
};

// Initialize and validate framework configuration
export const initializeConfig = (): FrameworkConfig => {
  const config = getFrameworkConfig();

  try {
    const { validateEnvironmentConfig } = require('./environment.config');
    const { validateTestConfig } = require('./test.config');

    validateEnvironmentConfig(config.environment);
    validateTestConfig(config.test);

    console.log(`Configuration initialized for environment: ${config.environment.name}`);
    return config;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw error;
  }
};

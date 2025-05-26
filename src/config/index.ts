/**
 * Configuration Index
 * Central export point for all configuration modules
 */

// Environment Configuration
export * from './environment.config';

// Logger Configuration
export * from './logger.config';

// Test Configuration
export * from './test.config';

// Framework Configuration Factory
import { FrameworkConfig } from '@/types';
import { getEnvironmentConfig } from './environment.config';
import { getLoggerConfig } from './logger.config';
import { getTestConfig } from './test.config';

/**
 * Get complete framework configuration
 */
export const getFrameworkConfig = (): FrameworkConfig => {
  return {
    environment: getEnvironmentConfig(),
    logger: getLoggerConfig(),
    test: getTestConfig()
  };
};

/**
 * Initialize and validate all configurations
 */
export const initializeConfig = (): FrameworkConfig => {
  const config = getFrameworkConfig();
  
  // Validate configurations
  try {
    const { validateEnvironmentConfig } = require('./environment.config');
    const { validateTestConfig } = require('./test.config');
    
    validateEnvironmentConfig(config.environment);
    validateTestConfig(config.test);
    
    console.log(`✅ Configuration initialized for environment: ${config.environment.name}`);
    return config;
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    throw error;
  }
};

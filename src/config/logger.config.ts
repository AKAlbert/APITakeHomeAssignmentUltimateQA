/**
 * Logger Configuration
 * Centralized logging configuration for the testing framework
 */

import { LogLevel, LoggerConfig } from '@/types';
import { getCurrentEnvironment } from './environment.config';

/**
 * Default logger configurations for different environments
 */
const loggerConfigs: Record<string, LoggerConfig> = {
  development: {
    level: 'debug',
    format: 'simple',
    colorize: true,
    timestamp: true,
    filename: 'logs/development.log',
    maxSize: '10m',
    maxFiles: 5
  },

  staging: {
    level: 'info',
    format: 'json',
    colorize: false,
    timestamp: true,
    filename: 'logs/staging.log',
    maxSize: '50m',
    maxFiles: 10
  },

  production: {
    level: 'warn',
    format: 'json',
    colorize: false,
    timestamp: true,
    filename: 'logs/production.log',
    maxSize: '100m',
    maxFiles: 20
  },

  local: {
    level: 'verbose',
    format: 'simple',
    colorize: true,
    timestamp: true,
    filename: 'logs/local.log',
    maxSize: '5m',
    maxFiles: 3
  }
};

/**
 * Get logger configuration for current environment
 */
export const getLoggerConfig = (): LoggerConfig => {
  const environment = getCurrentEnvironment();
  const config = loggerConfigs[environment];
  
  if (!config) {
    return loggerConfigs.development;
  }

  // Override with environment variable if provided
  const envLogLevel = process.env.LOG_LEVEL as LogLevel;
  if (envLogLevel && isValidLogLevel(envLogLevel)) {
    config.level = envLogLevel;
  }

  return config;
};

/**
 * Validate log level
 */
export const isValidLogLevel = (level: string): level is LogLevel => {
  const validLevels: LogLevel[] = ['error', 'warn', 'info', 'debug', 'verbose'];
  return validLevels.includes(level as LogLevel);
};

/**
 * Get log levels in order of severity
 */
export const getLogLevels = (): LogLevel[] => {
  return ['error', 'warn', 'info', 'debug', 'verbose'];
};

/**
 * Check if a log level should be logged based on current configuration
 */
export const shouldLog = (messageLevel: LogLevel, configLevel: LogLevel): boolean => {
  const levels = getLogLevels();
  const messageLevelIndex = levels.indexOf(messageLevel);
  const configLevelIndex = levels.indexOf(configLevel);
  
  return messageLevelIndex <= configLevelIndex;
};

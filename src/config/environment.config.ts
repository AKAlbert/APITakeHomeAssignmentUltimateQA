import * as dotenv from 'dotenv';
import { Environment, EnvironmentConfig, EnvironmentVariables } from '@/types';

dotenv.config();

export const getEnvVars = (): EnvironmentVariables => {
  return {
    NODE_ENV: (process.env.NODE_ENV as Environment) || 'development',
    API_BASE_URL: process.env.API_BASE_URL,
    API_KEY: process.env.API_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL as any,
    TEST_TIMEOUT: process.env.TEST_TIMEOUT,
    TEST_RETRIES: process.env.TEST_RETRIES,
    TEST_WORKERS: process.env.TEST_WORKERS,
    DATABASE_URL: process.env.DATABASE_URL,
    CI: process.env.CI
  };
};


const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    name: 'development',
    baseURL: 'https://reqres.in',
    timeout: 30000,
    retries: 1,
    retryDelay: 1000,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    rateLimit: {
      requests: 100,
      window: 60000
    }
  },

  staging: {
    name: 'staging',
    baseURL: 'https://staging-api.reqres.in',
    timeout: 20000,
    retries: 2,
    retryDelay: 2000,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    rateLimit: {
      requests: 200,
      window: 60000
    }
  },

  production: {
    name: 'production',
    baseURL: 'https://api.reqres.in',
    timeout: 15000,
    retries: 3,
    retryDelay: 3000,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    rateLimit: {
      requests: 500,
      window: 60000
    }
  },

  local: {
    name: 'local',
    baseURL: 'http://localhost:3000',
    timeout: 10000,
    retries: 0,
    retryDelay: 500,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
};

export const getCurrentEnvironment = (): Environment => {
  const envVars = getEnvVars();
  return envVars.NODE_ENV || 'development';
};

export const getEnvironmentConfig = (env?: Environment): EnvironmentConfig => {
  const environment = env || getCurrentEnvironment();
  const config = environments[environment];

  if (!config) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  const envVars = getEnvVars();

  return {
    ...config,
    baseURL: envVars.API_BASE_URL || config.baseURL,
    apiKey: envVars.API_KEY || config.apiKey,
    timeout: envVars.TEST_TIMEOUT ? parseInt(envVars.TEST_TIMEOUT) : config.timeout,
    retries: envVars.TEST_RETRIES ? parseInt(envVars.TEST_RETRIES) : config.retries,
    headers: {
      ...config.headers,
      ...(envVars.API_KEY && { 'x-api-key': envVars.API_KEY })
    }
  };
};

export const validateEnvironmentConfig = (config: EnvironmentConfig): boolean => {
  const requiredFields = ['name', 'baseURL', 'timeout', 'retries', 'retryDelay'];

  for (const field of requiredFields) {
    if (!config[field as keyof EnvironmentConfig]) {
      throw new Error(`Missing required configuration field: ${field}`);
    }
  }

  try {
    new URL(config.baseURL);
  } catch {
    throw new Error(`Invalid baseURL format: ${config.baseURL}`);
  }

  if (config.timeout <= 0) {
    throw new Error('Timeout must be greater than 0');
  }

  if (config.retries < 0) {
    throw new Error('Retries must be 0 or greater');
  }

  if (config.retryDelay < 0) {
    throw new Error('Retry delay must be 0 or greater');
  }

  return true;
};

export const getAvailableEnvironments = (): Environment[] => {
  return Object.keys(environments) as Environment[];
};

export const isValidEnvironment = (env: string): env is Environment => {
  return getAvailableEnvironments().includes(env as Environment);
};

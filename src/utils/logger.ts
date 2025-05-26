import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { LogLevel, LoggerConfig } from '@/types';
import { getLoggerConfig } from '@/config';

export class Logger {
  private winston: winston.Logger;
  private config: LoggerConfig;
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
    this.config = getLoggerConfig();
    this.winston = this.createWinstonLogger();
  }

  private createWinstonLogger(): winston.Logger {
    if (this.config.filename) {
      const logDir = path.dirname(this.config.filename);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }

    const formats: any[] = [];

    if (this.config.timestamp) {
      formats.push(winston.format.timestamp());
    }

    if (this.config.colorize) {
      formats.push(winston.format.colorize());
    }

    if (this.config.format === 'json') {
      formats.push(winston.format.json());
    } else {
      formats.push(winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ts = timestamp ? `[${timestamp}] ` : '';
        const ctx = context ? `[${context}] ` : '';
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `${ts}${level}: ${ctx}${message}${metaStr}`;
      }));
    }

    const transports: winston.transport[] = [
      new winston.transports.Console({
        level: this.config.level,
        format: winston.format.combine(...formats)
      })
    ];

    if (this.config.filename) {
      transports.push(
        new winston.transports.File({
          filename: this.config.filename,
          level: this.config.level,
          format: winston.format.combine(
            winston.format.timestamp(),
            this.config.format === 'json'
              ? winston.format.json()
              : winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                  const ctx = context ? `[${context}] ` : '';
                  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
                  return `[${timestamp}] ${level}: ${ctx}${message}${metaStr}`;
                })
          ),
          maxsize: this.parseSize(this.config.maxSize || '10m'),
          maxFiles: this.config.maxFiles || 5
        })
      );
    }

    return winston.createLogger({
      level: this.config.level,
      transports,
      exitOnError: false
    });
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = {
      'b': 1,
      'k': 1024,
      'm': 1024 * 1024,
      'g': 1024 * 1024 * 1024
    };

    const match = size.toLowerCase().match(/^(\d+)([bkmg]?)$/);
    if (!match) {
      return 10 * 1024 * 1024;
    }

    const [, num, unit] = match;
    return parseInt(num) * (units[unit] || 1);
  }

  error(message: string, meta?: any): void {
    this.winston.error(message, { context: this.context, ...meta });
  }

  warn(message: string, meta?: any): void {
    this.winston.warn(message, { context: this.context, ...meta });
  }

  info(message: string, meta?: any): void {
    this.winston.info(message, { context: this.context, ...meta });
  }

  debug(message: string, meta?: any): void {
    this.winston.debug(message, { context: this.context, ...meta });
  }

  verbose(message: string, meta?: any): void {
    this.winston.verbose(message, { context: this.context, ...meta });
  }

  log(level: LogLevel, message: string, meta?: any): void {
    this.winston.log(level, message, { context: this.context, ...meta });
  }

  child(context: string): Logger {
    const childLogger = new Logger(context);
    return childLogger;
  }

  // Log API request with structured data for debugging
  logRequest(method: string, url: string, data?: any, headers?: Record<string, string>): void {
    this.info(`API Request: ${method} ${url}`, {
      method,
      url,
      data: data ? JSON.stringify(data) : undefined,
      headers
    });
  }

  logResponse(method: string, url: string, status: number, data?: any, duration?: number): void {
    this.info(`API Response: ${method} ${url} - ${status}`, {
      method,
      url,
      status,
      data: data ? JSON.stringify(data) : undefined,
      duration: duration ? `${duration}ms` : undefined
    });
  }

  logTestStart(testName: string, metadata?: any): void {
    this.info(`Test Started: ${testName}`, {
      test: testName,
      ...metadata
    });
  }

  logTestEnd(testName: string, status: 'passed' | 'failed' | 'skipped', duration?: number, error?: string): void {
    const level = status === 'failed' ? 'error' : 'info';
    this.log(level, `Test ${status.toUpperCase()}: ${testName}`, {
      test: testName,
      status,
      duration: duration ? `${duration}ms` : undefined,
      error
    });
  }

  logPerformance(operation: string, duration: number, metadata?: any): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...metadata
    });
  }
}

export * from './circuit-breaker';
export * from './test-data-loader';

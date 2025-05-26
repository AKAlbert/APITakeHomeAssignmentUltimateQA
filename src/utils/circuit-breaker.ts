export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  expectedErrors?: string[];
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  consecutiveFailures: number;
  lastFailureTime?: Date;
  state: CircuitState;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private nextAttempt: Date;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      ...config,
      failureThreshold: config.failureThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 60000,
      monitoringPeriod: config.monitoringPeriod || 10000,
      expectedErrors: config.expectedErrors || ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND']
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      consecutiveFailures: 0,
      state: CircuitState.CLOSED
    };

    this.nextAttempt = new Date();
  }

  // Execute function with circuit breaker protection
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.metrics.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt.getTime()) {
        throw new Error(`Circuit breaker is OPEN. Next attempt allowed at ${this.nextAttempt.toISOString()}`);
      } else {
        this.metrics.state = CircuitState.HALF_OPEN;
      }
    }

    this.metrics.totalRequests++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.metrics.successfulRequests++;
    this.metrics.consecutiveFailures = 0;

    if (this.metrics.state === CircuitState.HALF_OPEN) {
      this.metrics.state = CircuitState.CLOSED;
    }
  }

  private onFailure(error: Error): void {
    this.metrics.failedRequests++;
    this.metrics.consecutiveFailures++;
    this.metrics.lastFailureTime = new Date();

    const isExpectedError = this.config.expectedErrors?.some(expectedError =>
      error.message.includes(expectedError) || error.name.includes(expectedError)
    );

    if (isExpectedError && this.metrics.consecutiveFailures >= this.config.failureThreshold) {
      this.metrics.state = CircuitState.OPEN;
      this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
    }
  }

  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  getState(): CircuitState {
    return this.metrics.state;
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      consecutiveFailures: 0,
      state: CircuitState.CLOSED
    };
    this.nextAttempt = new Date();
  }

  forceOpen(): void {
    this.metrics.state = CircuitState.OPEN;
    this.nextAttempt = new Date(Date.now() + this.config.recoveryTimeout);
  }

  forceClosed(): void {
    this.metrics.state = CircuitState.CLOSED;
    this.metrics.consecutiveFailures = 0;
  }

  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 100;
    return (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
  }

  // Check if circuit breaker is healthy (closed state with good success rate)
  isHealthy(): boolean {
    return this.metrics.state === CircuitState.CLOSED && this.getSuccessRate() > 80;
  }
}

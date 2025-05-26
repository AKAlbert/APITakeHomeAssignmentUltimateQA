export * from './users.fixture';

export * from './resources.fixture';
export * from './api-responses.fixture';
import { TestFixture, MockResponse } from '@/types';
import { Logger } from '@/utils/logger';

// Manages test fixtures and mock data for consistent test scenarios
export class FixtureManager {
  private logger: Logger;
  private fixtures: Map<string, TestFixture>;
  private mockResponses: Map<string, MockResponse>;

  constructor() {
    this.logger = new Logger('FixtureManager');
    this.fixtures = new Map();
    this.mockResponses = new Map();
  }

  registerFixture<T>(fixture: TestFixture<T>): void {
    this.fixtures.set(fixture.name, fixture);
    this.logger.debug('Registered fixture', {
      name: fixture.name,
      description: fixture.description,
      tags: fixture.tags
    });
  }

  getFixture<T>(name: string): TestFixture<T> | undefined {
    return this.fixtures.get(name) as TestFixture<T>;
  }

  getFixturesByTag<T>(tag: string): TestFixture<T>[] {
    const matchingFixtures: TestFixture<T>[] = [];

    for (const fixture of this.fixtures.values()) {
      if (fixture.tags?.includes(tag)) {
        matchingFixtures.push(fixture as TestFixture<T>);
      }
    }

    return matchingFixtures;
  }

  registerMockResponse(endpoint: string, response: MockResponse): void {
    this.mockResponses.set(endpoint, response);
    this.logger.debug('Registered mock response', {
      endpoint,
      status: response.status,
      delay: response.delay
    });
  }

  getMockResponse(endpoint: string): MockResponse | undefined {
    return this.mockResponses.get(endpoint);
  }

  listFixtures(): string[] {
    return Array.from(this.fixtures.keys());
  }

  listMockResponses(): string[] {
    return Array.from(this.mockResponses.keys());
  }

  clearFixtures(): void {
    this.fixtures.clear();
    this.logger.debug('Cleared all fixtures');
  }

  clearMockResponses(): void {
    this.mockResponses.clear();
    this.logger.debug('Cleared all mock responses');
  }

  // Get comprehensive statistics about loaded fixtures and mock responses
  getStatistics(): {
    totalFixtures: number;
    fixturesByTag: Record<string, number>;
    totalMockResponses: number;
  } {
    const fixturesByTag: Record<string, number> = {};

    for (const fixture of this.fixtures.values()) {
      if (fixture.tags) {
        for (const tag of fixture.tags) {
          fixturesByTag[tag] = (fixturesByTag[tag] || 0) + 1;
        }
      }
    }

    return {
      totalFixtures: this.fixtures.size,
      fixturesByTag,
      totalMockResponses: this.mockResponses.size
    };
  }
}

export { UserDataFactory } from './user.factory';
export { ResourceDataFactory } from './resource.factory';

import { UserDataFactory } from './user.factory';
import { ResourceDataFactory } from './resource.factory';
import { TestUser, TestResource, CleanupTask } from '@/types';
import { Logger } from '@/utils/logger';

// Manages test data creation, tracking, and cleanup across test scenarios
export class TestDataManager {
  private userFactory: UserDataFactory;
  private resourceFactory: ResourceDataFactory;
  private logger: Logger;
  private createdData: Map<string, any[]>;
  private cleanupTasks: CleanupTask[];

  constructor() {
    this.userFactory = new UserDataFactory();
    this.resourceFactory = new ResourceDataFactory();
    this.logger = new Logger('TestDataManager');
    this.createdData = new Map();
    this.cleanupTasks = [];
  }

  getUserFactory(): UserDataFactory {
    return this.userFactory;
  }

  getResourceFactory(): ResourceDataFactory {
    return this.resourceFactory;
  }

  createAndTrack<T>(
    type: 'user' | 'resource',
    factory: () => T,
    identifier?: string
  ): T {
    const data = factory();
    const key = identifier || type;

    if (!this.createdData.has(key)) {
      this.createdData.set(key, []);
    }

    this.createdData.get(key)!.push(data);
    this.logger.debug(`Created and tracked ${type} data`, { identifier: key });

    return data;
  }

  createTrackedUser(overrides?: Partial<TestUser>, identifier?: string): TestUser {
    return this.createAndTrack(
      'user',
      () => this.userFactory.createUser(overrides),
      identifier
    );
  }

  createTrackedResource(overrides?: Partial<TestResource>, identifier?: string): TestResource {
    return this.createAndTrack(
      'resource',
      () => this.resourceFactory.createResource(overrides),
      identifier
    );
  }

  getTrackedData<T>(identifier: string): T[] {
    return this.createdData.get(identifier) || [];
  }

  addCleanupTask(task: CleanupTask): void {
    this.cleanupTasks.push(task);
    this.logger.debug('Added cleanup task', { taskId: task.id, description: task.description });
  }

  // Execute cleanup tasks in priority order
  async cleanup(): Promise<void> {
    this.logger.info('Starting test data cleanup', { taskCount: this.cleanupTasks.length });

    const sortedTasks = this.cleanupTasks.sort((a, b) => b.priority - a.priority);

    for (const task of sortedTasks) {
      try {
        this.logger.debug('Executing cleanup task', { taskId: task.id });
        await task.execute();
        this.logger.debug('Cleanup task completed', { taskId: task.id });
      } catch (error) {
        this.logger.error('Cleanup task failed', {
          taskId: task.id,
          error: (error as Error).message
        });
      }
    }

    this.createdData.clear();
    this.cleanupTasks = [];

    this.logger.info('Test data cleanup completed');
  }

  clearTrackedData(): void {
    this.createdData.clear();
    this.logger.debug('Cleared tracked data');
  }

  getDataStatistics(): {
    totalTrackedItems: number;
    itemsByType: Record<string, number>;
    cleanupTasks: number;
  } {
    const itemsByType: Record<string, number> = {};
    let totalTrackedItems = 0;

    for (const [key, items] of this.createdData.entries()) {
      itemsByType[key] = items.length;
      totalTrackedItems += items.length;
    }

    return {
      totalTrackedItems,
      itemsByType,
      cleanupTasks: this.cleanupTasks.length
    };
  }

  getCleanupStats(): {
    totalTasks: number;
    tasksByPriority: Record<number, number>;
    pendingTasks: CleanupTask[];
  } {
    const tasksByPriority: Record<number, number> = {};

    for (const task of this.cleanupTasks) {
      tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    }

    return {
      totalTasks: this.cleanupTasks.length,
      tasksByPriority,
      pendingTasks: [...this.cleanupTasks]
    };
  }

  // Create predefined data sets for common test scenarios
  createScenarioDataSet(scenario: string): {
    users: TestUser[];
    resources: TestResource[];
  } {
    this.logger.info('Creating scenario data set', { scenario });

    const scenarioConfigs: Record<string, { userCount: number; resourceCount: number }> = {
      'small_dataset': { userCount: 5, resourceCount: 3 },
      'medium_dataset': { userCount: 20, resourceCount: 15 },
      'large_dataset': { userCount: 100, resourceCount: 50 },
      'pagination_test': { userCount: 25, resourceCount: 25 },
      'performance_test': { userCount: 500, resourceCount: 200 }
    };

    const config = scenarioConfigs[scenario] || scenarioConfigs['small_dataset'];

    const users = this.userFactory.createUsers(config.userCount);
    const resources = this.resourceFactory.createResources(config.resourceCount);

    this.createdData.set(`${scenario}_users`, users);
    this.createdData.set(`${scenario}_resources`, resources);

    this.logger.info('Scenario data set created', {
      scenario,
      userCount: users.length,
      resourceCount: resources.length
    });

    return { users, resources };
  }

  // Create comprehensive test data for API validation scenarios
  createApiTestData(): {
    validUsers: TestUser[];
    invalidUsers: TestUser[];
    edgeCaseUsers: TestUser[];
    validResources: TestResource[];
    invalidResources: TestResource[];
    edgeCaseResources: TestResource[];
  } {
    this.logger.info('Creating comprehensive API test data');

    const data = {
      validUsers: [
        this.userFactory.createValidUser(),
        this.userFactory.createRealisticUser(),
        this.userFactory.createUserWithDomain('example.com')
      ],
      invalidUsers: [
        this.userFactory.createInvalidUser(),
        this.userFactory.createUser({ email: '', password: '' })
      ],
      edgeCaseUsers: [
        this.userFactory.createEdgeCaseUser('long_name'),
        this.userFactory.createEdgeCaseUser('special_chars'),
        this.userFactory.createEdgeCaseUser('unicode'),
        this.userFactory.createEdgeCaseUser('minimal')
      ],
      validResources: [
        this.resourceFactory.createValidResource(),
        this.resourceFactory.createRealisticResource(),
        this.resourceFactory.createModernResource()
      ],
      invalidResources: [
        this.resourceFactory.createInvalidResource(),
        this.resourceFactory.createResource({ name: '', color: '' })
      ],
      edgeCaseResources: [
        this.resourceFactory.createEdgeCaseResource('long_name'),
        this.resourceFactory.createEdgeCaseResource('special_chars'),
        this.resourceFactory.createEdgeCaseResource('unicode'),
        this.resourceFactory.createEdgeCaseResource('minimal')
      ]
    };

    Object.entries(data).forEach(([key, items]) => {
      this.createdData.set(key, items);
    });

    this.logger.info('API test data created', {
      validUsers: data.validUsers.length,
      invalidUsers: data.invalidUsers.length,
      edgeCaseUsers: data.edgeCaseUsers.length,
      validResources: data.validResources.length,
      invalidResources: data.invalidResources.length,
      edgeCaseResources: data.edgeCaseResources.length
    });

    return data;
  }
}

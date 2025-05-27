import { faker } from '@faker-js/faker';
import { TestUser, UserFactory, CreateUserRequest } from '@/types';

export class UserDataFactory implements UserFactory {
  createUser(overrides?: Partial<TestUser>): TestUser {
    const user: TestUser = {
      email: faker.internet.email(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      name: faker.person.fullName(),
      job: faker.person.jobTitle(),
      avatar: faker.image.avatar(),
      password: faker.internet.password({ length: 12 }),
      ...overrides
    };

    if (!overrides?.name && user.first_name && user.last_name) {
      user.name = `${user.first_name} ${user.last_name}`;
    }

    return user;
  }

  createUsers(count: number, overrides?: Partial<TestUser>): TestUser[] {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  createValidUser(): TestUser {
    return this.createUser({
      email: faker.internet.email(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      job: faker.person.jobTitle(),
      password: 'ValidPassword123!'
    });
  }

  // Create user with invalid data for negative testing
  createInvalidUser(): TestUser {
    return this.createUser({
      email: 'invalid-email',
      first_name: '',
      last_name: '',
      name: '',
      job: '',
      password: '123'
    });
  }

  createUserForCreation(overrides?: Partial<CreateUserRequest>): CreateUserRequest {
    return {
      name: faker.person.fullName(),
      job: faker.person.jobTitle(),
      ...overrides
    };
  }

  createAdminUser(): TestUser {
    return this.createUser({
      email: 'admin@example.com',
      first_name: 'Admin',
      last_name: 'User',
      name: 'Admin User',
      job: 'System Administrator',
      password: 'AdminPassword123!'
    });
  }

  createUserWithDomain(domain: string): TestUser {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return this.createUser({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`
    });
  }

  createUserWithJobCategory(category: 'engineering' | 'marketing' | 'sales' | 'hr' | 'finance'): TestUser {
    const jobsByCategory = {
      engineering: ['Software Engineer', 'DevOps Engineer', 'QA Engineer', 'Data Engineer', 'Frontend Developer'],
      marketing: ['Marketing Manager', 'Content Creator', 'SEO Specialist', 'Brand Manager', 'Digital Marketer'],
      sales: ['Sales Representative', 'Account Manager', 'Sales Director', 'Business Development', 'Sales Coordinator'],
      hr: ['HR Manager', 'Recruiter', 'HR Coordinator', 'People Operations', 'Talent Acquisition'],
      finance: ['Financial Analyst', 'Accountant', 'Finance Manager', 'Controller', 'Budget Analyst']
    };

    const jobs = jobsByCategory[category];
    const randomJob = jobs[Math.floor(Math.random() * jobs.length)];

    return this.createUser({
      job: randomJob
    });
  }

  createRealisticUser(): TestUser {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const domain = faker.helpers.arrayElement(['gmail.com', 'yahoo.com', 'outlook.com', 'company.com']);

    return this.createUser({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`,
      job: faker.person.jobTitle(),
      password: this.generateSecurePassword()
    });
  }

  createBulkUsers(count: number): CreateUserRequest[] {
    return Array.from({ length: count }, () => this.createUserForCreation());
  }

  // Create users with edge case data for boundary testing
  createEdgeCaseUser(type: 'long_name' | 'special_chars' | 'unicode' | 'minimal'): TestUser {
    switch (type) {
      case 'long_name':
        return this.createUser({
          name: 'A'.repeat(100),
          job: 'B'.repeat(100),
          first_name: 'C'.repeat(50),
          last_name: 'D'.repeat(50)
        });

      case 'special_chars':
        return this.createUser({
          name: "John O'Connor-Smith Jr.",
          job: "Senior Software Engineer & Team Lead",
          first_name: "John",
          last_name: "O'Connor-Smith"
        });

      case 'unicode':
        return this.createUser({
          name: "José María García-López",
          job: "Développeur Senior",
          first_name: "José María",
          last_name: "García-López"
        });

      case 'minimal':
        return this.createUser({
          name: "A",
          job: "B",
          first_name: "A",
          last_name: "B"
        });

      default:
        return this.createValidUser();
    }
  }

  private generateSecurePassword(): string {
    const lowercase = faker.string.alpha({ length: 3, casing: 'lower' });
    const uppercase = faker.string.alpha({ length: 3, casing: 'upper' });
    const numbers = faker.string.numeric(3);
    const symbols = faker.helpers.arrayElement(['!', '@', '#', '$', '%']);

    return faker.helpers.shuffle([lowercase, uppercase, numbers, symbols].join('').split('')).join('');
  }

  // Create users for specific API test scenarios (reqres.in compatible)
  createUserForScenario(scenario: string): TestUser {
    const scenarios: Record<string, Partial<TestUser>> = {
      'login_success': {
        email: 'eve.holt@reqres.in',
        password: 'cityslicka'
      },
      'login_failure': {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      },
      'register_success': {
        email: 'eve.holt@reqres.in',
        password: 'pistol'
      },
      'register_failure': {
        email: 'sydney@fife',
        password: 'pistol'
      }
    };

    const scenarioData = scenarios[scenario] || {};
    return this.createUser(scenarioData);
  }
}

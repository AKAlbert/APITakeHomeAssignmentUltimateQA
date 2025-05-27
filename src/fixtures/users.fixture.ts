import { TestUser, UserFixtures, TestFixture } from '@/types';

export const validUsers: TestFixture<TestUser[]> = {
  name: 'validUsers',
  description: 'Collection of valid user data for positive testing',
  tags: ['positive', 'valid', 'users'],
  data: [
    {
      email: 'eve.holt@reqres.in',
      first_name: 'Eve',
      last_name: 'Holt',
      name: 'Eve Holt',
      job: 'Software Engineer',
      avatar: 'https://reqres.in/img/faces/4-image.jpg',
      password: process.env.TEST_USER_PASSWORD || 'test-password'
    },
    {
      email: 'charles.morris@reqres.in',
      first_name: 'Charles',
      last_name: 'Morris',
      name: 'Charles Morris',
      job: 'Product Manager',
      avatar: 'https://reqres.in/img/faces/5-image.jpg',
      password: process.env.TEST_USER_PASSWORD || 'test-password'
    },
    {
      email: 'tracey.ramos@reqres.in',
      first_name: 'Tracey',
      last_name: 'Ramos',
      name: 'Tracey Ramos',
      job: 'UX Designer',
      avatar: 'https://reqres.in/img/faces/6-image.jpg',
      password: process.env.TEST_USER_PASSWORD || 'test-password'
    }
  ]
};

export const invalidUsers: TestFixture<TestUser[]> = {
  name: 'invalidUsers',
  description: 'Collection of invalid user data for negative testing',
  tags: ['negative', 'invalid', 'users'],
  data: [
    {
      email: 'invalid-email',
      first_name: '',
      last_name: '',
      name: '',
      job: '',
      password: process.env.TEST_INVALID_PASSWORD_SHORT || 'inv'
    },
    {
      email: '',
      first_name: 'John',
      last_name: 'Doe',
      name: 'John Doe',
      job: 'Developer',
      password: ''
    },
    {
      email: 'test@',
      first_name: 'Jane',
      last_name: '',
      name: 'Jane',
      job: 'A'.repeat(101),
      password: process.env.TEST_INVALID_PASSWORD_SHORT || 'inv'
    }
  ]
};

export const adminUsers: TestFixture<TestUser[]> = {
  name: 'adminUsers',
  description: 'Collection of admin user data for privileged operations',
  tags: ['admin', 'privileged', 'users'],
  data: [
    {
      email: 'admin@reqres.in',
      first_name: 'Admin',
      last_name: 'User',
      name: 'Admin User',
      job: 'System Administrator',
      avatar: 'https://reqres.in/img/faces/admin.jpg',
      password: process.env.TEST_ADMIN_PASSWORD || 'admin-test-password'
    },
    {
      email: 'superadmin@reqres.in',
      first_name: 'Super',
      last_name: 'Admin',
      name: 'Super Admin',
      job: 'Super Administrator',
      avatar: 'https://reqres.in/img/faces/superadmin.jpg',
      password: process.env.TEST_ADMIN_PASSWORD || 'admin-test-password'
    }
  ]
};

export const regularUsers: TestFixture<TestUser[]> = {
  name: 'regularUsers',
  description: 'Collection of regular user data for standard operations',
  tags: ['regular', 'standard', 'users'],
  data: [
    {
      email: 'george.bluth@reqres.in',
      first_name: 'George',
      last_name: 'Bluth',
      name: 'George Bluth',
      job: 'Business Analyst',
      avatar: 'https://reqres.in/img/faces/1-image.jpg',
      password: process.env.TEST_USER_PASSWORD || 'test-password'
    },
    {
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
      name: 'Janet Weaver',
      job: 'Marketing Specialist',
      avatar: 'https://reqres.in/img/faces/2-image.jpg',
      password: process.env.TEST_USER_PASSWORD || 'test-password'
    },
    {
      email: 'emma.wong@reqres.in',
      first_name: 'Emma',
      last_name: 'Wong',
      name: 'Emma Wong',
      job: 'Data Scientist',
      avatar: 'https://reqres.in/img/faces/3-image.jpg',
      password: process.env.TEST_USER_PASSWORD || 'test-password'
    }
  ]
};

export const edgeCaseUsers: TestFixture<TestUser[]> = {
  name: 'edgeCaseUsers',
  description: 'Collection of edge case user data for boundary testing',
  tags: ['edge-case', 'boundary', 'users'],
  data: [
    {
      email: 'a@b.co',
      first_name: 'A',
      last_name: 'B',
      name: 'A B',
      job: 'C',
      password: process.env.TEST_USER_PASSWORD || 'test-password'
    },
    {
      email: 'very.long.email.address.for.testing@very-long-domain-name-for-testing.com',
      first_name: 'VeryLongFirstNameForTesting',
      last_name: 'VeryLongLastNameForTesting',
      name: 'VeryLongFirstNameForTesting VeryLongLastNameForTesting',
      job: 'Very Long Job Title For Testing Purposes',
      password: process.env.TEST_USER_PASSWORD || 'test-password'
    },
    {
      email: 'unicode.test@example.com',
      first_name: 'José',
      last_name: 'García-López',
      name: 'José García-López',
      job: 'Développeur Senior',
      password: process.env.TEST_USER_PASSWORD || 'test-password'
    },
    {
      email: 'special.chars@example.com',
      first_name: "John",
      last_name: "O'Connor-Smith",
      name: "John O'Connor-Smith Jr.",
      job: "Senior Software Engineer & Team Lead",
      password: process.env.TEST_USER_PASSWORD || 'test-password'
    }
  ]
};

export const authTestUsers: TestFixture<TestUser[]> = {
  name: 'authTestUsers',
  description: 'Collection of user data specifically for authentication testing',
  tags: ['auth', 'login', 'register'],
  data: [
    {
      email: 'eve.holt@reqres.in',
      password: process.env.TEST_AUTH_PASSWORD || 'test-auth-password',
      name: 'Eve Holt',
      job: 'QA Engineer'
    },
    {
      email: 'eve.holt@reqres.in',
      password: process.env.TEST_AUTH_PASSWORD_ALT || 'test-auth-password-alt',
      name: 'Eve Holt',
      job: 'QA Engineer'
    },
    {
      email: 'sydney@fife',
      password: process.env.TEST_AUTH_PASSWORD_ALT || 'test-auth-password-alt',
      name: 'Sydney Fife',
      job: 'Developer'
    }
  ]
};

export const userFixtures: UserFixtures = {
  validUsers,
  invalidUsers,
  adminUsers,
  regularUsers
};

// Helper functions for working with user fixtures
export function getUserByEmail(email: string): TestUser | undefined {
  const allUsers = [
    ...validUsers.data,
    ...adminUsers.data,
    ...regularUsers.data,
    ...authTestUsers.data
  ];

  return allUsers.find(user => user.email === email);
}

export function getUsersByJob(job: string): TestUser[] {
  const allUsers = [
    ...validUsers.data,
    ...adminUsers.data,
    ...regularUsers.data
  ];

  return allUsers.filter(user => user.job?.toLowerCase().includes(job.toLowerCase()));
}

export function getRandomValidUser(): TestUser {
  const users = validUsers.data;
  return users[Math.floor(Math.random() * users.length)];
}

export function getRandomInvalidUser(): TestUser {
  const users = invalidUsers.data;
  return users[Math.floor(Math.random() * users.length)];
}

export function getUserForScenario(scenario: 'login_success' | 'login_failure' | 'register_success' | 'register_failure'): TestUser {
  const scenarioUsers: Record<string, TestUser> = {
    'login_success': authTestUsers.data[0],
    'login_failure': { email: 'invalid@example.com', password: process.env.TEST_INVALID_PASSWORD || 'invalid-password', name: 'Invalid User', job: 'None' },
    'register_success': authTestUsers.data[1],
    'register_failure': authTestUsers.data[2]
  };

  return scenarioUsers[scenario] || validUsers.data[0];
}

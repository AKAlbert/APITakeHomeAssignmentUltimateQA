import { TestUser, UserFixtures, TestFixture } from '@/types';

// gitguardian:ignore
/* eslint-disable-next-line */
// This file contains test fixture data with placeholder passwords for testing purposes only
// All actual passwords are loaded from environment variables
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
      password: process.env.TEST_USER_PASSWORD || process.env.DEFAULT_TEST_VALUE || '' // gitguardian:ignore
    },
    {
      email: 'charles.morris@reqres.in',
      first_name: 'Charles',
      last_name: 'Morris',
      name: 'Charles Morris',
      job: 'Product Manager',
      avatar: 'https://reqres.in/img/faces/5-image.jpg',
      password: process.env.TEST_USER_PASSWORD || 'placeholder' // gitguardian:ignore
    },
    {
      email: 'tracey.ramos@reqres.in',
      first_name: 'Tracey',
      last_name: 'Ramos',
      name: 'Tracey Ramos',
      job: 'UX Designer',
      avatar: 'https://reqres.in/img/faces/6-image.jpg',
      password: process.env.TEST_USER_PASSWORD || 'placeholder' // gitguardian:ignore
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
      password: process.env.TEST_INVALID_PASSWORD_SHORT || 'x' // gitguardian:ignore
    },
    {
      email: '',
      first_name: 'John',
      last_name: 'Doe',
      name: 'John Doe',
      job: 'Developer',
      password: '' // gitguardian:ignore
    },
    {
      email: 'test@',
      first_name: 'Jane',
      last_name: '',
      name: 'Jane',
      job: 'A'.repeat(101),
      password: process.env.TEST_INVALID_PASSWORD_SHORT || 'x' // gitguardian:ignore
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
      password: process.env.TEST_ADMIN_PASSWORD || 'placeholder' // gitguardian:ignore
    },
    {
      email: 'superadmin@reqres.in',
      first_name: 'Super',
      last_name: 'Admin',
      name: 'Super Admin',
      job: 'Super Administrator',
      avatar: 'https://reqres.in/img/faces/superadmin.jpg',
      password: process.env.TEST_ADMIN_PASSWORD || 'placeholder' // gitguardian:ignore
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
      password: process.env.TEST_USER_PASSWORD || 'placeholder' // gitguardian:ignore
    },
    {
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
      name: 'Janet Weaver',
      job: 'Marketing Specialist',
      avatar: 'https://reqres.in/img/faces/2-image.jpg',
      password: process.env.TEST_USER_PASSWORD || 'placeholder' // gitguardian:ignore
    },
    {
      email: 'emma.wong@reqres.in',
      first_name: 'Emma',
      last_name: 'Wong',
      name: 'Emma Wong',
      job: 'Data Scientist',
      avatar: 'https://reqres.in/img/faces/3-image.jpg',
      password: process.env.TEST_USER_PASSWORD || 'placeholder' // gitguardian:ignore
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
      password: process.env.TEST_USER_PASSWORD || 'placeholder' // gitguardian:ignore
    },
    {
      email: 'very.long.email.address.for.testing@very-long-domain-name-for-testing.com',
      first_name: 'VeryLongFirstNameForTesting',
      last_name: 'VeryLongLastNameForTesting',
      name: 'VeryLongFirstNameForTesting VeryLongLastNameForTesting',
      job: 'Very Long Job Title For Testing Purposes',
      password: process.env.TEST_USER_PASSWORD || 'placeholder' // gitguardian:ignore
    },
    {
      email: 'unicode.test@example.com',
      first_name: 'José',
      last_name: 'García-López',
      name: 'José García-López',
      job: 'Développeur Senior',
      password: process.env.TEST_USER_PASSWORD || 'placeholder' // gitguardian:ignore
    },
    {
      email: 'special.chars@example.com',
      first_name: "John",
      last_name: "O'Connor-Smith",
      name: "John O'Connor-Smith Jr.",
      job: "Senior Software Engineer & Team Lead",
      password: process.env.TEST_USER_PASSWORD || 'placeholder' // gitguardian:ignore
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
      password: process.env.TEST_AUTH_PASSWORD || 'placeholder', // gitguardian:ignore
      name: 'Eve Holt',
      job: 'QA Engineer'
    },
    {
      email: 'eve.holt@reqres.in',
      password: process.env.TEST_AUTH_PASSWORD_ALT || 'placeholder', // gitguardian:ignore
      name: 'Eve Holt',
      job: 'QA Engineer'
    },
    {
      email: 'sydney@fife',
      password: process.env.TEST_AUTH_PASSWORD_ALT || 'placeholder', // gitguardian:ignore
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
    'login_failure': { email: 'invalid@example.com', password: process.env.TEST_INVALID_PASSWORD || 'placeholder', name: 'Invalid User', job: 'None' }, // gitguardian:ignore
    'register_success': authTestUsers.data[1],
    'register_failure': authTestUsers.data[2]
  };

  return scenarioUsers[scenario] || validUsers.data[0];
}

import { faker } from '@faker-js/faker';
import { test, expect } from '@playwright/test';
import { getPOSTAPIRequestBody } from '../../utils/APIHelper';



test.describe('User CRUD Operations', () => {
  const name = faker.person.firstName();
  const job = faker.person.jobTitle();
  // const userId = 2;

  test('TC-FUN-01: Create User with Valid Payload', async ({ request }) => {
    const postAPIRequest = await getPOSTAPIRequestBody(name, job);
    const response = await request.post('/api/users', {
      data: postAPIRequest
    });
    console.log(response);

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeDefined();
    expect(body.name).toBe(name);
    expect(body.job).toBe(job);
  });

  // test('TC-FUN-02: Retrieve Created User', async ({ request }) => {
  //   const response = await request.get(`/api/users/${userId}`);

  //   expect(response.status()).toBe(200);
  //   const user: User = await response.json();
  //   expect(user.email).toBe(email);
  //   expect(user.first_name).toBe(first_name);
  // });

  // test('TC-FUN-03: Update User Information', async ({ request }) => {
  //   const updatedData = { job: 'Senior QA Engineer' };
  //   const response = await request.put(`/api/users/${userId}`, {
  //     data: updatedData
  //   });

  //   expect(response.status()).toBe(200);
  //   const body = await response.json();
  //   expect(body.job).toBe(updatedData.job);
  //   expect(new Date(body.updatedAt).getTime()).toBeLessThanOrEqual(Date.now());
  // });

  // test('TC-FUN-04: Delete User', async ({ request }) => {
  //   const response = await request.delete(`/api/users/${userId}`);
  //   expect(response.status()).toBe(204);

  //   // Verify deletion
  //   const getResponse = await request.get(`/api/users/${userId}`);
  //   expect(getResponse.status()).toBe(404);
  // });
});
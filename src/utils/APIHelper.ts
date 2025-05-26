/**
 * Legacy API Helper Functions
 * @deprecated Use the new API clients and data factories instead
 */

import { CreateUserRequest } from '@/types';

/**
 * @deprecated Use UserDataFactory.createUserForCreation() instead
 */
export async function getPOSTAPIRequestBody(name: string, job: string): Promise<CreateUserRequest> {
    const apiRequest: CreateUserRequest = {
        name: name,
        job: job
    };
    return apiRequest;
}

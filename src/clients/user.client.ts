import { APIRequestContext } from '@playwright/test';
import { BaseApiClient } from '@/core/base-api-client';
import {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UserListResponse,
  SingleUserResponse,
  PaginationParams,
  ApiResponse,
  ApiClientConfig
} from '@/types';

export class UserClient extends BaseApiClient {
  constructor(config: ApiClientConfig, requestContext?: APIRequestContext) {
    super(config, requestContext);
  }

  async getUsers(params?: PaginationParams): Promise<ApiResponse<UserListResponse>> {
    this.logger.info('Getting users list', { params });

    const response = await this.get<UserListResponse>('/api/users', params);

    this.logger.info('Users retrieved successfully', {
      count: response.data.data?.length || 0,
      page: response.data.page,
      totalPages: response.data.total_pages
    });

    return response;
  }

  async getUser(userId: number): Promise<ApiResponse<SingleUserResponse>> {
    this.logger.info('Getting user by ID', { userId });

    const response = await this.get<SingleUserResponse>(`/api/users/${userId}`);

    this.logger.info('User retrieved successfully', {
      userId,
      email: response.data.data.email,
      name: `${response.data.data.first_name} ${response.data.data.last_name}`
    });

    return response;
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<CreateUserResponse>> {
    this.logger.info('Creating new user', { userData });

    this.validateCreateUserRequest(userData);

    const response = await this.post<CreateUserResponse>('/api/users', userData);

    this.logger.info('User created successfully', {
      userId: response.data.id,
      name: response.data.name,
      job: response.data.job,
      createdAt: response.data.createdAt
    });

    return response;
  }

  async updateUser(userId: number, userData: UpdateUserRequest): Promise<ApiResponse<UpdateUserResponse>> {
    this.logger.info('Updating user', { userId, userData });

    if (!userId || userId <= 0) {
      throw new Error('Valid user ID is required for update operation');
    }

    const response = await this.put<UpdateUserResponse>(`/api/users/${userId}`, userData);

    this.logger.info('User updated successfully', {
      userId,
      updatedAt: response.data.updatedAt,
      changes: userData
    });

    return response;
  }

  async patchUser(userId: number, userData: Partial<UpdateUserRequest>): Promise<ApiResponse<UpdateUserResponse>> {
    this.logger.info('Partially updating user', { userId, userData });

    if (!userId || userId <= 0) {
      throw new Error('Valid user ID is required for patch operation');
    }

    const response = await this.patch<UpdateUserResponse>(`/api/users/${userId}`, userData);

    this.logger.info('User patched successfully', {
      userId,
      updatedAt: response.data.updatedAt,
      changes: userData
    });

    return response;
  }

  async deleteUser(userId: number): Promise<ApiResponse<void>> {
    this.logger.info('Deleting user', { userId });

    if (!userId || userId <= 0) {
      throw new Error('Valid user ID is required for delete operation');
    }

    const response = await this.delete<void>(`/api/users/${userId}`);

    this.logger.info('User deleted successfully', { userId });

    return response;
  }

  // Check if user exists by attempting to fetch them
  async userExists(userId: number): Promise<boolean> {
    try {
      await this.getUser(userId);
      return true;
    } catch (error) {
      if ((error as Error).message.includes('404')) {
        return false;
      }
      throw error;
    }
  }

  // Get users with delay for testing timeout scenarios
  async getUsersWithDelay(delay: number = 3, params?: PaginationParams): Promise<ApiResponse<UserListResponse>> {
    this.logger.info('Getting users with delay', { delay, params });

    const queryParams = { ...params, delay };
    return this.getUsers(queryParams);
  }

  private validateCreateUserRequest(userData: CreateUserRequest): void {
    if (!userData.name || userData.name.trim().length === 0) {
      throw new Error('User name is required and cannot be empty');
    }

    if (!userData.job || userData.job.trim().length === 0) {
      throw new Error('User job is required and cannot be empty');
    }

    if (userData.name.length > 100) {
      throw new Error('User name cannot exceed 100 characters');
    }

    if (userData.job.length > 100) {
      throw new Error('User job cannot exceed 100 characters');
    }
  }

  // Search users by name - filters client-side for demo API
  async searchUsers(query: string, params?: PaginationParams): Promise<ApiResponse<UserListResponse>> {
    this.logger.info('Searching users', { query, params });

    const response = await this.getUsers(params);

    if (query && query.trim().length > 0) {
      const filteredUsers = response.data.data.filter(user =>
        user.first_name?.toLowerCase().includes(query.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase())
      );

      response.data.data = filteredUsers;
      this.logger.info('Users filtered by search query', {
        query,
        originalCount: response.data.total,
        filteredCount: filteredUsers.length
      });
    }

    return response;
  }
}

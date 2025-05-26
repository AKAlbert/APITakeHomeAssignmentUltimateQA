/**
 * Core API Types and Interfaces
 * Comprehensive type definitions for API requests, responses, and data models
 */

// Base API Response Structure
export interface BaseApiResponse {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  support?: {
    url: string;
    text: string;
  };
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API Error Response
export interface ApiErrorResponse {
  error: string;
  message?: string;
  statusCode: number;
  timestamp?: string;
}

// User Related Types
export interface User {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  name?: string;
  job?: string;
}

export interface CreateUserRequest {
  name: string;
  job: string;
}

export interface CreateUserResponse extends CreateUserRequest {
  id: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  name?: string;
  job?: string;
}

export interface UpdateUserResponse extends UpdateUserRequest {
  updatedAt: string;
}

export interface UserListResponse extends BaseApiResponse {
  data: User[];
}

export interface SingleUserResponse {
  data: User;
  support: {
    url: string;
    text: string;
  };
}

// Resource Related Types
export interface Resource {
  id: number;
  name: string;
  year: number;
  color: string;
  pantone_value: string;
}

export interface ResourceListResponse extends BaseApiResponse {
  data: Resource[];
}

export interface SingleResourceResponse {
  data: Resource;
  support: {
    url: string;
    text: string;
  };
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  token: string;
}

// API Client Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

// Request Configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
}

// Response Type
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

// Pagination Parameters
export interface PaginationParams {
  page?: number;
  per_page?: number;
}

// Query Parameters
export interface QueryParams extends PaginationParams {
  delay?: number;
  [key: string]: any;
}

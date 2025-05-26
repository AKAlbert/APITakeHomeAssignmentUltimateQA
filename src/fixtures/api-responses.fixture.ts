import { MockResponse, UserListResponse, SingleUserResponse, CreateUserResponse, LoginResponse, RegisterResponse, ResourceListResponse, SingleResourceResponse } from '@/types';

export const mockUserListResponse: MockResponse<UserListResponse> = {
  status: 200,
  data: {
    page: 1,
    per_page: 6,
    total: 12,
    total_pages: 2,
    data: [
      {
        id: 1,
        email: "george.bluth@reqres.in",
        first_name: "George",
        last_name: "Bluth",
        avatar: "https://reqres.in/img/faces/1-image.jpg"
      },
      {
        id: 2,
        email: "janet.weaver@reqres.in",
        first_name: "Janet",
        last_name: "Weaver",
        avatar: "https://reqres.in/img/faces/2-image.jpg"
      },
      {
        id: 3,
        email: "emma.wong@reqres.in",
        first_name: "Emma",
        last_name: "Wong",
        avatar: "https://reqres.in/img/faces/3-image.jpg"
      }
    ],
    support: {
      url: "https://reqres.in/#support-heading",
      text: "To keep ReqRes free, contributions towards server costs are appreciated!"
    }
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockSingleUserResponse: MockResponse<SingleUserResponse> = {
  status: 200,
  data: {
    data: {
      id: 2,
      email: "janet.weaver@reqres.in",
      first_name: "Janet",
      last_name: "Weaver",
      avatar: "https://reqres.in/img/faces/2-image.jpg"
    },
    support: {
      url: "https://reqres.in/#support-heading",
      text: "To keep ReqRes free, contributions towards server costs are appreciated!"
    }
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockUserNotFoundResponse: MockResponse = {
  status: 404,
  data: {},
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockCreateUserResponse: MockResponse<CreateUserResponse> = {
  status: 201,
  data: {
    name: "morpheus",
    job: "leader",
    id: "123",
    createdAt: "2024-01-01T12:00:00.000Z"
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockUpdateUserResponse: MockResponse = {
  status: 200,
  data: {
    name: "morpheus",
    job: "zion resident",
    updatedAt: "2024-01-01T12:00:00.000Z"
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockDeleteUserResponse: MockResponse = {
  status: 204,
  data: null,
  headers: {}
};

export const mockLoginSuccessResponse: MockResponse<LoginResponse> = {
  status: 200,
  data: {
    token: "QpwL5tke4Pnpja7X4"
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockLoginFailureResponse: MockResponse = {
  status: 400,
  data: {
    error: "Missing password"
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockRegisterSuccessResponse: MockResponse<RegisterResponse> = {
  status: 200,
  data: {
    id: 4,
    token: "QpwL5tke4Pnpja7X4"
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockRegisterFailureResponse: MockResponse = {
  status: 400,
  data: {
    error: "Missing password"
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockResourceListResponse: MockResponse<ResourceListResponse> = {
  status: 200,
  data: {
    page: 1,
    per_page: 6,
    total: 12,
    total_pages: 2,
    data: [
      {
        id: 1,
        name: "cerulean",
        year: 2000,
        color: "#98B2D1",
        pantone_value: "15-4020"
      },
      {
        id: 2,
        name: "fuchsia rose",
        year: 2001,
        color: "#C74375",
        pantone_value: "17-2031"
      },
      {
        id: 3,
        name: "true red",
        year: 2002,
        color: "#BF1932",
        pantone_value: "19-1664"
      }
    ],
    support: {
      url: "https://reqres.in/#support-heading",
      text: "To keep ReqRes free, contributions towards server costs are appreciated!"
    }
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockSingleResourceResponse: MockResponse<SingleResourceResponse> = {
  status: 200,
  data: {
    data: {
      id: 2,
      name: "fuchsia rose",
      year: 2001,
      color: "#C74375",
      pantone_value: "17-2031"
    },
    support: {
      url: "https://reqres.in/#support-heading",
      text: "To keep ReqRes free, contributions towards server costs are appreciated!"
    }
  },
  headers: {
    'Content-Type': 'application/json'
  }
};

export const mockResourceNotFoundResponse: MockResponse = {
  status: 404,
  data: {},
  headers: {
    'Content-Type': 'application/json'
  }
};

// Mock response with delay for testing timeout scenarios
export const mockDelayedResponse: MockResponse = {
  status: 200,
  data: {
    page: 1,
    per_page: 6,
    total: 12,
    total_pages: 2,
    data: []
  },
  headers: {
    'Content-Type': 'application/json'
  },
  delay: 3000
};

// Collection of common HTTP error responses for testing
export const mockErrorResponses = {
  badRequest: {
    status: 400,
    data: { error: "Bad Request", message: "Invalid request parameters" },
    headers: { 'Content-Type': 'application/json' }
  },
  unauthorized: {
    status: 401,
    data: { error: "Unauthorized", message: "Authentication required" },
    headers: { 'Content-Type': 'application/json' }
  },
  forbidden: {
    status: 403,
    data: { error: "Forbidden", message: "Access denied" },
    headers: { 'Content-Type': 'application/json' }
  },
  notFound: {
    status: 404,
    data: { error: "Not Found", message: "Resource not found" },
    headers: { 'Content-Type': 'application/json' }
  },
  methodNotAllowed: {
    status: 405,
    data: { error: "Method Not Allowed", message: "HTTP method not supported" },
    headers: { 'Content-Type': 'application/json' }
  },
  internalServerError: {
    status: 500,
    data: { error: "Internal Server Error", message: "Something went wrong" },
    headers: { 'Content-Type': 'application/json' }
  },
  serviceUnavailable: {
    status: 503,
    data: { error: "Service Unavailable", message: "Service temporarily unavailable" },
    headers: { 'Content-Type': 'application/json' }
  }
};

export function getMockResponse(endpoint: string, method: string): MockResponse | undefined {
  const mockMap: Record<string, MockResponse> = {
    'GET /api/users': mockUserListResponse,
    'GET /api/users/2': mockSingleUserResponse,
    'GET /api/users/23': mockUserNotFoundResponse,
    'POST /api/users': mockCreateUserResponse,
    'PUT /api/users/2': mockUpdateUserResponse,
    'DELETE /api/users/2': mockDeleteUserResponse,
    'POST /api/login': mockLoginSuccessResponse,
    'POST /api/register': mockRegisterSuccessResponse,
    'GET /api/unknown': mockResourceListResponse,
    'GET /api/unknown/2': mockSingleResourceResponse,
    'GET /api/unknown/23': mockResourceNotFoundResponse
  };

  const key = `${method.toUpperCase()} ${endpoint}`;
  return mockMap[key];
}

# Enterprise API Testing Framework for reqres.in

A comprehensive, scalable API testing framework built with TypeScript, Playwright, and enterprise-grade patterns. This framework demonstrates professional-grade API testing capabilities with 15+ comprehensive test cases covering functional, integration, and advanced testing scenarios as in the technical document provided.

##  **Framework Requirements Coverage**

### **1. Framework Architecture & Design (1.5 hours)**
✅ **Scalable project structure and organization**
✅ **TypeScript interfaces for reqres.in API data models**
✅ **Reusable API client classes with proper error handling**
✅ **Environment configuration management**
✅ **Test data management strategy with factories**
✅ **Logging and reporting mechanisms**

### **2. Test Implementation (2.5 hours) - 15+ Test Cases**
✅ **A. Functional Tests (5 test cases)**
- CRUD operations with data persistence validation
- Input validation and error boundary testing
- Response data integrity verification
- HTTP status code validation
- Parameterized testing with external data

✅ **B. Integration Test Scenarios (6 test cases)**
- Authentication & Authorization Flow (2 tests)
- Data Persistence & Retrieval Flow (2 tests)
- Error Handling & Edge Cases (2 tests)

✅ **C. Advanced Testing Patterns (4+ test cases)**
- Parameterized tests with external data sources (CSV/JSON)
- Parallel test execution with proper isolation
- Security testing (authentication, authorization, input validation)
- API contract validation and schema testing

### **3. Quality & Reliability Features (1 hour)**
✅ **Error Handling & Resilience**
- Circuit breaker pattern for service availability
- Retry mechanisms for flaky requests
- Comprehensive logging and debugging support
- Graceful handling of service downtime

✅ **Test Data Management**
- Test data factory patterns
- Data cleanup mechanisms
- Environment-specific test data
- Test isolation and data independence

##  Features

###  **Scalable Architecture**
- **Modular Design**: Clear separation of concerns with dedicated modules for clients, data, configuration, and utilities
- **TypeScript First**: Comprehensive type safety with detailed interfaces and type definitions for reqres.in API
- **Reusable Components**: API clients, data factories, and utilities designed for maximum reusability
- **Circuit Breaker Pattern**: Resilience against service failures and cascading failures

###  **API Client Management**
- **Base API Client**: Common functionality with retry logic, error handling, and logging
- **Specialized Clients**: Dedicated clients for Users, Authentication, and Resources
- **Request/Response Interceptors**: Built-in logging and performance monitoring
- **Automatic Retries**: Configurable retry mechanisms with exponential backoff

###  **Environment Management**
- **Multi-Environment Support**: Development, staging, production, and local configurations
- **Dynamic Configuration**: Environment-specific settings with override capabilities
- **Secure Credential Management**: Environment variable-based configuration
- **Validation**: Built-in configuration validation and error handling

###  **Test Data Management**
- **Data Factories**: Generate realistic test data using Faker.js
- **Test Fixtures**: Static test data for consistent scenarios
- **Data Tracking**: Automatic tracking and cleanup of created test data
- **Edge Case Support**: Specialized data generators for boundary testing

###  **Logging & Reporting**
- **Structured Logging**: Winston-based logging with multiple levels and formats
- **Custom Reporters**: Enhanced test reporting with API-specific metrics
- **Performance Tracking**: Response time monitoring and performance analytics
- **Multiple Formats**: JSON, HTML, and console reporting options

###  **Testing Utilities**
- **Enhanced Test Fixtures**: Extended Playwright test context with API utilities
- **Response Validation**: Automated validation of API response structures
- **Performance Testing**: Built-in load testing and performance measurement tools
- **Cleanup Management**: Automatic test data cleanup and resource management

##  Project Structure

```
src/
├── clients/              # API client classes
│   ├── user.client.ts    # User API operations (reqres.in/api/users)
│   ├── auth.client.ts    # Authentication operations (reqres.in/api/login, /api/register)
│   └── index.ts          # Client factory and exports
├── config/               # Configuration management
│   ├── environment.config.ts # Environment-specific settings
│   ├── logger.config.ts  # Logging configuration
│   ├── test.config.ts    # Test execution settings
│   └── index.ts          # Configuration factory
├── core/                 # Core framework components
│   └── base-api-client.ts # Base API client with circuit breaker, retry logic
├── data/                 # Test data management
│   ├── user.factory.ts   # User data generation with Faker.js
│   ├── resource.factory.ts # Resource data generation
│   └── index.ts          # Data management utilities
├── fixtures/             # Static test data
│   ├── users.fixture.ts  # User test fixtures
│   ├── resources.fixture.ts # Resource test fixtures
│   ├── api-responses.fixture.ts # Mock API responses
│   └── index.ts          # Fixture management
├── helpers/              # Test helper utilities
│   ├── test.helpers.ts   # Enhanced test fixtures and utilities
│   └── index.ts          # Helper exports
├── reporters/            # Custom test reporters
│   ├── custom.reporter.ts # Enhanced API test reporter
│   └── index.ts          # Reporter exports
├── tests/                # Test suites (15+ comprehensive test cases)
│   ├── functional/       # A. Functional Tests (5 test cases)
│   │   └── TC_FUN_01_CRUD.spec.ts # CRUD, validation, data integrity, HTTP status, parameterized
│   ├── integration/      # B. Integration Test Scenarios (6 test cases)
│   │   ├── TC_INT_01_Auth.spec.ts # Authentication & Authorization Flow (2 tests)
│   │   ├── TC_INT_02_DataFlow.spec.ts # Data Persistence & Retrieval Flow (2 tests)
│   │   └── TC_INT_03_ErrorHandling.spec.ts # Error Handling & Edge Cases (2 tests)
│   └── advanced/         # C. Advanced Testing Patterns (4+ test cases)
│       ├── TC_ADV_01_Parameterized.spec.ts # Data-driven tests with CSV/JSON (2 tests)
│       ├── TC_ADV_02_Parallel.spec.ts # Parallel execution with isolation (1 test)
│       └── TC_ADV_03_Security.spec.ts # Security testing & API contracts (2 tests)
├── types/                # TypeScript type definitions
│   ├── api.types.ts      # API-related types for reqres.in
│   ├── config.types.ts   # Configuration types
│   ├── test.types.ts     # Test-related types
│   └── index.ts          # Type exports
└── utils/                # Utility functions
    ├── logger.ts         # Logging utility with Winston
    ├── circuit-breaker.ts # Circuit breaker pattern implementation
    └── test-data-loader.ts # CSV/JSON test data loader with caching

test-data/                # External test data files
├── users.csv             # User test data for parameterized testing
└── auth-scenarios.json   # Authentication scenarios for data-driven tests
```

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone git@github.com:AKAlbert/APITakeHomeAssignmentUltimateQA.git
   cd APITakeHomeAssignmentUltimateQA
   ```

2. **Quick setup (recommended)**
   ```bash
   npm run setup
   ```

3. **Manual setup**
   ```bash
   npm install
   npm run install:browsers
   ```

4. **Environment configuration**
   ```bash
   # Environment variables are already configured in .env
   # Default configuration targets reqres.in API
   ```

##  Running Tests

### **Run All Tests (15+ Test Cases)**
```bash
npm run test:all
```

### **Run by Test Category**
```bash
# A. Functional Tests (5 test cases)
npm run test:functional

# B. Integration Tests (6 test cases)
npm run test:integration

# C. Advanced Testing Patterns (4+ test cases)
npm run test:advanced
```

### **Parallel Execution**
```bash
npm run test:parallel
```

### **Debug Mode**
```bash
npm run test:debug
```

### **With Tracing**
```bash
npm run test:trace
```

##  Test Coverage Summary

| **Category** | **Test Cases** | **Coverage** |
|--------------|----------------|--------------|
| **A. Functional Tests** | 5 | CRUD operations, input validation, data integrity, HTTP status codes, parameterized testing |
| **B. Integration Tests** | 6 | Authentication flows, data persistence, error handling, edge cases |
| **C. Advanced Patterns** | 4+ | Data-driven testing, parallel execution, security testing, API contracts |
| **Total** | **15+** | **Complete reqres.in API coverage** |

##  Framework Architecture Highlights

### **Circuit Breaker Pattern**
```typescript
// Automatic failure detection and recovery
const metrics = apiClient.getCircuitBreakerMetrics();
console.log(`Circuit State: ${metrics.state}`);
console.log(`Success Rate: ${apiClient.getSuccessRate()}%`);
```

### **Data-Driven Testing**
```typescript
// Load test data from external sources
const testData = await testDataLoader.loadFromCSV('users.csv');
const authScenarios = await testDataLoader.loadFromJSON('auth-scenarios.json');
```

### **Test Data Factories**
```typescript
// Generate realistic test data
const user = userFactory.createRealisticUser();
const edgeCaseUser = userFactory.createEdgeCaseUser('unicode');
const bulkUsers = userFactory.createBulkUsers(10);
```

### **Comprehensive Logging**
```typescript
// Structured logging with context
logger.info('API request started', { method: 'POST', endpoint: '/api/users' });
logger.logPerformance('User creation', 250, { userId: 123 });
```

##  Key Features Demonstrated

### **1. Framework Architecture & Design**
- ✅ Scalable project structure with clear separation of concerns
- ✅ TypeScript interfaces for reqres.in API data models
- ✅ Reusable API client classes with error handling and circuit breaker
- ✅ Environment configuration management for multiple environments
- ✅ Test data management with factories and external data sources
- ✅ Comprehensive logging and reporting mechanisms

### **2. Test Implementation (15+ Test Cases)**
- ✅ **Functional Tests**: CRUD operations, input validation, data integrity, HTTP status validation, parameterized testing
- ✅ **Integration Tests**: Authentication flows, data persistence, error handling, edge cases
- ✅ **Advanced Patterns**: Data-driven testing, parallel execution, security testing, API contract validation

### **3. Quality & Reliability Features**
- ✅ Circuit breaker pattern for service availability
- ✅ Retry mechanisms with exponential backoff
- ✅ Comprehensive error handling and graceful degradation
- ✅ Test data factories and cleanup mechanisms
- ✅ Test isolation and data independence

##  Performance & Reliability

- **Circuit Breaker**: Prevents cascading failures with configurable thresholds
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Parallel Execution**: Concurrent test execution with proper isolation
- **Performance Monitoring**: Built-in response time tracking and metrics
- **Resource Management**: Automatic cleanup of test data and resources

##  Security Testing

- **Input Validation**: SQL injection and XSS prevention testing
- **Authentication**: Token-based authentication flow validation
- **Authorization**: Protected endpoint access verification
- **Data Sanitization**: Input sanitization and output encoding validation

##  Test Reports

After running tests, view detailed reports:
```bash
npm run report
```

Reports include:
- Test execution results with pass/fail status
- Performance metrics and response times
- Circuit breaker statistics
- Test data usage and cleanup status
- Error logs and debugging information

##  Contributing

This framework demonstrates enterprise-grade API testing practices including:
- Professional project structure and organization
- Comprehensive test coverage with 15+ test cases
- Advanced testing patterns and data-driven approaches
- Quality assurance and reliability features
- Security testing and API contract validation

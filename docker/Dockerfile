# =============================================================================
# Multi-stage Dockerfile for API Testing Framework
# =============================================================================
# This Dockerfile creates an optimized container for running the API testing
# framework with proper security, performance, and monitoring capabilities.
# =============================================================================

# =============================================================================
# Stage 1: Base Image with Dependencies
# =============================================================================
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    git \
    bash \
    jq \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S testuser && \
    adduser -S testuser -u 1001 -G testuser

# =============================================================================
# Stage 2: Dependencies Installation
# =============================================================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force

# Install Playwright browsers
RUN npx playwright install --with-deps

# =============================================================================
# Stage 3: Build Stage
# =============================================================================
FROM base AS build

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY src/ ./src/
COPY playwright.config.ts ./

# Run type checking and linting
RUN npm run type-check && \
    npm run lint

# Create build directory and copy necessary files
RUN mkdir -p dist && \
    cp -r src dist/ && \
    cp package*.json dist/ && \
    cp tsconfig.json dist/ && \
    cp playwright.config.ts dist/

# Generate build metadata
RUN echo "{ \
    \"buildTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \
    \"nodeVersion\": \"$(node --version)\", \
    \"npmVersion\": \"$(npm --version)\", \
    \"platform\": \"$(uname -a)\" \
}" > dist/build-info.json

# =============================================================================
# Stage 4: Production Image
# =============================================================================
FROM base AS production

# Set environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV TEST_WORKERS=3

# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /root/.cache/ms-playwright /home/testuser/.cache/ms-playwright

# Copy built application
COPY --from=build /app/dist ./

# Copy additional configuration files
COPY test-data/ ./test-data/
COPY scripts/ ./scripts/

# Create necessary directories
RUN mkdir -p logs test-results playwright-report && \
    chown -R testuser:testuser /app

# Switch to non-root user
USER testuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port (if running as a service)
EXPOSE 3000

# Default command
CMD ["npm", "run", "test"]

# =============================================================================
# Stage 5: Development Image
# =============================================================================
FROM base AS development

# Set environment variables
ENV NODE_ENV=development
ENV LOG_LEVEL=debug

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci --prefer-offline --no-audit

# Install Playwright browsers
RUN npx playwright install --with-deps

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p logs test-results playwright-report && \
    chown -R testuser:testuser /app

# Switch to non-root user
USER testuser

# Default command for development
CMD ["npm", "run", "test:debug"]

# =============================================================================
# Stage 6: CI/CD Image
# =============================================================================
FROM base AS ci

# Set environment variables
ENV NODE_ENV=test
ENV CI=true

# Install additional CI tools
USER root
RUN apk add --no-cache \
    docker \
    docker-compose \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci --prefer-offline --no-audit

# Install Playwright browsers
RUN npx playwright install --with-deps

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p logs test-results playwright-report && \
    chown -R testuser:testuser /app

# Switch to non-root user
USER testuser

# Default command for CI
CMD ["npm", "run", "test:all"]

# =============================================================================
# Build Arguments and Labels
# =============================================================================
ARG BUILD_VERSION=latest
ARG BUILD_DATE
ARG VCS_REF

LABEL maintainer="Albert AK <albert@example.com>"
LABEL version="${BUILD_VERSION}"
LABEL description="API Testing Framework with Playwright and TypeScript"
LABEL build-date="${BUILD_DATE}"
LABEL vcs-ref="${VCS_REF}"
LABEL org.opencontainers.image.title="API Testing Framework"
LABEL org.opencontainers.image.description="Enterprise-grade API testing framework"
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${VCS_REF}"
LABEL org.opencontainers.image.vendor="UltimateQA"
LABEL org.opencontainers.image.licenses="MIT"

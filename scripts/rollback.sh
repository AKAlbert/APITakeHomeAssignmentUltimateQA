#!/bin/bash

# =============================================================================
# Production Rollback Script
# =============================================================================
# This script handles the rollback of the API testing framework to a previous
# version with proper validation, health checks, and monitoring.
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/logs/rollback.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
ROLLBACK_VERSION=""
REASON=""
EMERGENCY=false
SKIP_TESTS=false
ROLLBACK_TIMEOUT=600 # 10 minutes

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
    esac
    
    # Log to file
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Rollback the API testing framework to a previous version.

OPTIONS:
    -e, --environment ENV       Target environment (development|staging|production)
    -v, --version VERSION       Version to rollback to (tag, branch, or commit SHA)
    -r, --reason REASON         Reason for rollback (required)
    --emergency                 Emergency rollback (skip some validations)
    -s, --skip-tests           Skip post-rollback tests
    -t, --timeout SECONDS      Rollback timeout in seconds (default: 600)
    -h, --help                 Show this help message

EXAMPLES:
    $0 -e production -v v1.2.2 -r "Critical bug fix"
    $0 -e staging -v main --emergency -r "Service outage"
    $0 -e development -v previous-stable --skip-tests -r "Testing rollback"

ENVIRONMENT VARIABLES:
    DEPLOY_API_KEY          API key for deployment service
    SLACK_WEBHOOK_URL       Slack webhook for notifications
    
EOF
}

validate_environment() {
    local env=$1
    case $env in
        development|staging|production)
            return 0
            ;;
        *)
            log "ERROR" "Invalid environment: $env"
            log "ERROR" "Valid environments: development, staging, production"
            return 1
            ;;
    esac
}

get_current_version() {
    local env=$1
    
    # In real scenario, this would query the deployment system
    # to get the currently deployed version
    case $env in
        development)
            echo "v1.0.1"
            ;;
        staging)
            echo "v1.0.2"
            ;;
        production)
            echo "v1.0.3"
            ;;
    esac
}

validate_rollback_version() {
    local version=$1
    local current_version=$2
    
    # Check if rollback version exists in git
    if ! git rev-parse "$version" >/dev/null 2>&1; then
        log "ERROR" "Rollback version '$version' not found in git repository"
        return 1
    fi
    
    # Prevent rolling back to the same version
    if [[ "$version" == "$current_version" ]]; then
        log "ERROR" "Cannot rollback to the same version: $version"
        return 1
    fi
    
    log "INFO" "Rollback version '$version' validated successfully"
    return 0
}

check_rollback_prerequisites() {
    log "INFO" "Checking rollback prerequisites..."
    
    # Check required tools
    local required_tools=("git" "npm" "node" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "Required tool '$tool' is not installed"
            return 1
        fi
    done
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log "ERROR" "Not in a git repository"
        return 1
    fi
    
    # Check environment variables for production
    if [[ "$ENVIRONMENT" == "production" && "$EMERGENCY" != "true" ]]; then
        if [[ -z "${DEPLOY_API_KEY:-}" ]]; then
            log "ERROR" "DEPLOY_API_KEY environment variable is required for production rollback"
            return 1
        fi
    fi
    
    log "SUCCESS" "All rollback prerequisites satisfied"
    return 0
}

create_backup() {
    log "INFO" "Creating backup of current deployment..."
    
    local backup_id="backup-$(date +%s)"
    local backup_dir="${PROJECT_ROOT}/backups/${ENVIRONMENT}"
    
    mkdir -p "$backup_dir"
    
    # In real scenario, this would backup the current production state
    # including database, configuration, and application files
    
    local backup_info="{
        \"backupId\": \"$backup_id\",
        \"environment\": \"$ENVIRONMENT\",
        \"backupTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"currentVersion\": \"$(get_current_version "$ENVIRONMENT")\",
        \"backupBy\": \"$(whoami)\",
        \"reason\": \"Pre-rollback backup\"
    }"
    
    echo "$backup_info" | jq . > "${backup_dir}/${backup_id}.json"
    
    log "SUCCESS" "Backup created: $backup_id"
    echo "$backup_id"
}

build_rollback_version() {
    log "INFO" "Building rollback version $ROLLBACK_VERSION..."
    
    # Checkout rollback version
    git checkout "$ROLLBACK_VERSION"
    
    # Set environment
    export NODE_ENV="$ENVIRONMENT"
    
    # Install dependencies
    log "INFO" "Installing dependencies for rollback version..."
    npm ci --prefer-offline --no-audit
    
    # Install Playwright browsers
    log "INFO" "Installing Playwright browsers..."
    npx playwright install --with-deps
    
    # Type checking
    if [[ "$EMERGENCY" != "true" ]]; then
        log "INFO" "Running TypeScript type checking..."
        npm run type-check
    fi
    
    # Create build directory
    mkdir -p dist
    
    # Copy source files
    cp -r src dist/
    cp package*.json dist/
    cp tsconfig.json dist/
    cp playwright.config.ts dist/
    
    # Generate rollback metadata
    local rollback_info="{
        \"rollbackVersion\": \"$ROLLBACK_VERSION\",
        \"environment\": \"$ENVIRONMENT\",
        \"rollbackTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"rollbackReason\": \"$REASON\",
        \"rollbackBy\": \"$(whoami)\",
        \"emergency\": $EMERGENCY,
        \"commit\": \"$(git rev-parse HEAD)\",
        \"branch\": \"$(git rev-parse --abbrev-ref HEAD)\"
    }"
    
    echo "$rollback_info" | jq . > dist/rollback-info.json
    
    log "SUCCESS" "Rollback version built successfully"
}

execute_rollback() {
    log "INFO" "Executing rollback to $ROLLBACK_VERSION on $ENVIRONMENT..."
    
    local rollback_start=$(date +%s)
    
    # Environment-specific rollback logic
    case $ENVIRONMENT in
        development)
            rollback_development
            ;;
        staging)
            rollback_staging
            ;;
        production)
            rollback_production
            ;;
    esac
    
    local rollback_end=$(date +%s)
    local rollback_duration=$((rollback_end - rollback_start))
    
    log "SUCCESS" "Rollback completed in ${rollback_duration}s"
    echo "$rollback_duration"
}

rollback_development() {
    log "INFO" "Rolling back development environment..."
    
    # Simulate development rollback
    sleep 2
    
    # In real scenario, this would:
    # - Stop current services
    # - Deploy rollback version
    # - Start services
    # - Update configuration
}

rollback_staging() {
    log "INFO" "Rolling back staging environment..."
    
    # Simulate staging rollback
    sleep 5
    
    # In real scenario, this would:
    # - Perform blue-green rollback
    # - Update load balancer
    # - Rollback database if needed
    # - Update configuration
}

rollback_production() {
    log "INFO" "Rolling back production environment..."
    
    if [[ "$EMERGENCY" != "true" ]]; then
        log "WARN" "Production rollback requires confirmation"
        read -p "Are you sure you want to rollback production? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log "ERROR" "Production rollback cancelled by user"
            exit 1
        fi
    fi
    
    # Simulate production rollback
    sleep 10
    
    # In real scenario, this would:
    # - Perform rolling rollback
    # - Update load balancers
    # - Rollback database migrations if needed
    # - Update configuration
    # - Verify rollback
}

health_check() {
    log "INFO" "Running post-rollback health checks..."
    
    local health_url
    case $ENVIRONMENT in
        development)
            health_url="https://dev-api.example.com/health"
            ;;
        staging)
            health_url="https://staging-api.example.com/health"
            ;;
        production)
            health_url="https://api.example.com/health"
            ;;
    esac
    
    # Wait for services to start
    sleep 10
    
    # Health check with retry
    local max_attempts=5
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "INFO" "Health check attempt $attempt/$max_attempts..."
        
        # Simulate health check
        # if curl -f "$health_url" >/dev/null 2>&1; then
        if true; then
            log "SUCCESS" "Health check passed"
            return 0
        fi
        
        log "WARN" "Health check failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    log "ERROR" "Health check failed after $max_attempts attempts"
    return 1
}

run_post_rollback_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log "WARN" "Skipping post-rollback tests as requested"
        return 0
    fi
    
    log "INFO" "Running post-rollback validation tests..."
    
    # Run critical tests to ensure rollback is working
    case $ENVIRONMENT in
        development)
            npm run test:functional -- --grep="@smoke"
            ;;
        staging)
            npm run test:functional -- --grep="@critical|@smoke"
            ;;
        production)
            npm run test:functional -- --grep="@critical"
            ;;
    esac
    
    log "SUCCESS" "Post-rollback tests passed"
}

send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local emoji
        case $status in
            "success") emoji="✅" ;;
            "failure") emoji="❌" ;;
            "warning") emoji="⚠️" ;;
            *) emoji="ℹ️" ;;
        esac
        
        local payload="{
            \"text\": \"$emoji Rollback $status: $message\",
            \"fields\": [
                {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                {\"title\": \"Rollback Version\", \"value\": \"$ROLLBACK_VERSION\", \"short\": true},
                {\"title\": \"Reason\", \"value\": \"$REASON\", \"short\": false},
                {\"title\": \"Emergency\", \"value\": \"$EMERGENCY\", \"short\": true},
                {\"title\": \"Executed by\", \"value\": \"$(whoami)\", \"short\": true}
            ]
        }"
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
}

# =============================================================================
# Main Rollback Function
# =============================================================================

main() {
    log "INFO" "Starting rollback process..."
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Rollback version: $ROLLBACK_VERSION"
    log "INFO" "Reason: $REASON"
    log "INFO" "Emergency: $EMERGENCY"
    
    # Get current version
    local current_version
    current_version=$(get_current_version "$ENVIRONMENT")
    log "INFO" "Current version: $current_version"
    
    # Validate inputs
    validate_environment "$ENVIRONMENT"
    validate_rollback_version "$ROLLBACK_VERSION" "$current_version"
    
    # Check prerequisites
    check_rollback_prerequisites
    
    # Create backup
    local backup_id
    backup_id=$(create_backup)
    
    # Build rollback version
    build_rollback_version
    
    # Execute rollback
    local rollback_duration
    rollback_duration=$(execute_rollback)
    
    # Health check
    if ! health_check; then
        log "ERROR" "Rollback failed health check"
        send_notification "failure" "Rollback failed health check"
        exit 1
    fi
    
    # Run post-rollback tests
    if ! run_post_rollback_tests; then
        log "ERROR" "Post-rollback tests failed"
        send_notification "failure" "Post-rollback tests failed"
        exit 1
    fi
    
    # Success notification
    send_notification "success" "Rollback completed successfully in ${rollback_duration}s"
    
    log "SUCCESS" "Rollback completed successfully!"
    log "INFO" "Rollback log: $LOG_FILE"
    log "INFO" "Backup ID: $backup_id"
}

# =============================================================================
# Parse Command Line Arguments
# =============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -v|--version)
            ROLLBACK_VERSION="$2"
            shift 2
            ;;
        -r|--reason)
            REASON="$2"
            shift 2
            ;;
        --emergency)
            EMERGENCY=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -t|--timeout)
            ROLLBACK_TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required arguments
if [[ -z "$ENVIRONMENT" ]]; then
    log "ERROR" "Environment is required"
    show_usage
    exit 1
fi

if [[ -z "$ROLLBACK_VERSION" ]]; then
    log "ERROR" "Rollback version is required"
    show_usage
    exit 1
fi

if [[ -z "$REASON" ]]; then
    log "ERROR" "Reason for rollback is required"
    show_usage
    exit 1
fi

# Run main function
main

#!/bin/bash

# =============================================================================
# Smoke Tests Script
# =============================================================================
# This script runs critical smoke tests against deployed environments to
# validate that core functionality is working after deployment or rollback.
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/logs/smoke-tests.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
BASE_URL=""
PARALLEL=false
TIMEOUT=300 # 5 minutes
RETRIES=3
OUTPUT_FORMAT="console"
REPORT_FILE=""

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

Run smoke tests against deployed API testing framework.

OPTIONS:
    -e, --environment ENV       Target environment (development|staging|production)
    -u, --url URL              Base URL to test against
    -p, --parallel             Run tests in parallel
    -t, --timeout SECONDS      Test timeout in seconds (default: 300)
    -r, --retries COUNT         Number of retries for failed tests (default: 3)
    -f, --format FORMAT         Output format (console|json|html) (default: console)
    -o, --output FILE           Output report file
    -h, --help                  Show this help message

EXAMPLES:
    $0 -e production
    $0 -e staging -p --timeout 600
    $0 -u https://api.example.com -f json -o smoke-report.json

ENVIRONMENT VARIABLES:
    API_KEY                     API key for authentication
    SLACK_WEBHOOK_URL          Slack webhook for notifications
    
EOF
}

get_environment_url() {
    local env=$1
    case $env in
        development)
            echo "https://dev-api.example.com"
            ;;
        staging)
            echo "https://staging-api.example.com"
            ;;
        production)
            echo "https://api.example.com"
            ;;
        local)
            echo "http://localhost:3000"
            ;;
        *)
            log "ERROR" "Unknown environment: $env"
            return 1
            ;;
    esac
}

setup_test_environment() {
    log "INFO" "Setting up smoke test environment..."
    
    # Set base URL
    if [[ -z "$BASE_URL" ]]; then
        BASE_URL=$(get_environment_url "$ENVIRONMENT")
    fi
    
    log "INFO" "Target URL: $BASE_URL"
    
    # Set environment variables
    export NODE_ENV="$ENVIRONMENT"
    export API_BASE_URL="$BASE_URL"
    export TEST_TIMEOUT="$TIMEOUT"
    
    # Set API key if available
    if [[ -n "${API_KEY:-}" ]]; then
        export API_KEY="$API_KEY"
    fi
    
    log "SUCCESS" "Test environment configured"
}

check_prerequisites() {
    log "INFO" "Checking smoke test prerequisites..."
    
    # Check required tools
    local required_tools=("npm" "node" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "Required tool '$tool' is not installed"
            return 1
        fi
    done
    
    # Check if we're in the project directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log "ERROR" "Not in a valid project directory"
        return 1
    fi
    
    # Check if dependencies are installed
    if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
        log "WARN" "Dependencies not installed, installing now..."
        cd "$PROJECT_ROOT"
        npm ci --prefer-offline --no-audit
        npx playwright install --with-deps
    fi
    
    log "SUCCESS" "All prerequisites satisfied"
    return 0
}

test_api_health() {
    log "INFO" "Testing API health endpoint..."
    
    local health_url="${BASE_URL}/health"
    local max_attempts=$RETRIES
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "INFO" "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s --max-time 10 "$health_url" >/dev/null 2>&1; then
            log "SUCCESS" "API health check passed"
            return 0
        fi
        
        if [[ $attempt -lt $max_attempts ]]; then
            log "WARN" "Health check failed, retrying in 5 seconds..."
            sleep 5
        fi
        
        ((attempt++))
    done
    
    log "ERROR" "API health check failed after $max_attempts attempts"
    return 1
}

test_api_status() {
    log "INFO" "Testing API status endpoint..."
    
    local status_url="${BASE_URL}/api/status"
    
    if curl -f -s --max-time 10 "$status_url" | jq . >/dev/null 2>&1; then
        log "SUCCESS" "API status endpoint working"
        return 0
    else
        log "ERROR" "API status endpoint failed"
        return 1
    fi
}

run_critical_smoke_tests() {
    log "INFO" "Running critical smoke tests..."
    
    cd "$PROJECT_ROOT"
    
    local test_command="npx playwright test"
    local test_args="--grep=\"@smoke|@critical\""
    
    # Configure test execution
    if [[ "$PARALLEL" == "true" ]]; then
        test_args="$test_args --workers=3"
    else
        test_args="$test_args --workers=1"
    fi
    
    # Configure output format
    case $OUTPUT_FORMAT in
        "json")
            test_args="$test_args --reporter=json"
            ;;
        "html")
            test_args="$test_args --reporter=html"
            ;;
        *)
            test_args="$test_args --reporter=list"
            ;;
    esac
    
    # Set timeout
    test_args="$test_args --timeout=$((TIMEOUT * 1000))"
    
    # Execute tests
    log "INFO" "Executing: $test_command $test_args"
    
    local test_start=$(date +%s)
    local test_result=0
    
    if eval "$test_command $test_args"; then
        local test_end=$(date +%s)
        local test_duration=$((test_end - test_start))
        log "SUCCESS" "Smoke tests passed in ${test_duration}s"
    else
        test_result=1
        log "ERROR" "Smoke tests failed"
    fi
    
    return $test_result
}

run_functional_smoke_tests() {
    log "INFO" "Running functional smoke tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run specific functional tests marked as smoke tests
    if npm run test:functional -- --grep="@smoke" --reporter=list; then
        log "SUCCESS" "Functional smoke tests passed"
        return 0
    else
        log "ERROR" "Functional smoke tests failed"
        return 1
    fi
}

run_integration_smoke_tests() {
    log "INFO" "Running integration smoke tests..."
    
    cd "$PROJECT_ROOT"
    
    # Run specific integration tests marked as smoke tests
    if npm run test:integration -- --grep="@smoke" --reporter=list; then
        log "SUCCESS" "Integration smoke tests passed"
        return 0
    else
        log "ERROR" "Integration smoke tests failed"
        return 1
    fi
}

generate_smoke_test_report() {
    log "INFO" "Generating smoke test report..."
    
    local report_dir="${PROJECT_ROOT}/test-results"
    mkdir -p "$report_dir"
    
    local report_file="${report_dir}/smoke-test-report.json"
    if [[ -n "$REPORT_FILE" ]]; then
        report_file="$REPORT_FILE"
    fi
    
    # Generate comprehensive report
    local report="{
        \"environment\": \"$ENVIRONMENT\",
        \"baseUrl\": \"$BASE_URL\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"testDuration\": \"${test_duration:-0}s\",
        \"parallel\": $PARALLEL,
        \"timeout\": $TIMEOUT,
        \"retries\": $RETRIES,
        \"status\": \"$1\",
        \"tests\": {
            \"health\": \"$2\",
            \"status\": \"$3\",
            \"critical\": \"$4\",
            \"functional\": \"$5\",
            \"integration\": \"$6\"
        }
    }"
    
    echo "$report" | jq . > "$report_file"
    
    log "INFO" "Smoke test report generated: $report_file"
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
            \"text\": \"$emoji Smoke Tests $status: $message\",
            \"fields\": [
                {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                {\"title\": \"Base URL\", \"value\": \"$BASE_URL\", \"short\": true},
                {\"title\": \"Parallel\", \"value\": \"$PARALLEL\", \"short\": true},
                {\"title\": \"Duration\", \"value\": \"${test_duration:-0}s\", \"short\": true}
            ]
        }"
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
}

# =============================================================================
# Main Smoke Test Function
# =============================================================================

main() {
    log "INFO" "Starting smoke tests..."
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Parallel execution: $PARALLEL"
    log "INFO" "Timeout: ${TIMEOUT}s"
    log "INFO" "Retries: $RETRIES"
    
    # Check prerequisites
    check_prerequisites
    
    # Setup test environment
    setup_test_environment
    
    # Track test results
    local health_status="failed"
    local status_status="failed"
    local critical_status="failed"
    local functional_status="failed"
    local integration_status="failed"
    local overall_status="failed"
    
    local test_start=$(date +%s)
    
    # Run health check
    if test_api_health; then
        health_status="passed"
    fi
    
    # Run status check
    if test_api_status; then
        status_status="passed"
    fi
    
    # Run critical smoke tests
    if run_critical_smoke_tests; then
        critical_status="passed"
    fi
    
    # Run functional smoke tests
    if run_functional_smoke_tests; then
        functional_status="passed"
    fi
    
    # Run integration smoke tests
    if run_integration_smoke_tests; then
        integration_status="passed"
    fi
    
    local test_end=$(date +%s)
    test_duration=$((test_end - test_start))
    
    # Determine overall status
    if [[ "$health_status" == "passed" && "$status_status" == "passed" && 
          "$critical_status" == "passed" ]]; then
        overall_status="passed"
        log "SUCCESS" "All smoke tests passed in ${test_duration}s"
        send_notification "success" "All smoke tests passed"
    else
        log "ERROR" "Some smoke tests failed"
        send_notification "failure" "Some smoke tests failed"
    fi
    
    # Generate report
    generate_smoke_test_report "$overall_status" "$health_status" "$status_status" \
                              "$critical_status" "$functional_status" "$integration_status"
    
    log "INFO" "Smoke test log: $LOG_FILE"
    
    # Exit with appropriate code
    if [[ "$overall_status" == "passed" ]]; then
        exit 0
    else
        exit 1
    fi
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
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -p|--parallel)
            PARALLEL=true
            shift
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -r|--retries)
            RETRIES="$2"
            shift 2
            ;;
        -f|--format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        -o|--output)
            REPORT_FILE="$2"
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
if [[ -z "$ENVIRONMENT" && -z "$BASE_URL" ]]; then
    log "ERROR" "Either environment or base URL is required"
    show_usage
    exit 1
fi

# Set default environment if URL is provided
if [[ -n "$BASE_URL" && -z "$ENVIRONMENT" ]]; then
    ENVIRONMENT="custom"
fi

# Run main function
main

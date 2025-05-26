import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@/utils/logger';

export default class CustomApiTestReporter implements Reporter {
  private logger: Logger;
  private startTime: Date;
  private testResults: Array<{
    test: TestCase;
    result: TestResult;
    duration: number;
    apiCalls?: number;
    errors?: string[];
  }>;
  private outputDir: string;

  constructor(options: { outputDir?: string } = {}) {
    this.logger = new Logger('CustomApiTestReporter');
    this.testResults = [];
    this.outputDir = options.outputDir || 'test-results';
    this.startTime = new Date();

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  onBegin(config: any, suite: any) {
    this.startTime = new Date();
    this.logger.info('Test run started', {
      totalTests: suite.allTests().length,
      workers: config.workers,
      timeout: config.timeout
    });

    console.log(`\n🚀 Starting API Test Suite`);
    console.log(`📊 Total tests: ${suite.allTests().length}`);
    console.log(`⚡ Workers: ${config.workers}`);
    console.log(`⏱️  Timeout: ${config.timeout}ms`);
    console.log(`📁 Output: ${this.outputDir}\n`);
  }

  onTestBegin(test: TestCase) {
    this.logger.logTestStart(test.title, {
      file: test.location.file,
      line: test.location.line,
      project: test.parent.project()?.name
    });

    console.log(`🧪 ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const duration = result.duration;
    const status = result.status;

    const apiCalls = this.extractApiCallCount(result);
    const errors = this.extractErrors(result);

    this.testResults.push({
      test,
      result,
      duration,
      apiCalls,
      errors
    });

    this.logger.logTestEnd(test.title, status as any, duration, errors?.[0]);

    const statusEmoji = this.getStatusEmoji(status);
    const durationText = `${duration}ms`;
    const apiCallsText = apiCalls ? ` (${apiCalls} API calls)` : '';

    console.log(`  ${statusEmoji} ${status.toUpperCase()} - ${durationText}${apiCallsText}`);

    if (errors && errors.length > 0) {
      console.log(`    ❌ Error: ${errors[0]}`);
    }
  }

  onEnd(_result: FullResult) {
    const endTime = new Date();
    const totalDuration = endTime.getTime() - this.startTime.getTime();

    const summary = this.generateSummary(totalDuration);
    this.logger.info('Test run completed', summary);

    this.printConsoleSummary(summary, totalDuration);
    this.generateJsonReport(summary, totalDuration);
    this.generateHtmlReport(summary, totalDuration);
    this.generateApiMetricsReport();

    console.log(`\n Reports generated in: ${this.outputDir}`);
  }

  // Extract API call count from test output for metrics
  private extractApiCallCount(result: TestResult): number {
    const stdout = result.stdout.join('');
    const apiCallMatches = stdout.match(/API Request:/g);
    return apiCallMatches ? apiCallMatches.length : 0;
  }

  private extractErrors(result: TestResult): string[] {
    const errors: string[] = [];

    if (result.error) {
      errors.push(result.error.message || 'Unknown error');
    }

    const stderr = result.stderr.join('');
    if (stderr) {
      errors.push(stderr);
    }

    return errors;
  }

  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      'passed': '✅',
      'failed': '❌',
      'skipped': '⏭️',
      'timedOut': '⏰',
      'interrupted': '🛑'
    };
    return emojis[status] || '❓';
  }

  private generateSummary(totalDuration: number) {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.result.status === 'passed').length;
    const failed = this.testResults.filter(r => r.result.status === 'failed').length;
    const skipped = this.testResults.filter(r => r.result.status === 'skipped').length;
    const timedOut = this.testResults.filter(r => r.result.status === 'timedOut').length;

    const totalApiCalls = this.testResults.reduce((sum, r) => sum + (r.apiCalls || 0), 0);
    const averageTestDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / total;
    const slowestTest = this.testResults.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest
    );
    const fastestTest = this.testResults.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest
    );

    return {
      total,
      passed,
      failed,
      skipped,
      timedOut,
      totalDuration,
      totalApiCalls,
      averageTestDuration,
      slowestTest: {
        title: slowestTest.test.title,
        duration: slowestTest.duration
      },
      fastestTest: {
        title: fastestTest.test.title,
        duration: fastestTest.duration
      },
      successRate: (passed / total) * 100
    };
  }

  private printConsoleSummary(summary: any, totalDuration: number) {
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    console.log(`📊 Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⏭️  Skipped: ${summary.skipped}`);
    console.log(`⏰ Timed Out: ${summary.timedOut}`);
    console.log(`📈 Success Rate: ${summary.successRate.toFixed(2)}%`);
    console.log(`🌐 Total API Calls: ${summary.totalApiCalls}`);
    console.log(`⚡ Average Test Duration: ${summary.averageTestDuration.toFixed(2)}ms`);
    console.log(`🐌 Slowest Test: ${summary.slowestTest.title} (${summary.slowestTest.duration}ms)`);
    console.log(`🚀 Fastest Test: ${summary.fastestTest.title} (${summary.fastestTest.duration}ms)`);
    console.log('='.repeat(60));
  }

  private generateJsonReport(summary: any, _totalDuration: number) {
    const report = {
      summary,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      tests: this.testResults.map(r => ({
        title: r.test.title,
        file: r.test.location.file,
        line: r.test.location.line,
        status: r.result.status,
        duration: r.duration,
        apiCalls: r.apiCalls,
        errors: r.errors,
        retry: r.result.retry
      }))
    };

    const reportPath = path.join(this.outputDir, 'api-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.logger.info('JSON report generated', { path: reportPath });
  }

  private generateHtmlReport(summary: any, _totalDuration: number) {
    const html = this.generateHtmlContent(summary);
    const reportPath = path.join(this.outputDir, 'api-test-report.html');
    fs.writeFileSync(reportPath, html);
    this.logger.info('HTML report generated', { path: reportPath });
  }

  private generateApiMetricsReport() {
    const metrics = {
      totalApiCalls: this.testResults.reduce((sum, r) => sum + (r.apiCalls || 0), 0),
      averageApiCallsPerTest: this.testResults.reduce((sum, r) => sum + (r.apiCalls || 0), 0) / this.testResults.length,
      testsWithApiCalls: this.testResults.filter(r => (r.apiCalls || 0) > 0).length,
      apiCallDistribution: this.getApiCallDistribution()
    };

    const reportPath = path.join(this.outputDir, 'api-metrics.json');
    fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));
    this.logger.info('API metrics report generated', { path: reportPath });
  }

  private getApiCallDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    this.testResults.forEach(r => {
      const calls = r.apiCalls || 0;
      const range = this.getApiCallRange(calls);
      distribution[range] = (distribution[range] || 0) + 1;
    });

    return distribution;
  }

  private getApiCallRange(calls: number): string {
    if (calls === 0) return '0 calls';
    if (calls <= 5) return '1-5 calls';
    if (calls <= 10) return '6-10 calls';
    if (calls <= 20) return '11-20 calls';
    return '20+ calls';
  }

  private generateHtmlContent(summary: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>API Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; color: #007acc; }
        .tests { margin-top: 30px; }
        .test { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .test.passed { border-left: 5px solid #4caf50; }
        .test.failed { border-left: 5px solid #f44336; }
        .test.skipped { border-left: 5px solid #ff9800; }
        .test-title { font-weight: bold; margin-bottom: 5px; }
        .test-details { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 API Test Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${summary.total}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div class="value">${summary.successRate.toFixed(1)}%</div>
        </div>
        <div class="metric">
            <h3>API Calls</h3>
            <div class="value">${summary.totalApiCalls}</div>
        </div>
        <div class="metric">
            <h3>Avg Duration</h3>
            <div class="value">${summary.averageTestDuration.toFixed(0)}ms</div>
        </div>
    </div>

    <div class="tests">
        <h2>Test Results</h2>
        ${this.testResults.map(r => `
            <div class="test ${r.result.status}">
                <div class="test-title">${r.test.title}</div>
                <div class="test-details">
                    Status: ${r.result.status} |
                    Duration: ${r.duration}ms |
                    API Calls: ${r.apiCalls || 0}
                    ${r.errors && r.errors.length > 0 ? `<br>Error: ${r.errors[0]}` : ''}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }
}

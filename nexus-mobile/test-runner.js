#!/usr/bin/env node
// test-runner.js
// Comprehensive test runner for Nexus Mobile AI features

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.results = {
      e2e: { passed: 0, failed: 0, duration: 0 },
      unit: { passed: 0, failed: 0, duration: 0 },
      performance: { passed: 0, failed: 0, duration: 0 }
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${level}] ${timestamp} - ${message}`);
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const child = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (options.verbose) {
          process.stdout.write(data);
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (options.verbose) {
          process.stderr.write(data);
        }
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        resolve({
          code,
          stdout,
          stderr,
          duration
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runE2ETests() {
    this.log('Starting End-to-End AI Tests...');
    
    try {
      const result = await this.runCommand('node', ['e2e-ai-test-suite.js'], {
        cwd: process.cwd(),
        verbose: true
      });

      this.results.e2e.duration = result.duration;
      
      if (result.code === 0) {
        this.results.e2e.passed = this.extractTestCount(result.stdout, 'passed');
        this.log(`E2E Tests completed successfully in ${result.duration}ms`);
      } else {
        this.results.e2e.failed = this.extractTestCount(result.stdout, 'failed');
        this.log(`E2E Tests failed with exit code ${result.code}`, 'ERROR');
      }

      return result.code === 0;
    } catch (error) {
      this.log(`E2E Tests error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runUnitTests() {
    this.log('Starting Unit Tests...');
    
    try {
      const result = await this.runCommand('npm', ['test', '--', '--coverage'], {
        cwd: process.cwd(),
        verbose: true
      });

      this.results.unit.duration = result.duration;
      
      if (result.code === 0) {
        this.results.unit.passed = this.extractJestTestCount(result.stdout, 'passed');
        this.log(`Unit Tests completed successfully in ${result.duration}ms`);
      } else {
        this.results.unit.failed = this.extractJestTestCount(result.stdout, 'failed');
        this.log(`Unit Tests failed with exit code ${result.code}`, 'ERROR');
      }

      return result.code === 0;
    } catch (error) {
      this.log(`Unit Tests error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runPerformanceTests() {
    this.log('Starting Performance Tests...');
    
    try {
      const result = await this.runCommand('npm', ['test', '__tests__/ai-performance.test.js'], {
        cwd: process.cwd(),
        verbose: true
      });

      this.results.performance.duration = result.duration;
      
      if (result.code === 0) {
        this.results.performance.passed = this.extractJestTestCount(result.stdout, 'passed');
        this.log(`Performance Tests completed successfully in ${result.duration}ms`);
      } else {
        this.results.performance.failed = this.extractJestTestCount(result.stdout, 'failed');
        this.log(`Performance Tests failed with exit code ${result.code}`, 'ERROR');
      }

      return result.code === 0;
    } catch (error) {
      this.log(`Performance Tests error: ${error.message}`, 'ERROR');
      return false;
    }
  }

  extractTestCount(output, type) {
    const regex = new RegExp(`${type}:\\s*(\\d+)`, 'i');
    const match = output.match(regex);
    return match ? parseInt(match[1]) : 0;
  }

  extractJestTestCount(output, type) {
    if (type === 'passed') {
      const match = output.match(/(\d+)\s+passed/);
      return match ? parseInt(match[1]) : 0;
    } else if (type === 'failed') {
      const match = output.match(/(\d+)\s+failed/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  generateReport() {
    const totalPassed = this.results.e2e.passed + this.results.unit.passed + this.results.performance.passed;
    const totalFailed = this.results.e2e.failed + this.results.unit.failed + this.results.performance.failed;
    const totalDuration = this.results.e2e.duration + this.results.unit.duration + this.results.performance.duration;

    const report = {
      summary: {
        total_tests: totalPassed + totalFailed,
        passed: totalPassed,
        failed: totalFailed,
        success_rate: totalPassed + totalFailed > 0 ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(2) : 0,
        total_duration_ms: totalDuration,
        timestamp: new Date().toISOString()
      },
      details: {
        e2e_tests: this.results.e2e,
        unit_tests: this.results.unit,
        performance_tests: this.results.performance
      },
      recommendations: this.generateRecommendations()
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.e2e.failed > 0) {
      recommendations.push('E2E tests failed - check API connectivity and authentication');
    }

    if (this.results.unit.failed > 0) {
      recommendations.push('Unit tests failed - review component logic and mocking');
    }

    if (this.results.performance.failed > 0) {
      recommendations.push('Performance tests failed - optimize AI response times and memory usage');
    }

    if (this.results.e2e.duration > 60000) {
      recommendations.push('E2E tests taking too long - consider parallel execution');
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests passed! AI features are fully optimized and configured.');
    }

    return recommendations;
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(80));
    console.log('NEXUS MOBILE AI TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${report.summary.total_tests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Success Rate: ${report.summary.success_rate}%`);
    console.log(`Total Duration: ${(report.summary.total_duration_ms / 1000).toFixed(2)}s`);
    console.log('\nTest Breakdown:');
    console.log(`  E2E Tests: ${report.details.e2e_tests.passed} passed, ${report.details.e2e_tests.failed} failed`);
    console.log(`  Unit Tests: ${report.details.unit_tests.passed} passed, ${report.details.unit_tests.failed} failed`);
    console.log(`  Performance Tests: ${report.details.performance_tests.passed} passed, ${report.details.performance_tests.failed} failed`);
    
    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }
    
    console.log('='.repeat(80));
  }

  async run() {
    this.log('Starting Comprehensive AI Test Suite for Nexus Mobile Application');
    
    const startTime = Date.now();
    
    // Run all test suites
    const e2eSuccess = await this.runE2ETests();
    const unitSuccess = await this.runUnitTests();
    const performanceSuccess = await this.runPerformanceTests();
    
    const totalDuration = Date.now() - startTime;
    
    // Generate and display report
    const report = this.generateReport();
    this.printSummary(report);
    
    // Exit with appropriate code
    const allTestsPassed = e2eSuccess && unitSuccess && performanceSuccess;
    process.exit(allTestsPassed ? 0 : 1);
  }
}

// Health check function
async function healthCheck() {
  const runner = new TestRunner();
  
  runner.log('Performing AI Services Health Check...');
  
  try {
    // Check if required dependencies are installed
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['jest', '@testing-library/react-native', 'axios'];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missingDeps.length > 0) {
      runner.log(`Missing dependencies: ${missingDeps.join(', ')}`, 'ERROR');
      return false;
    }
    
    // Check if test files exist
    const testFiles = [
      'e2e-ai-test-suite.js',
      '__tests__/ai-features.test.js',
      '__tests__/ai-performance.test.js'
    ];
    
    const missingFiles = testFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      runner.log(`Missing test files: ${missingFiles.join(', ')}`, 'ERROR');
      return false;
    }
    
    runner.log('Health check passed - all dependencies and test files are present');
    return true;
    
  } catch (error) {
    runner.log(`Health check failed: ${error.message}`, 'ERROR');
    return false;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--health-check')) {
    healthCheck().then(success => process.exit(success ? 0 : 1));
  } else if (args.includes('--e2e-only')) {
    const runner = new TestRunner();
    runner.runE2ETests().then(success => process.exit(success ? 0 : 1));
  } else if (args.includes('--unit-only')) {
    const runner = new TestRunner();
    runner.runUnitTests().then(success => process.exit(success ? 0 : 1));
  } else if (args.includes('--performance-only')) {
    const runner = new TestRunner();
    runner.runPerformanceTests().then(success => process.exit(success ? 0 : 1));
  } else {
    const runner = new TestRunner();
    runner.run();
  }
}

module.exports = { TestRunner, healthCheck };
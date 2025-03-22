#!/bin/bash
set -e

# Script to run security and privacy tests
# and generate a report in JSON format

# Create results directory
mkdir -p test-results

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running security tests...${NC}"

# Run API fuzzing tests
echo -e "${YELLOW}Running API fuzzing tests...${NC}"
npx jest tests/security/api-fuzzing.test.ts --json --outputFile=test-results/api-fuzzing.json || true

# Run privacy GDPR tests
echo -e "${YELLOW}Running privacy GDPR tests...${NC}"
npx jest tests/security/privacy-gdpr.test.ts --json --outputFile=test-results/privacy-gdpr.json || true

# Run UI security tests
echo -e "${YELLOW}Running UI security tests...${NC}"
npx jest tests/security/ui-security.test.tsx --json --outputFile=test-results/ui-security.json || true

# Combine results into one file
echo -e "${YELLOW}Generating combined test report...${NC}"
node -e "
const fs = require('fs');
const path = require('path');

const resultsDir = 'test-results';
const outputFile = path.join(resultsDir, 'security-test-report.json');

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

const files = fs.readdirSync(resultsDir).filter(file => file.endsWith('.json') && file !== 'security-test-report.json');

files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
    
    if (data.testResults) {
      data.testResults.forEach(result => {
        const testCategory = path.basename(file, '.json');
        
        result.testResults.forEach(test => {
          testResults.tests.push({
            category: testCategory,
            name: test.title,
            status: test.status,
            duration: test.duration
          });
          
          testResults.summary.total += 1;
          if (test.status === 'passed') testResults.summary.passed += 1;
          else if (test.status === 'failed') testResults.summary.failed += 1;
          else if (test.status === 'skipped' || test.status === 'pending') testResults.summary.skipped += 1;
        });
      });
    }
  } catch (error) {
    console.error('Error processing file:', file, error);
  }
});

fs.writeFileSync(outputFile, JSON.stringify(testResults, null, 2));
console.log('Security test report generated at', outputFile);
"

# Print summary
if [ -f test-results/security-test-report.json ]; then
  echo -e "${GREEN}Security test report generated successfully!${NC}"
  echo -e "${YELLOW}Summary:${NC}"
  node -e "
  const fs = require('fs');
  const report = JSON.parse(fs.readFileSync('test-results/security-test-report.json', 'utf8'));
  console.log('Total tests: ' + report.summary.total);
  console.log('Passed: ' + report.summary.passed);
  console.log('Failed: ' + report.summary.failed);
  console.log('Skipped: ' + report.summary.skipped);
  "
else
  echo -e "${RED}Failed to generate security test report!${NC}"
  exit 1
fi

echo -e "${GREEN}Done!${NC}"
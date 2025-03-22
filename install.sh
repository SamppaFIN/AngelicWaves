#!/bin/bash
set -e

# Print colored messages
print_green() {
  echo -e "\e[32m$1\e[0m"
}

print_yellow() {
  echo -e "\e[33m$1\e[0m"
}

print_red() {
  echo -e "\e[31m$1\e[0m"
}

# Installation process
print_green "=== Starting Angelic Frequency Detector Installation ==="

# Check for Node.js
if ! command -v node &> /dev/null; then
  print_red "Node.js is not installed. Please install Node.js 16 or higher."
  exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
  print_red "Node.js version is too old. Please upgrade to Node.js 16 or higher."
  exit 1
fi

print_green "Node.js version: $(node -v)"
print_green "NPM version: $(npm -v)"

# Install dependencies
print_yellow "Installing dependencies..."
npm ci || npm install

# Build the application
print_yellow "Building the application..."
npm run build

# Make test scripts executable
print_yellow "Setting up test environment..."
chmod +x run-tests.sh

# Run security tests
print_yellow "Running security tests..."
if ./run-tests.sh; then
  print_green "Security tests passed!"
else
  print_red "Security tests failed! Review the security report in test-results/security-test-report.json"
  print_yellow "You can still proceed with caution, but addressing security issues is recommended."
fi

print_green "=== Installation completed successfully! ==="
print_green "Run 'npm start' to start the application in production mode."
print_green "Run 'npm run dev' to start the application in development mode."
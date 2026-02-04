#!/bin/sh

# Xcode Cloud post-clone script
# This script runs after the repository is cloned

set -e

echo "Installing Node.js dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

echo "Installing CocoaPods..."
brew install cocoapods

echo "Installing iOS dependencies..."
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install

echo "Post-clone script completed successfully"

#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting development server...');

function executeCommand(command, description) {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (description) {
        console.log(`✓ ${description}`);
      }
      resolve();
    });
  });
}

async function cleanup() {
  console.log('🧹 Cleaning up...');
  
  // Kill any processes on port 5454
  await executeCommand('lsof -ti:5454 | xargs kill -9 2>/dev/null || true', 'Killed processes on port 5454');
  
  // Kill any Next.js processes
  await executeCommand('pkill -f "next dev" 2>/dev/null || true', 'Killed Next.js processes');
  
  // Kill any node processes running our project
  await executeCommand('pkill -f "pr-tracker" 2>/dev/null || true', 'Killed project processes');
  
  // Wait a moment for processes to die
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Remove cache directories
  const cacheDirs = ['.next', 'node_modules/.cache', '.vercel'];
  for (const dir of cacheDirs) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✓ Removed ${dir}`);
      }
    } catch (error) {
      // Ignore errors, just continue
    }
  }
  
  console.log('✓ Cleanup complete');
}

async function startServer() {
  console.log('🏃 Starting Next.js development server...');
  
  const nextProcess = spawn('npx', ['next', 'dev', '-p', '5454'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    nextProcess.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    nextProcess.kill('SIGTERM');
    process.exit(0);
  });

  nextProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
}

async function main() {
  try {
    await cleanup();
    await startServer();
  } catch (error) {
    console.error('❌ Failed to start development server:', error);
    process.exit(1);
  }
}

main(); 
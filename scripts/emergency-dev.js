#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');

console.log('🚨 Emergency development server startup...');

async function executeCommand(command) {
  return new Promise((resolve) => {
    exec(command, () => resolve());
  });
}

async function aggressiveCleanup() {
  console.log('💀 Performing aggressive cleanup...');
  
  // Nuclear option - kill everything related
  const commands = [
    'sudo pkill -f "next"',
    'sudo pkill -f "node.*5454"',
    'sudo pkill -f "pr-tracker"',
    'sudo lsof -ti:5454 | xargs sudo kill -9',
    'sudo lsof -ti:3000 | xargs sudo kill -9', // Just in case
    'sudo lsof -ti:3001 | xargs sudo kill -9'
  ];

  for (const cmd of commands) {
    await executeCommand(cmd + ' 2>/dev/null || true');
  }

  // Wait longer
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Remove everything
  const dirsToRemove = ['.next', 'node_modules/.cache', '.vercel', 'out', 'dist'];
  for (const dir of dirsToRemove) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✓ Nuked ${dir}`);
      }
    } catch (error) {
      await executeCommand(`sudo rm -rf ${dir} 2>/dev/null || true`);
    }
  }

  console.log('✓ Aggressive cleanup complete');
}

async function main() {
  await aggressiveCleanup();
  
  console.log('🏃 Starting server on a clear field...');
  const nextProcess = spawn('npx', ['next', 'dev', '-p', '5454'], {
    stdio: 'inherit'
  });

  process.on('SIGINT', () => {
    nextProcess.kill('SIGTERM');
    process.exit(0);
  });
}

main(); 
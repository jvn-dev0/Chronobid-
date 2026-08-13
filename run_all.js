const { spawn } = require('child_process');
const path = require('path');

// Configuration for all the services we need to run
const services = [
  {
    name: 'Frontend (Next.js)',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'credentials'),
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'Main Backend (Port 8000)',
    command: 'python',
    args: ['-m', 'uvicorn', 'main:app', '--port', '8000', '--reload'],
    cwd: path.join(__dirname, 'backend'),
    color: '\x1b[32m' // Green
  },
  {
    name: 'Item Verification AI (Port 8001)',
    command: 'python',
    args: ['-m', 'uvicorn', 'app:app', '--port', '8001', '--reload'],
    cwd: path.join(__dirname, 'Ai', 'item-verification'),
    color: '\x1b[33m' // Yellow
  },
  {
    name: 'Identity Verification AI (Port 8003)',
    command: 'python',
    args: ['-m', 'uvicorn', 'app:app', '--port', '8003', '--reload'],
    cwd: path.join(__dirname, 'Ai', 'identity-verification'),
    color: '\x1b[35m' // Magenta
  },
  {
    name: 'JasperBot AI (Port 8004)',
    command: 'python',
    args: ['-m', 'uvicorn', 'app:app', '--port', '8004', '--reload'],
    cwd: path.join(__dirname, 'Ai', 'jasper-bot'),
    color: '\x1b[34m' // Blue
  }
];

console.log('🚀 Starting all Chronobid services...\n');

const processes = [];

services.forEach(service => {
  console.log(`${service.color}Starting ${service.name}...\x1b[0m`);
  
  // Note: On Windows, we need to use 'npm.cmd' instead of 'npm'
  const cmd = process.platform === 'win32' && service.command === 'npm' ? 'npm.cmd' : service.command;
  
  const child = spawn(cmd, service.args, {
    cwd: service.cwd,
    stdio: 'pipe',
    shell: true // Use shell to handle virtual environments properly
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.log(`${service.color}[${service.name}]\x1b[0m ${line}`);
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.error(`${service.color}[${service.name}]\x1b[0m \x1b[31m${line}\x1b[0m`);
    });
  });

  child.on('close', (code) => {
    console.log(`${service.color}[${service.name}]\x1b[0m exited with code ${code}`);
  });

  processes.push(child);
});

// Handle graceful shutdown when pressing Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all services...');
  processes.forEach(p => {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', p.pid, '/f', '/t']);
    } else {
      p.kill('SIGTERM');
    }
  });
  setTimeout(() => process.exit(0), 1000);
});

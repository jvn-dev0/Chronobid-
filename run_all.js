const { spawn } = require('child_process');
const path = require('path');

// Configuration for all ChronoBid services
const services = [
  {
    name: 'Frontend (Next.js - Port 3000)',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'credentials'),
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'Power Admin (Port 3001)',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, 'admin-app'),
    color: '\x1b[95m' // Bright Magenta
  },
  {
    name: 'Main Backend (Port 8000)',
    command: 'python',
    args: ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'],
    cwd: path.join(__dirname, 'backend'),
    color: '\x1b[32m' // Green
  },
  {
    name: 'Item Verification AI (Port 8001)',
    command: 'python',
    args: ['-m', 'uvicorn', 'app:app', '--host', '0.0.0.0', '--port', '8001'],
    cwd: path.join(__dirname, 'Ai', 'item-verification'),
    color: '\x1b[33m' // Yellow
  },
  {
    name: 'Identity Verification AI (Port 8003)',
    command: 'python',
    args: ['-m', 'uvicorn', 'app:app', '--host', '0.0.0.0', '--port', '8003'],
    cwd: path.join(__dirname, 'Ai', 'identity-verification'),
    color: '\x1b[35m' // Magenta
  },
  {
    name: 'JasperBot AI (Port 8004)',
    command: 'python',
    args: ['-m', 'uvicorn', 'app:app', '--host', '0.0.0.0', '--port', '8004'],
    cwd: path.join(__dirname, 'Ai', 'jasper-bot'),
    color: '\x1b[34m' // Blue
  }
];

console.log('🚀 Starting all ChronoBid services...\n');

const processes = [];

services.forEach(service => {
  console.log(`${service.color}Starting ${service.name}...\x1b[0m`);
  
  const cmd = process.platform === 'win32' && service.command === 'npm' ? 'npm.cmd' : service.command;
  
  const child = spawn(cmd, service.args, {
    cwd: service.cwd,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
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

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down all services...');
  processes.forEach(p => {
    if (process.platform === 'win32') {
      try { spawn('taskkill', ['/pid', p.pid, '/f', '/t']); } catch {}
    } else {
      p.kill('SIGTERM');
    }
  });
  setTimeout(() => process.exit(0), 1000);
});

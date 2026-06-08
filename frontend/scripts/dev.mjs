import { spawn } from 'node:child_process';

const processes = [
  {
    name: 'api',
    color: '\u001b[36m',
    command: 'node',
    args: ['--experimental-strip-types', '../backend/src/index.ts'],
  },
  {
    name: 'web',
    color: '\u001b[35m',
    command: 'npx',
    args: ['vite', '--port=3000', '--host=0.0.0.0'],
  },
];

const children = processes.map(({ name, color, command, args }) => {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`${color}[${name}]\u001b[0m ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`${color}[${name}]\u001b[0m ${chunk}`);
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
});

function shutdown(signal) {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

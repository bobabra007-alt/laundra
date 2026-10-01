import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === 'production') {
  const missing = ['DATABASE_URL', 'AUTH_SECRET', 'ADMIN_PASSWORD'].filter(key => !process.env[key]);
  if (missing.length) throw new Error(`Добавьте в Vercel → Environment Variables: ${missing.join(', ')}`);
  if (process.env.AUTH_SECRET.length < 32) throw new Error('AUTH_SECRET должен содержать минимум 32 символа. Используйте START-HERE.html.');
  if (process.env.ADMIN_PASSWORD.length < 12 || new TextEncoder().encode(process.env.ADMIN_PASSWORD).length > 72) throw new Error('ADMIN_PASSWORD: минимум 12 символов, максимум 72 байта UTF-8.');
}

run('npx', ['--no-install', 'prisma', 'generate']);
// Only the Production deployment initializes the database and first administrator.
// Preview builds never migrate or seed the production database.
if (process.env.VERCEL_ENV === 'production') {
  run('npx', ['--no-install', 'prisma', 'migrate', 'deploy']);
  run('npx', ['--no-install', 'tsx', 'prisma/seed.ts']);
}
run('npx', ['--no-install', 'next', 'build']);

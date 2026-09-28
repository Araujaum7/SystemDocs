import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const runtimeDirectory = resolve('test-results/runtime');
const databasePath = resolve(runtimeDirectory, 'documentospro-ui.db');

await mkdir(runtimeDirectory, { recursive: true });

for (const suffix of ['', '-shm', '-wal']) {
  await rm(`${databasePath}${suffix}`, { force: true });
}

// Prevent application bootstrap from copying the user's database into the test path.
await writeFile(databasePath, '');

process.env.DATABASE_PATH = databasePath;
process.env.PORT = '7101';
process.env.MASTER_BOOTSTRAP_PASSWORD = 'admin123456';
process.env.JWT_SECRET = 'documentospro_ui_tests_secret_1234567890';

await import('../../backend/server.js');

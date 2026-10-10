#!/usr/bin/env node
// Fails when the committed API contract is stale. Run after changing any controller or DTO:
//   npm run api:generate   (fix)      npm run api:check   (verify, used by CI)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const tmp = mkdtempSync(join(tmpdir(), 'contract-'));
const run = (cmd, args, cwd) => {
  try {
    return execFileSync(cmd, args, { cwd, stdio: 'pipe', shell: process.platform === 'win32' });
  } catch (error) {
    console.error(`Command failed: ${cmd} ${args.join(' ')}\n${error.stdout ?? ''}${error.stderr ?? ''}`);
    process.exit(2);
  }
};

try {
  run(npm, ['run', 'build'], join(root, 'apps/backend'));
  const specTmp = join(tmp, 'openapi.json');
  run('node', ['dist/openapi.js', specTmp], join(root, 'apps/backend'));
  const typesTmp = join(tmp, 'schema.d.ts');
  run(npx, ['openapi-typescript', join(root, 'docs/openapi.json'), '-o', typesTmp], join(root, 'packages/api-types'));

  const stale = [];
  if (readFileSync(specTmp, 'utf8') !== readFileSync(join(root, 'docs/openapi.json'), 'utf8')) stale.push('docs/openapi.json');
  if (readFileSync(typesTmp, 'utf8') !== readFileSync(join(root, 'packages/api-types/src/schema.d.ts'), 'utf8')) stale.push('packages/api-types/src/schema.d.ts');
  if (stale.length > 0) {
    console.error(`Contract is stale: ${stale.join(', ')}\nRun: npm run api:generate`);
    process.exit(1);
  }
  console.log('API contract is up to date.');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

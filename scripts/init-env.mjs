#!/usr/bin/env node
// Creates every missing .env from its .env.example, filling generated secrets.
// Cross-platform (macOS, Windows, Linux). Never overwrites an existing .env.
//   node scripts/init-env.mjs          create missing .env files
//   node scripts/init-env.mjs --force  regenerate all (asks nothing: use with care)
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');

// Add a new app by adding its folder here.
const targets = ['.', 'apps/backend', 'apps/web', 'apps/edge-ai'];

const secret = () => randomBytes(24).toString('hex');
// Values shared across files must be identical, so generate them once.
const shared = {
  __DB_PASSWORD__: secret(),
  __EDGE_TOKEN__: secret(),
  __DEVICE_TOKEN__: secret(),
};

// Reuse values from an existing backend/root .env so a partial re-run stays consistent.
function existing(file, key) {
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line?.slice(key.length + 1);
}
const rootEnv = join(root, '.env');
const backendEnv = join(root, 'apps/backend/.env');
shared.__DB_PASSWORD__ = existing(rootEnv, 'POSTGRES_PASSWORD') ?? shared.__DB_PASSWORD__;
shared.__EDGE_TOKEN__ = existing(backendEnv, 'EDGE_API_TOKEN') ?? shared.__EDGE_TOKEN__;
shared.__DEVICE_TOKEN__ = existing(backendEnv, 'DEVICE_API_TOKEN') ?? shared.__DEVICE_TOKEN__;

for (const dir of targets) {
  const example = join(root, dir, '.env.example');
  const target = join(root, dir, '.env');
  if (!existsSync(example)) continue;
  if (existsSync(target) && !force) {
    console.log(`skip    ${join(dir, '.env')} (exists)`);
    continue;
  }
  let text = readFileSync(example, 'utf8');
  for (const [placeholder, value] of Object.entries(shared)) text = text.replaceAll(placeholder, value);
  // Any remaining generic placeholder gets its own random secret.
  text = text.replaceAll('__GENERATE__', () => secret());
  writeFileSync(target, text);
  console.log(`created ${join(dir, '.env')}`);
}
console.log('\nFirmware: copy iot/esp32-alert/secrets.h.example to secrets.h and fill it by hand.');
console.log('DEVICE_API_TOKEN for the ESP32 is in apps/backend/.env.');

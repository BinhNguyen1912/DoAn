/**
 * Writes the OpenAPI document without needing a database:
 *   npm run openapi:generate -w apps/backend [-- <output-path>]
 * The committed docs/openapi.json is the API contract for web, mobile and edge-ai.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Placeholders satisfy env validation; nothing connects because the app runs in preview mode.
process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder';
process.env.EDGE_API_TOKEN ??= 'x'.repeat(16);
process.env.DEVICE_API_TOKEN ??= 'y'.repeat(16);
process.env.ESP32_BASE_URL ??= 'http://127.0.0.1';

const { NestFactory } = await import('@nestjs/core');
const { AppModule } = await import('./app.module.js');
const { buildOpenApiDocument, configureApp } = await import('./app.setup.js');

const output = resolve(process.argv[2] ?? '../../docs/openapi.json');
const app = await NestFactory.create(AppModule, { preview: true, logger: false });
configureApp(app);
const document = buildOpenApiDocument(app);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`);
console.log(`wrote ${output}`);
await app.close();

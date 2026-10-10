import { TEST_TOKENS, testDatabaseUrl } from './test-env.js';

process.env.DATABASE_URL = testDatabaseUrl();
process.env.EDGE_API_TOKEN = TEST_TOKENS.edge;
process.env.DEVICE_API_TOKEN = TEST_TOKENS.device;
process.env.ESP32_BASE_URL ??= 'http://127.0.0.1:9';
process.env.NODE_ENV = 'test';

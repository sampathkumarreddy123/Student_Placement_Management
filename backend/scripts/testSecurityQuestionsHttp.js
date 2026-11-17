import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import authRoutes from '../routes/authRoutes.js';
import { notFound, errorHandler } from '../middleware/errorMiddleware.js';

// Setup isolated express app to test route matching
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes identically to server.js
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/', authRoutes);

app.use(notFound);
app.use(errorHandler);

const simulateRequest = (method, url, body = {}) => {
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      originalUrl: url,
      baseUrl: '',
      path: url.split('?')[0],
      query: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' },
      headers: { 'content-type': 'application/json' },
      body,
      get: (h) => (h.toLowerCase() === 'host' ? 'localhost:5000' : null),
    };

    if (url.includes('?')) {
      const qStr = url.split('?')[1];
      const params = new URLSearchParams(qStr);
      for (const [k, v] of params.entries()) {
        req.query[k] = v;
      }
    }

    const res = {
      statusCode: 200,
      headers: {},
      setHeader: (k, v) => { res.headers[k] = v; },
      status: (code) => { res.statusCode = code; return res; },
      json: (data) => resolve({ status: res.statusCode, data }),
      send: (data) => resolve({ status: res.statusCode, data }),
    };

    app(req, res);
  });
};

async function runTests() {
  console.log('\n--- 1. Testing POST /api/auth/security-questions without body (should be 400, NOT 404) ---');
  const res1 = await simulateRequest('POST', '/api/auth/security-questions', {});
  console.log('Status:', res1.status, 'Message:', res1.data?.message);
  if (res1.status === 404) throw new Error('Failed: /api/auth/security-questions returned 404!');

  console.log('\n--- 2. Testing GET /api/auth/security-questions without query (should be 400, NOT 404) ---');
  const res2 = await simulateRequest('GET', '/api/auth/security-questions');
  console.log('Status:', res2.status, 'Message:', res2.data?.message);
  if (res2.status === 404) throw new Error('Failed: GET /api/auth/security-questions returned 404!');

  console.log('\n--- 3. Testing POST /auth/security-questions ---');
  const res3 = await simulateRequest('POST', '/auth/security-questions', {});
  console.log('Status:', res3.status, 'Message:', res3.data?.message);
  if (res3.status === 404) throw new Error('Failed: /auth/security-questions returned 404!');

  console.log('\n--- 4. Testing POST /api/security-questions (fallback) ---');
  const res4 = await simulateRequest('POST', '/api/security-questions', {});
  console.log('Status:', res4.status, 'Message:', res4.data?.message);
  if (res4.status === 404) throw new Error('Failed: /api/security-questions returned 404!');

  console.log('\n--- 5. Testing POST /security-questions (root fallback) ---');
  const res5 = await simulateRequest('POST', '/security-questions', {});
  console.log('Status:', res5.status, 'Message:', res5.data?.message);
  if (res5.status === 404) throw new Error('Failed: /security-questions returned 404!');

  console.log('\n--- 6. Testing GET /api/auth/verify-security-questions (should be 405 Method Not Allowed) ---');
  const res6 = await simulateRequest('GET', '/api/auth/verify-security-questions');
  console.log('Status:', res6.status, 'Message:', res6.data?.message);
  if (res6.status === 404) throw new Error('Failed: GET /api/auth/verify-security-questions returned 404!');

  console.log('\n--- 7. Testing POST /api/auth/verify-security-questions without body (should be 400) ---');
  const res7 = await simulateRequest('POST', '/api/auth/verify-security-questions', {});
  console.log('Status:', res7.status, 'Message:', res7.data?.message);
  if (res7.status === 404) throw new Error('Failed: /api/auth/verify-security-questions returned 404!');

  console.log('\n ALL 7 HTTP ROUTE TESTS PASSED SUCCESSFULLY! No 404 encountered on security-questions endpoints.');
}

runTests().catch(err => {
  console.error('\n Test Failure:', err.message);
  process.exit(1);
});

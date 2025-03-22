import * as fc from 'fast-check';
import supertest from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('API Security Fuzzing Tests', () => {
  let app: express.Express;
  let server: any;
  let request: any; // Using 'any' to bypass the TypeScript issue

  beforeAll(async () => {
    app = express();
    server = await registerRoutes(app);
    request = supertest(app);
  });

  afterAll((done) => {
    if (server && server.close) {
      server.close(done);
    } else {
      done();
    }
  });

  test('POST /api/frequency-reports should handle malformed JSON', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter(s => !isValidJSON(s)),
        async (invalidJson) => {
          const response = await request
            .post('/api/frequency-reports')
            .set('Content-Type', 'application/json')
            .send(invalidJson);
          
          // Should not crash the server
          expect(response.status).not.toBe(500);
          // Should reject with 400 Bad Request
          expect(response.status).toBe(400);
        }
      ),
      { numRuns: 25 } // Limit the number of test runs
    );
  });

  test('POST /api/frequency-reports should validate input payload', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          detectedFrequencies: fc.array(
            fc.record({
              frequency: fc.float(), // Use random floats instead of doubles
              duration: fc.float(), 
              timestamp: fc.integer(),
            }),
            { minLength: 0, maxLength: 100 }
          ),
          analysis: fc.string(),
          userNotes: fc.option(fc.string()),
        }),
        async (payload) => {
          const response = await request
            .post('/api/frequency-reports')
            .send(payload);
          
          // It should either be accepted (200) or rejected with validation error (400)
          // but never crash the server (500)
          expect(response.status).not.toBe(500);
        }
      ),
      { numRuns: 25 } // Limit the number of test runs
    );
  });

  test('API endpoints should be protected against path traversal', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().chain(s => fc.constant(s.replace(/[^.\/\\%]/g, ''))),
        async (pathTraversal) => {
          const response = await request.get(`/api/${pathTraversal}`);
          
          // Should not expose sensitive information
          expect(response.status).not.toBe(200);
          // No server errors (indicates security issue handling paths)
          expect(response.status).not.toBe(500);
        }
      ),
      { numRuns: 25 } // Limit the number of test runs
    );
  });
});

// Helper to check if a string is valid JSON
function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
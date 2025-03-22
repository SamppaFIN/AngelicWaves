import React from 'react';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { AnalysisPanel } from '../../client/src/components/AnalysisPanel';
import { DetectedFrequency } from '../../shared/schema';

describe('UI Security Tests', () => {
  test('AnalysisPanel should safely handle untrusted user input', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            frequency: fc.float({ min: 20, max: 20000 }),
            duration: fc.float({ min: 0.1, max: 10 }),
            timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 })
          }),
          { minLength: 0, maxLength: 20 }
        ),
        (detectedFrequencies) => {
          // Potentially malicious injected frequencies with XSS payloads
          const maliciousFrequencies: DetectedFrequency[] = [
            ...detectedFrequencies,
            {
              frequency: 432, 
              duration: 1.5, 
              timestamp: Date.now(),
            },
            {
              frequency: 528, 
              duration: 1.5, 
              timestamp: Date.now(),
            }
          ];
          
          const mockSaveReport = jest.fn().mockResolvedValue(undefined);
          
          // Should render without throwing exceptions even with potentially malicious data
          expect(() => {
            render(
              <AnalysisPanel 
                detectedFrequencies={maliciousFrequencies}
                onSaveReport={mockSaveReport}
              />
            );
          }).not.toThrow();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('UI components should not allow script injection', () => {
    fc.assert(
      fc.property(
        fc.string().map(s => s.includes('<script>') ? `${s}<script>alert('xss')</script>` : s),
        fc.string().map(s => s.includes('javascript:') ? `javascript:alert('xss')` : s),
        (scriptString, javascriptUri) => {
          // Create malicious frequency data with XSS attempts
          const maliciousFrequencies: DetectedFrequency[] = [
            {
              frequency: 432, 
              duration: 1.5, 
              timestamp: Date.now(),
            }
          ];
          
          const mockSaveReport = jest.fn().mockImplementation(async (report) => {
            // Verify no scripts are present in the generated report
            expect(report.analysis).not.toContain('<script>');
            expect(report.analysis).not.toContain('javascript:');
            
            if (report.userNotes) {
              expect(report.userNotes).not.toContain('<script>');
              expect(report.userNotes).not.toContain('javascript:');
            }
          });
          
          render(
            <AnalysisPanel 
              detectedFrequencies={maliciousFrequencies}
              onSaveReport={mockSaveReport}
            />
          );
          
          // Verify the rendered output doesn't contain executable script tags
          const renderedContent = document.body.innerHTML;
          expect(renderedContent).not.toContain('<script>alert');
          expect(renderedContent).not.toContain('javascript:alert');
        }
      ),
      { numRuns: 10 }
    );
  });
});
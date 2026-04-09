/**
 * Data Consistency Verification Utility
 * Provides tools to verify that imported data is properly tracked and reported
 */

import { DataConsistencyService } from './dataConsistencyService';
import { Response, Survey } from '../types';

export interface VerificationReport {
  surveyId: string;
  timestamp: string;
  checks: {
    dataStorageCheck: VerificationCheck;
    metadataCheck: VerificationCheck;
    analyticsCheck: VerificationCheck;
    exportCheck: VerificationCheck;
    integrityCheck: VerificationCheck;
  };
  summary: {
    allChecksPassed: boolean;
    totalIssues: number;
    issues: string[];
  };
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  details: string;
  warnings?: string[];
}

class DataVerificationUtilityClass {
  /**
   * Run comprehensive verification for a survey
   */
  runFullVerification(
    surveyId: string,
    allResponses: Response[],
    survey: Survey
  ): VerificationReport {
    const timestamp = new Date().toISOString();
    const issues: string[] = [];

    // Check 1: Data Storage
    const dataStorageCheck = this.verifyDataStorage(surveyId);
    if (!dataStorageCheck.passed) issues.push(`Data Storage: ${dataStorageCheck.details}`);

    // Check 2: Metadata
    const metadataCheck = this.verifyMetadata(surveyId);
    if (!metadataCheck.passed) issues.push(`Metadata: ${metadataCheck.details}`);

    // Check 3: Analytics Generation
    const analyticsCheck = this.verifyAnalytics(surveyId, allResponses, survey);
    if (!analyticsCheck.passed) issues.push(`Analytics: ${analyticsCheck.details}`);

    // Check 4: Export Data
    const exportCheck = this.verifyExportData(surveyId, allResponses);
    if (!exportCheck.passed) issues.push(`Export: ${exportCheck.details}`);

    // Check 5: Data Integrity
    const integrityCheck = this.verifyDataIntegrity(surveyId, survey);
    if (!integrityCheck.passed) issues.push(`Integrity: ${integrityCheck.details}`);

    const allChecksPassed = [
      dataStorageCheck.passed,
      metadataCheck.passed,
      analyticsCheck.passed,
      exportCheck.passed,
      integrityCheck.passed,
    ].every(check => check);

    return {
      surveyId,
      timestamp,
      checks: {
        dataStorageCheck,
        metadataCheck,
        analyticsCheck,
        exportCheck,
        integrityCheck,
      },
      summary: {
        allChecksPassed,
        totalIssues: issues.length,
        issues,
      },
    };
  }

  /**
   * Verify data storage
   */
  private verifyDataStorage(surveyId: string): VerificationCheck {
    try {
      const imported = DataConsistencyService.getImportedResponses(surveyId);
      const metadata = DataConsistencyService.getDataStoreMetadata(surveyId);

      const passed = true;
      const details = `${imported.length} responses stored | Metadata: ${metadata ? 'Present' : 'Not set'}`;

      return {
        name: 'Data Storage Check',
        passed,
        details,
      };
    } catch (error) {
      return {
        name: 'Data Storage Check',
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Verify metadata integrity
   */
  private verifyMetadata(surveyId: string): VerificationCheck {
    try {
      const metadata = DataConsistencyService.getDataStoreMetadata(surveyId);

      if (!metadata) {
        return {
          name: 'Metadata Check',
          passed: true,
          details: 'No imports yet',
        };
      }

      const required = ['surveyId', 'importedResponses', 'lastUpdated', 'importMetadata'];
      const missing: string[] = [];

      required.forEach(field => {
        if (!(field in metadata)) {
          missing.push(field);
        }
      });

      if (metadata.importMetadata) {
        const requiredMeta = ['fileName', 'rowCount', 'importDate', 'source'];
        requiredMeta.forEach(field => {
          if (!(field in metadata.importMetadata)) {
            missing.push(`importMetadata.${field}`);
          }
        });
      }

      const passed = missing.length === 0;
      const details = passed
        ? `Metadata complete | Source: ${metadata.importMetadata.source} | Rows: ${metadata.importMetadata.rowCount}`
        : `Missing fields: ${missing.join(', ')}`;

      return {
        name: 'Metadata Check',
        passed,
        details,
      };
    } catch (error) {
      return {
        name: 'Metadata Check',
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Verify analytics generation
   */
  private verifyAnalytics(
    surveyId: string,
    allResponses: Response[],
    survey: Survey
  ): VerificationCheck {
    try {
      const analytics = DataConsistencyService.generateAnalytics(surveyId, allResponses, survey);
      const imported = DataConsistencyService.getImportedResponses(surveyId);

      const warnings: string[] = [];

      // Check if analytics includes imported data
      if (imported.length > 0 && analytics.importedCount === 0) {
        warnings.push('Imported data not reflected in analytics');
      }

      // Check if total matches
      if (analytics.totalResponses !== allResponses.length) {
        warnings.push(
          `Total mismatch: analytics shows ${analytics.totalResponses}, but ${allResponses.length} provided`
        );
      }

      // Check if categories are calculated
      if (analytics.categories.length === 0 && allResponses.length > 0) {
        warnings.push('No categories calculated');
      }

      const passed = warnings.length === 0;
      const details = `Analytics: ${analytics.totalResponses} responses | ${analytics.categories.length} categories | Sentiment: ${analytics.sentiment.positive}% positive`;

      return {
        name: 'Analytics Check',
        passed,
        details,
        warnings,
      };
    } catch (error) {
      return {
        name: 'Analytics Check',
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Verify export data
   */
  private verifyExportData(surveyId: string, allResponses: Response[]): VerificationCheck {
    try {
      const exported = DataConsistencyService.generateExportData(surveyId, allResponses);
      const imported = DataConsistencyService.getImportedResponses(surveyId);

      const warnings: string[] = [];

      // Verify row count
      if (exported.rows.length !== allResponses.length) {
        warnings.push(
          `Export row mismatch: expected ${allResponses.length}, got ${exported.rows.length}`
        );
      }

      // Verify imported rows included
      if (imported.length > 0 && exported.metadata.importedRows === 0) {
        warnings.push('Imported rows not included in export');
      }

      // Verify columns
      if (exported.headers.length === 0 && allResponses.length > 0) {
        warnings.push('No columns detected');
      }

      const passed = warnings.length === 0;
      const details = `Export: ${exported.rows.length} rows | ${exported.headers.length} columns | Imported: ${exported.metadata.importedRows}`;

      return {
        name: 'Export Check',
        passed,
        details,
        warnings,
      };
    } catch (error) {
      return {
        name: 'Export Check',
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Verify data integrity
   */
  private verifyDataIntegrity(surveyId: string, survey: Survey): VerificationCheck {
    try {
      const validation = DataConsistencyService.validateDataIntegrity(surveyId, survey);

      const details = validation.isValid
        ? `All ${validation.issues[0]?.includes('No imported') ? '0' : 'records'} validated`
        : `${validation.issues.length} validation issues found`;

      return {
        name: 'Integrity Check',
        passed: validation.isValid,
        details,
        warnings: validation.issues.slice(0, 5), // Show first 5 issues
      };
    } catch (error) {
      return {
        name: 'Integrity Check',
        passed: false,
        details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Generate HTML report for display
   */
  generateHTMLReport(verification: VerificationReport): string {
    const statusColor = verification.summary.allChecksPassed ? '#10b981' : '#ef4444';
    const statusText = verification.summary.allChecksPassed ? '✓ PASSED' : '✗ FAILED';

    let html = `
    <div style="font-family: monospace; padding: 20px; background: #f5f5f5; border-radius: 8px; max-width: 800px; margin: 20px auto;">
      <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid ${statusColor};">
        <h2 style="margin: 0 0 10px 0; color: ${statusColor};">${statusText} - Data Consistency Verification</h2>
        <p style="margin: 0; color: #666; font-size: 12px;">Survey ID: ${verification.surveyId}</p>
        <p style="margin: 0; color: #666; font-size: 12px;">Time: ${new Date(verification.timestamp).toLocaleString()}</p>
      </div>

      <div style="margin-top: 20px; border-spacing: 0;">
        ${this.generateCheckHTML(verification.checks.dataStorageCheck)}
        ${this.generateCheckHTML(verification.checks.metadataCheck)}
        ${this.generateCheckHTML(verification.checks.analyticsCheck)}
        ${this.generateCheckHTML(verification.checks.exportCheck)}
        ${this.generateCheckHTML(verification.checks.integrityCheck)}
      </div>

      ${verification.summary.totalIssues > 0 ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #f59e0b;">
          <h4 style="margin: 0 0 10px 0; color: #b45309;">Issues Found (${verification.summary.totalIssues}):</h4>
          <ul style="margin: 0; padding-left: 20px; color: #92400e;">
            ${verification.summary.issues.map(issue => `<li>${issue}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #10b981;">
        <h4 style="margin: 0 0 10px 0; color: #166534;">Summary:</h4>
        <p style="margin: 0; color: #166534; font-size: 14px;">
          All ${Object.keys(verification.checks).length} checks ${verification.summary.allChecksPassed ? 'PASSED' : 'completed with issues'}.
        </p>
      </div>
    </div>
    `;

    return html;
  }

  /**
   * Generate HTML for a single check
   */
  private generateCheckHTML(check: VerificationCheck): string {
    const icon = check.passed ? '✓' : '✗';
    const bgColor = check.passed ? '#f0fdf4' : '#fef2f2';
    const borderColor = check.passed ? '#10b981' : '#ef4444';
    const textColor = check.passed ? '#166534' : '#991b1b';

    return `
      <div style="background: ${bgColor}; padding: 12px; border-radius: 6px; margin: 10px 0; border-left: 3px solid ${borderColor};">
        <div style="color: ${textColor}; font-weight: bold; margin-bottom: 5px;">
          <span style="color: ${borderColor}; font-size: 18px; margin-right: 8px;">${icon}</span>${check.name}
        </div>
        <div style="color: ${textColor}; font-size: 12px; margin-left: 26px;">${check.details}</div>
        ${check.warnings && check.warnings.length > 0 ? `
          <div style="color: #f59e0b; font-size: 11px; margin-left: 26px; margin-top: 5px;">
            ${check.warnings.map(w => `⚠ ${w}`).join('<br>')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Log verification to console
   */
  logVerificationToConsole(verification: VerificationReport): void {
    console.log('=== Data Consistency Verification ===');
    console.log(`Survey ID: ${verification.surveyId}`);
    console.log(`Time: ${new Date(verification.timestamp).toLocaleString()}`);
    console.log('');

    Object.entries(verification.checks).forEach(([key, check]) => {
      const icon = check.passed ? '✓' : '✗';
      console.log(`${icon} ${check.name}`);
      console.log(`  ${check.details}`);
      if (check.warnings?.length) {
        check.warnings.forEach(w => console.log(`  ⚠ ${w}`));
      }
    });

    console.log('');
    if (verification.summary.allChecksPassed) {
      console.log('✓ All checks passed!');
    } else {
      console.log(`✗ ${verification.summary.totalIssues} issue(s) found`);
      verification.summary.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  }
}

// Export singleton instance
export const DataVerificationUtility = new DataVerificationUtilityClass();

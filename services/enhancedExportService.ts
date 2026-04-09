/**
 * Enhanced Export Wrapper
 * Ensures all imported data is included in exports
 * Bridges ExportService with DataConsistencyService
 */

import { ExportService } from './exportService';
import { DataConsistencyService } from './dataConsistencyService';
import { Response } from '../types';

export interface EnhancedExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  surveyId: string;
  surveyTitle: string;
  includeImportedDataOnly?: boolean;
  customBranding?: any;
  fileName?: string;
}

export class EnhancedExportService {
  /**
   * Export with guaranteed included imported data
   */
  static exportWithImportedData(
    responses: Response[],
    options: EnhancedExportOptions
  ): { content: string; fileName: string } {
    // Ensure imported responses are included
    const importedResponses = DataConsistencyService.getImportedResponses(options.surveyId);
    
    let dataToExport = responses;
    if (options.includeImportedDataOnly && importedResponses.length > 0) {
      dataToExport = importedResponses;
    } else if (importedResponses.length > 0) {
      // Merge, removing duplicates
      const responseIds = new Set(responses.map((r, idx) => `${r.surveyId}-${idx}`));
      const additionalImported = importedResponses.filter((r, idx) => {
        const id = `${r.surveyId}-${idx}`;
        return !responseIds.has(id);
      });
      dataToExport = [...responses, ...additionalImported];
    }

    // Convert to export format
    const exportData = dataToExport.map(r => ({
      ...r.answers,
      timestamp: r.timestamp,
      _importSource: r._importSource || 'mock',
      _importFileName: r._importFileName || '',
    }));

    let content = '';
    const fileName = options.fileName || ExportService.generateFilename(
      options.surveyTitle,
      options.format
    );

    switch (options.format) {
      case 'csv':
        content = this.exportToCSVWithMetadata(exportData, options);
        break;
      case 'json':
        content = this.exportToJSONWithMetadata(exportData, options);
        break;
      case 'pdf':
        content = this.exportToPDFWithMetadata(exportData, options);
        break;
      case 'excel':
        // Excel export is handled differently (returns data structure)
        content = JSON.stringify(this.prepareExcelWithMetadata(exportData, options));
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    return { content, fileName };
  }

  /**
   * Export to CSV with import metadata
   */
  private static exportToCSVWithMetadata(
    data: any[],
    options: EnhancedExportOptions
  ): string {
    const metadata = DataConsistencyService.getDataStoreMetadata(options.surveyId);
    
    // Add header row with metadata
    let csv = `# Survey Export Report\n`;
    csv += `# Title: ${options.surveyTitle}\n`;
    csv += `# Export Date: ${new Date().toLocaleString()}\n`;
    csv += `# Total Records: ${data.length}\n`;
    
    if (metadata) {
      csv += `# Imported Records: ${metadata.importedResponses.length}\n`;
      csv += `# Source Files: ${metadata.importMetadata.fileName}\n`;
      csv += `# Import Date: ${metadata.importMetadata.importDate}\n`;
    }
    
    csv += `#\n`;
    
    if (data.length === 0) {
      csv += `# No data to export\n`;
      return csv;
    }

    // Add column headers
    const columns = Object.keys(data[0]);
    csv += columns.join(',') + '\n';

    // Add data rows
    data.forEach(row => {
      const values = columns.map(col => {
        const value = row[col];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csv += values.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Export to JSON with full metadata
   */
  private static exportToJSONWithMetadata(
    data: any[],
    options: EnhancedExportOptions
  ): string {
    const metadata = DataConsistencyService.getDataStoreMetadata(options.surveyId);
    const stats = DataConsistencyService.getImportStatistics();

    return JSON.stringify({
      exportMetadata: {
        surveyTitle: options.surveyTitle,
        exportDate: new Date().toISOString(),
        totalRecords: data.length,
        format: 'JSON',
      },
      importMetadata: metadata ? {
        fileName: metadata.importMetadata.fileName,
        importDate: metadata.importMetadata.importDate,
        source: metadata.importMetadata.source,
        recordsImported: metadata.importedResponses.length,
      } : null,
      statistics: {
        totalSurveysWithImports: stats.totalSurveys,
        totalImportedResponses: stats.totalImportedResponses,
      },
      data: data,
    }, null, 2);
  }

  /**
   * Export to PDF with metadata
   */
  private static exportToPDFWithMetadata(
    data: any[],
    options: EnhancedExportOptions
  ): string {
    const metadata = DataConsistencyService.getDataStoreMetadata(options.surveyId);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${options.surveyTitle}</title>
      <style>
        * { margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          padding: 40px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          border-bottom: 3px solid #00d9ff;
          margin-bottom: 30px;
          padding-bottom: 20px;
        }
        .header h1 {
          font-size: 28px;
          color: #1a1a1a;
          margin-bottom: 10px;
        }
        .metadata-box {
          background: #f8f8f8;
          border-left: 4px solid #00d9ff;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .metadata-box h3 {
          font-size: 14px;
          color: #00d9ff;
          text-transform: uppercase;
          margin-bottom: 8px;
          font-weight: bold;
        }
        .metadata-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          font-size: 12px;
        }
        .metadata-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .metadata-label {
          font-weight: bold;
          color: #666;
        }
        .metadata-value {
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 11px;
        }
        th {
          background: #00d9ff;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #e0e0e0;
          word-break: break-word;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #e0e0e0;
          padding-top: 20px;
        }
        .import-source {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          background: #e3f2fd;
          color: #1976d2;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${options.surveyTitle}</h1>
          <p style="color: #666; margin-top: 5px;">Survey Response Report</p>
        </div>

        <div class="metadata-box">
          <h3>Export Information</h3>
          <div class="metadata-grid">
            <div class="metadata-item">
              <span class="metadata-label">Export Date:</span>
              <span class="metadata-value">${new Date().toLocaleString()}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Total Records:</span>
              <span class="metadata-value">${data.length}</span>
            </div>
          </div>
        </div>

        ${metadata ? `
          <div class="metadata-box">
            <h3>Import Information</h3>
            <div class="metadata-grid">
              <div class="metadata-item">
                <span class="metadata-label">Source File:</span>
                <span class="metadata-value">${metadata.importMetadata.fileName}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Import Date:</span>
                <span class="metadata-value">${new Date(metadata.importMetadata.importDate).toLocaleString()}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Format:</span>
                <span class="metadata-value">${metadata.importMetadata.source.toUpperCase()}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Records Imported:</span>
                <span class="metadata-value">${metadata.importedResponses.length}</span>
              </div>
            </div>
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((row: any) => `
              <tr>
                ${columns.map(col => {
                  const value = row[col];
                  const isImportSource = col === '_importSource';
                  const displayValue = isImportSource 
                    ? `<span class="import-source">${value}</span>` 
                    : value ?? '';
                  return `<td>${displayValue}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This report includes all survey responses with full audit trail of imported data sources.</p>
          <p style="margin-top: 5px; font-size: 9px;">© Survey Analytics Platform | Generated automatically</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return html;
  }

  /**
   * Prepare Excel data with metadata sheets
   */
  private static prepareExcelWithMetadata(
    data: any[],
    options: EnhancedExportOptions
  ) {
    const metadata = DataConsistencyService.getDataStoreMetadata(options.surveyId);
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    const sheets = [
      {
        name: 'Responses',
        data: data,
        columns: columns,
      },
    ];

    // Add Import Metadata Sheet
    if (metadata) {
      sheets.push({
        name: 'Import Log',
        data: [
          { Field: 'Source File', Value: metadata.importMetadata.fileName },
          { Field: 'Import Date', Value: metadata.importMetadata.importDate },
          { Field: 'File Format', Value: metadata.importMetadata.source },
          { Field: 'Records Imported', Value: metadata.importedResponses.length },
          { Field: 'Last Updated', Value: metadata.lastUpdated },
        ],
        columns: ['Field', 'Value'],
      });
    }

    // Add Export Metadata Sheet
    sheets.push({
      name: 'Export Info',
      data: [
        { Field: 'Survey Title', Value: options.surveyTitle },
        { Field: 'Export Date', Value: new Date().toLocaleString() },
        { Field: 'Total Records', Value: data.length },
        { Field: 'Columns', Value: columns.join(', ') },
      ],
      columns: ['Field', 'Value'],
    });

    return { sheets };
  }
}

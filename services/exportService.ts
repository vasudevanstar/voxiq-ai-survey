/**
 * Advanced Export Service
 * Handles PDF, Excel, CSV, and JSON exports with custom branding
 */

import { ExportOptions, BrandingConfig, ResponseFilterSet } from '../types/survey';
import { ResponseFilterService } from './advancedFeaturesService';

export class ExportService {
  /**
   * Exports responses to CSV format
   */
  static exportToCSV(
    responses: any[],
    surveyTitle: string,
    options: ExportOptions
  ): string {
    // Filter responses if needed
    const dataToExport = options.filters
      ? ResponseFilterService.applyFilters(responses, options.filters)
      : responses;

    // Get columns to include
    const columns = options.includeColumns.length > 0
      ? options.includeColumns
      : Object.keys(dataToExport[0] || {});

    // Create CSV header
    let csv = columns.join(',') + '\n';

    // Add data rows
    dataToExport.forEach(response => {
      const row = columns.map(col => {
        const value = response[col];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Exports responses to Excel format (returns data structure)
   */
  static prepareExcelData(
    responses: any[],
    surveyTitle: string,
    options: ExportOptions
  ): {
    sheets: Array<{
      name: string;
      data: any[];
      columns: string[];
    }>;
  } {
    const dataToExport = options.filters
      ? ResponseFilterService.applyFilters(responses, options.filters)
      : responses;

    const columns = options.includeColumns.length > 0
      ? options.includeColumns
      : Object.keys(dataToExport[0] || {});

    const sheets = [
      {
        name: 'Responses',
        data: dataToExport,
        columns,
      },
    ];

    // Add metadata sheet if requested
    if (options.includeMetadata) {
      sheets.push({
        name: 'Metadata',
        data: [
          { key: 'Survey Title', value: surveyTitle },
          { key: 'Export Date', value: new Date().toLocaleString() },
          { key: 'Total Responses', value: dataToExport.length },
          { key: 'Columns Included', value: columns.join(', ') },
          { key: 'Filters Applied', value: options.filters ? 'Yes' : 'No' },
        ],
        columns: ['key', 'value'],
      });
    }

    return { sheets };
  }

  /**
   * Exports responses to PDF format (returns HTML for rendering)
   */
  static preparePDFContent(
    responses: any[],
    surveyTitle: string,
    options: ExportOptions,
    branding?: BrandingConfig
  ): string {
    const dataToExport = options.filters
      ? ResponseFilterService.applyFilters(responses, options.filters)
      : responses;

    const columns = options.includeColumns.length > 0
      ? options.includeColumns
      : Object.keys(dataToExport[0] || {});

    const primaryColor = branding?.primaryColor || '#00d9ff';
    const companyName = branding?.companyName || 'Survey Sense';

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${surveyTitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          margin: 20px;
          background: #f5f5f5;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid ${primaryColor};
        }
        .company-name {
          color: ${primaryColor};
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .survey-title {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin: 10px 0;
        }
        .export-info {
          font-size: 12px;
          color: #666;
          margin-top: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th {
          background: ${primaryColor};
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 12px;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #999;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${companyName}</div>
        <div class="survey-title">${surveyTitle}</div>
        <div class="export-info">Generated: ${new Date().toLocaleString()}</div>
      </div>

      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${dataToExport.map((response: any) => `
            <tr>
              ${columns.map(col => `<td>${response[col] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>${branding?.footerText || '© Survey Sense | AI-Powered Decision Intelligence'}</p>
      </div>
    </body>
    </html>
    `;

    return html;
  }

  /**
   * Exports responses to JSON format
   */
  static exportToJSON(
    responses: any[],
    surveyTitle: string,
    options: ExportOptions
  ): string {
    const dataToExport = options.filters
      ? ResponseFilterService.applyFilters(responses, options.filters)
      : responses;

    const columns = options.includeColumns.length > 0
      ? options.includeColumns
      : Object.keys(dataToExport[0] || {});

    const data: Record<string, any> = {
      metadata: {
        surveyTitle,
        exportDate: new Date().toISOString(),
        totalResponses: dataToExport.length,
        columnsIncluded: columns,
      },
      responses: dataToExport,
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Generates filename
   */
  static generateFilename(surveyTitle: string, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitized = surveyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${sanitized}_${timestamp}.${format}`;
  }

  /**
   * Downloads file to client
   */
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Legacy export functions for compatibility
export const exportToCSV = (data: any[], fileName: string) => {
  const options: ExportOptions = {
    format: 'csv',
    includeColumns: Object.keys(data[0] || {}),
    includeMetadata: false,
  };
  const csv = ExportService.exportToCSV(data, fileName, options);
  ExportService.downloadFile(csv, `${fileName}.csv`, 'text/csv');
};

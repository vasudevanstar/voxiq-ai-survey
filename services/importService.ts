/**
 * Import Service
 * Handles importing survey data from Excel, CSV, and JSON files
 */

import { Response, Survey } from '../types';

export interface ImportResult {
  success: boolean;
  rowsImported: number;
  errors: string[];
  data: Response[];
  source?: 'excel' | 'csv' | 'json';
  fileName?: string;
}

export class ImportService {
  /**
   * Parse CSV content into Response objects
   */
  static parseCSV(content: string, surveyId: string, fileName?: string): ImportResult {
    const errors: string[] = [];
    const data: Response[] = [];
    
    try {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        errors.push('CSV file must contain header row and at least one data row');
        return { success: false, rowsImported: 0, errors, data, source: 'csv', fileName };
      }

      // Parse header
      const headers = this.parseCSVLine(lines[0]);
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          
          if (values.length === 0) continue;
          
          const answers: Record<string, any> = {};
          headers.forEach((header, idx) => {
            if (header && values[idx] !== undefined) {
              answers[header] = values[idx];
            }
          });

          const response: Response = {
            surveyId,
            answers,
            timestamp: new Date().toISOString(),
            _importSource: 'csv',
            _importFileName: fileName || 'unknown',
            _rowNumber: i,
          };

          data.push(response);
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        rowsImported: data.length,
        errors,
        data,
        source: 'csv',
        fileName
      };
    } catch (error) {
      errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, rowsImported: 0, errors, data, source: 'csv', fileName };
    }
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Parse Excel file (XLSX) - requires reading as binary
   */
  static async parseExcel(file: File, surveyId: string): Promise<ImportResult> {
    const errors: string[] = [];
    const data: Response[] = [];

    try {
      // Dynamic import of xlsx library
      const XLSX = await import('xlsx');
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        errors.push('Excel file is empty or has no sheets');
        return { success: false, rowsImported: 0, errors, data, source: 'excel', fileName: file.name };
      }
      
      const sheet = workbook.Sheets[sheetName];
      const csvData = XLSX.utils.sheet_to_csv(sheet);
      
      // Parse as CSV and set source to excel
      const result = this.parseCSV(csvData, surveyId, file.name);
      result.data.forEach(r => {
        r._importSource = 'excel';
      });
      result.source = 'excel';
      result.fileName = file.name;
      
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot find module')) {
        errors.push('XLSX library not loaded. Please use CSV format or ensure xlsx is installed.');
      } else {
        errors.push(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return { success: false, rowsImported: 0, errors, data, source: 'excel', fileName: file.name };
    }
  }

  /**
   * Parse JSON file containing response data
   */
  static async parseJSON(file: File, surveyId: string): Promise<ImportResult> {
    const errors: string[] = [];
    const data: Response[] = [];

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Handle both array and object formats
      const items = Array.isArray(parsed) ? parsed : parsed.data || parsed.responses || [];

      if (!Array.isArray(items)) {
        errors.push('JSON must contain an array of response objects');
        return { success: false, rowsImported: 0, errors, data, source: 'json', fileName: file.name };
      }

      items.forEach((item: any, idx: number) => {
        try {
          const response: Response = {
            surveyId,
            answers: item.answers || item,
            timestamp: item.timestamp || new Date().toISOString(),
            sentiment: item.sentiment,
            _importSource: 'json',
            _importFileName: file.name,
            _rowNumber: idx + 1,
          };

          data.push(response);
        } catch (error) {
          errors.push(`Item ${idx + 1}: ${error instanceof Error ? error.message : 'Invalid format'}`);
        }
      });

      return {
        success: errors.length === 0,
        rowsImported: data.length,
        errors,
        data,
        source: 'json',
        fileName: file.name
      };
    } catch (error) {
      errors.push(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, rowsImported: 0, errors, data, source: 'json', fileName: file.name };
    }
  }

  /**
   * Import file based on extension
   */
  static async importFile(file: File, surveyId: string): Promise<ImportResult> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      const text = await file.text();
      const result = this.parseCSV(text, surveyId, file.name);
      result.source = 'csv';
      result.fileName = file.name;
      return result;
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return this.parseExcel(file, surveyId);
    } else if (fileName.endsWith('.json')) {
      return this.parseJSON(file, surveyId);
    } else {
      return {
        success: false,
        rowsImported: 0,
        errors: ['Unsupported file format. Please use CSV, XLSX, or JSON.'],
        data: [],
        source: undefined,
        fileName: file.name
      };
    }
  }

  /**
   * Validate imported data against survey structure
   */
  static validateDataAgainstSurvey(
    data: Response[],
    survey: Survey
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const questionIds = new Set(survey.questions.map(q => q.id));

    data.forEach((response, idx) => {
      const requiredQuestions = survey.questions.filter(q => q.required);
      
      requiredQuestions.forEach(q => {
        if (response.answers[q.id] === undefined || response.answers[q.id] === null || response.answers[q.id] === '') {
          errors.push(`Row ${idx + 1}: Missing required field "${q.title}" (${q.id})`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';

export interface TestDataRow {
  [key: string]: string | number | boolean | null;
}

export interface TestDataSet {
  name: string;
  description?: string;
  data: TestDataRow[];
  metadata?: {
    source: string;
    loadedAt: Date;
    rowCount: number;
  };
}

export class TestDataLoader {
  private logger: Logger;
  private dataCache: Map<string, TestDataSet> = new Map();

  constructor() {
    this.logger = new Logger('TestDataLoader');
  }

  // Load test data from CSV file with automatic type parsing
  async loadFromCSV(filePath: string, options?: {
    delimiter?: string;
    hasHeader?: boolean;
    encoding?: BufferEncoding;
  }): Promise<TestDataSet> {
    const fullPath = this.resolvePath(filePath);
    const cacheKey = `csv:${fullPath}`;

    if (this.dataCache.has(cacheKey)) {
      this.logger.info('Returning cached CSV data', { filePath });
      return this.dataCache.get(cacheKey)!;
    }

    this.logger.info('Loading CSV test data', { filePath: fullPath });

    try {
      const content = fs.readFileSync(fullPath, options?.encoding || 'utf8');
      const delimiter = options?.delimiter || ',';
      const hasHeader = options?.hasHeader !== false;

      const lines = content.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }

      let headers: string[];
      let dataLines: string[];

      if (hasHeader) {
        headers = this.parseCSVLine(lines[0], delimiter);
        dataLines = lines.slice(1);
      } else {
        const firstLine = this.parseCSVLine(lines[0], delimiter);
        headers = firstLine.map((_, index) => `column_${index + 1}`);
        dataLines = lines;
      }

      const data: TestDataRow[] = dataLines.map((line, index) => {
        const values = this.parseCSVLine(line, delimiter);

        if (values.length !== headers.length) {
          this.logger.warn(`Row ${index + 1} has ${values.length} columns, expected ${headers.length}`, {
            line,
            expected: headers.length,
            actual: values.length
          });
        }

        const row: TestDataRow = {};
        headers.forEach((header, i) => {
          row[header] = this.parseValue(values[i] || '');
        });
        return row;
      });

      const testDataSet: TestDataSet = {
        name: path.basename(filePath, '.csv'),
        description: `CSV data loaded from ${filePath}`,
        data,
        metadata: {
          source: fullPath,
          loadedAt: new Date(),
          rowCount: data.length
        }
      };

      this.dataCache.set(cacheKey, testDataSet);
      this.logger.info('CSV data loaded successfully', {
        filePath,
        rowCount: data.length,
        columnCount: headers.length
      });

      return testDataSet;
    } catch (error) {
      this.logger.error('Failed to load CSV data', {
        filePath: fullPath,
        error: (error as Error).message
      });
      throw error;
    }
  }

  async loadFromJSON(filePath: string, options?: {
    encoding?: BufferEncoding;
  }): Promise<TestDataSet> {
    const fullPath = this.resolvePath(filePath);
    const cacheKey = `json:${fullPath}`;

    if (this.dataCache.has(cacheKey)) {
      this.logger.info('Returning cached JSON data', { filePath });
      return this.dataCache.get(cacheKey)!;
    }

    this.logger.info('Loading JSON test data', { filePath: fullPath });

    try {
      const content = fs.readFileSync(fullPath, options?.encoding || 'utf8');
      const jsonData = JSON.parse(content);

      let data: TestDataRow[];
      let name: string;
      let description: string | undefined;

      if (Array.isArray(jsonData)) {
        data = jsonData;
        name = path.basename(filePath, '.json');
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        data = jsonData.data;
        name = jsonData.name || path.basename(filePath, '.json');
        description = jsonData.description;
      } else {
        throw new Error('Invalid JSON format. Expected array or object with data property.');
      }

      const testDataSet: TestDataSet = {
        name,
        description: description || `JSON data loaded from ${filePath}`,
        data,
        metadata: {
          source: fullPath,
          loadedAt: new Date(),
          rowCount: data.length
        }
      };

      this.dataCache.set(cacheKey, testDataSet);
      this.logger.info('JSON data loaded successfully', {
        filePath,
        rowCount: data.length
      });

      return testDataSet;
    } catch (error) {
      this.logger.error('Failed to load JSON data', {
        filePath: fullPath,
        error: (error as Error).message
      });
      throw error;
    }
  }

  getCachedDataSet(key: string): TestDataSet | undefined {
    return this.dataCache.get(key);
  }

  clearCache(): void {
    this.dataCache.clear();
    this.logger.info('Test data cache cleared');
  }

  getCacheStats() {
    const stats = {
      totalDataSets: this.dataCache.size,
      dataSets: Array.from(this.dataCache.entries()).map(([key, dataSet]) => ({
        key,
        name: dataSet.name,
        rowCount: dataSet.data.length,
        loadedAt: dataSet.metadata?.loadedAt
      }))
    };

    return stats;
  }

  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current.trim());
    return result;
  }

  private parseValue(value: string): string | number | boolean | null {
    const trimmed = value.trim();

    if (trimmed === '' || trimmed.toLowerCase() === 'null') {
      return null;
    }

    if (trimmed.toLowerCase() === 'true') {
      return true;
    }

    if (trimmed.toLowerCase() === 'false') {
      return false;
    }

    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }

    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    return trimmed;
  }

  // Resolve file path by searching common test data locations
  private resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }

    const possiblePaths = [
      filePath,
      path.join(process.cwd(), filePath),
      path.join(process.cwd(), 'test-data', filePath),
      path.join(process.cwd(), 'src', 'test-data', filePath),
      path.join(process.cwd(), 'data', filePath)
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        return possiblePath;
      }
    }

    throw new Error(`Test data file not found: ${filePath}. Searched in: ${possiblePaths.join(', ')}`);
  }
}

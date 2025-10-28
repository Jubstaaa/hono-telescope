import { Telescope } from '../telescope';
import { EntryType } from '../types';
import { some, map } from 'lodash';

class QueryWatcher {
  private isWatching = false;
  private originalConsoleLog: typeof console.log;

  constructor() {
    this.originalConsoleLog = console.log;
  }

  start() {
    if (this.isWatching) return;
    
    this.isWatching = true;

    // This is a basic implementation that watches for SQL-like patterns in console logs
    // In a real implementation, you would hook into your ORM or database driver
    console.log = (...args: any[]) => {
      this.originalConsoleLog.apply(console, args);
      
      const message = args.join(' ');
      if (this.isSQLQuery(message)) {
        this.recordQuery(message);
      }
    };
  }

  stop() {
    if (!this.isWatching) return;
    
    this.isWatching = false;
    console.log = this.originalConsoleLog;
  }

  private isSQLQuery(message: string): boolean {
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
    const upperMessage = message.toUpperCase();
    return some(sqlKeywords, keyword => upperMessage.includes(keyword));
  }

  private recordQuery(sql: string) {
    const telescope = Telescope.getInstance();
    
    if (!telescope.getConfig().enabled) return;

    const startTime = Date.now();
    
    // Extract basic query information
    const queryType = this.extractQueryType(sql);
    const tables = this.extractTables(sql);

    telescope.record(EntryType.QUERY, {
      connection: 'default',
      bindings: [],
      sql: sql.trim(),
      time: 0, // We can't measure actual execution time without hooking into the DB driver
      slow: false,
      file: this.getCallerFile(),
      line: this.getCallerLine(),
      hash: this.generateQueryHash(sql)
    }, [
      'query',
      queryType.toLowerCase(),
      ...map(tables, table => `table:${table}`)
    ]);
  }

  private extractQueryType(sql: string): string {
    const match = sql.trim().match(/^(\w+)/i);
    return match ? match[1].toUpperCase() : 'UNKNOWN';
  }

  private extractTables(sql: string): string[] {
    const tables: string[] = [];
    
    // Basic table extraction - this is simplified
    const fromMatch = sql.match(/FROM\s+([`"]?)(\w+)\1/gi);
    if (fromMatch) {
      fromMatch.forEach(match => {
        const tableMatch = match.match(/FROM\s+([`"]?)(\w+)\1/i);
        if (tableMatch) {
          tables.push(tableMatch[2]);
        }
      });
    }

    const joinMatch = sql.match(/JOIN\s+([`"]?)(\w+)\1/gi);
    if (joinMatch) {
      joinMatch.forEach(match => {
        const tableMatch = match.match(/JOIN\s+([`"]?)(\w+)\1/i);
        if (tableMatch) {
          tables.push(tableMatch[2]);
        }
      });
    }

    return [...new Set(tables)]; // Remove duplicates
  }

  private generateQueryHash(sql: string): string {
    // Simple hash generation for grouping similar queries
    const normalized = sql
      .replace(/\d+/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/\s+/g, ' ')
      .trim();
    
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private getCallerFile(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';
    
    const lines = stack.split('\n');
    for (let i = 3; i < lines.length; i++) {
      const match = lines[i].match(/at .* \((.+):(\d+):\d+\)/);
      if (match && !match[1].includes('query-watcher')) {
        return match[1];
      }
    }
    return 'unknown';
  }

  private getCallerLine(): number {
    const stack = new Error().stack;
    if (!stack) return 0;
    
    const lines = stack.split('\n');
    for (let i = 3; i < lines.length; i++) {
      const match = lines[i].match(/at .* \((.+):(\d+):\d+\)/);
      if (match && !match[1].includes('query-watcher')) {
        return parseInt(match[2], 10);
      }
    }
    return 0;
  }
}

let watcher: QueryWatcher | null = null;

export function startQueryWatcher() {
  if (!watcher) {
    watcher = new QueryWatcher();
  }
  watcher.start();
}

export function stopQueryWatcher() {
  if (watcher) {
    watcher.stop();
  }
}

// Helper function to manually record database queries
export function recordDatabaseQuery(
  sql: string,
  bindings: any[] = [],
  executionTime: number = 0,
  connection: string = 'default'
) {
  const telescope = Telescope.getInstance();
  
  if (!telescope.getConfig().enabled) return;

  const queryType = sql.trim().match(/^(\w+)/i)?.[1]?.toUpperCase() || 'UNKNOWN';
  const isSlowQuery = executionTime > 1000; // Consider queries over 1s as slow

  telescope.record(EntryType.QUERY, {
    connection,
    bindings,
    sql: sql.trim(),
    time: executionTime,
    slow: isSlowQuery,
    file: 'manual',
    line: 0,
    hash: generateQueryHash(sql)
  }, [
    'query',
    queryType.toLowerCase(),
    ...(isSlowQuery ? ['slow'] : [])
  ]);
}

function generateQueryHash(sql: string): string {
  const normalized = sql
    .replace(/\d+/g, '?')
    .replace(/'[^']*'/g, '?')
    .replace(/\s+/g, ' ')
    .trim();
  
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
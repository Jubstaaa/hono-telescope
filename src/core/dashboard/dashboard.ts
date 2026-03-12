import { Telescope } from '../telescope';
import {
  mapIncomingRequest,
  mapOutgoingRequest,
  mapException,
  mapLog,
  mapQuery,
} from '../utils/mappers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class TelescopeDashboard {
  private telescope: Telescope;

  constructor() {
    this.telescope = Telescope.getInstance();
  }

  async getAllIncomingRequests() {
    const entries = await this.telescope.getAllIncomingRequests();
    return [...entries].reverse().map(mapIncomingRequest);
  }

  async getIncomingRequest(id: string) {
    const entry = await this.telescope.getIncomingRequest(id);
    if (!entry) return null;

    const [logs, queries, exceptions, outgoingRequests] = await Promise.all([
      this.telescope.getLogsByParentId(id),
      this.telescope.getQueriesByParentId(id),
      this.telescope.getExceptionsByParentId(id),
      this.telescope.getOutgoingRequestsByParentId(id),
    ]);

    return {
      ...entry,
      relation_entries: {
        logs: logs.map(mapLog),
        queries: queries.map(mapQuery),
        exceptions: exceptions.map(mapException),
        outgoing_requests: outgoingRequests.map(mapOutgoingRequest),
      },
    };
  }

  async getAllOutgoingRequests() {
    const entries = await this.telescope.getAllOutgoingRequests();
    return [...entries].reverse().map(mapOutgoingRequest);
  }

  async getOutgoingRequest(id: string) {
    return this.telescope.getOutgoingRequest(id);
  }

  async getAllExceptions() {
    const entries = await this.telescope.getAllExceptions();
    return [...entries].reverse().map(mapException);
  }

  async getException(id: string) {
    return this.telescope.getException(id);
  }

  async getAllQueries() {
    const entries = await this.telescope.getAllQueries();
    return [...entries].reverse().map(mapQuery);
  }

  async getQuery(id: string) {
    return this.telescope.getQuery(id);
  }

  async getAllLogs() {
    const entries = await this.telescope.getAllLogs();
    return [...entries].reverse().map(mapLog);
  }

  async getLog(id: string) {
    return this.telescope.getLog(id);
  }

  async getStats() {
    const [incomingRequests, outgoingRequests, exceptions, queries, logs] = await Promise.all([
      this.telescope.countIncomingRequests(),
      this.telescope.countOutgoingRequests(),
      this.telescope.countExceptions(),
      this.telescope.countQueries(),
      this.telescope.countLogs(),
    ]);

    return {
      incomingRequests: { total: incomingRequests },
      outgoingRequests: { total: outgoingRequests },
      exceptions: { total: exceptions },
      queries: { total: queries },
      logs: { total: logs },
    };
  }

  getDashboardHtml() {
    try {
      let html = readFileSync(join(__dirname, 'index.html'), 'utf-8');
      html = html.replace(/(src|href)=["']\.\/assets\//g, '$1="/telescope/assets/');
      return html;
    } catch {
      return '<h1>Dashboard HTML not found</h1>';
    }
  }

  getAsset(path: string) {
    try {
      return readFileSync(join(__dirname, path), 'utf-8');
    } catch {
      return null;
    }
  }
}

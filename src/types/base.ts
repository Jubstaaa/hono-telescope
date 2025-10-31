export interface BaseEntry {
  id: string;
  timestamp: number;
  created_at: string;
  parent_id?: string;
}

export enum EntryType {
  INCOMING_REQUEST = 'incoming_request',
  OUTGOING_REQUEST = 'outgoing_request',
  EXCEPTION = 'exception',
  LOG = 'log',
  QUERY = 'query',
}

export interface TelescopeConfig {
  enabled: boolean;
  max_entries: number;
  sanitize_headers?: string[];
}

export interface BaseEntry {
  id: string;
  created_at: string;
  parent_id?: string;
  timestamp: number;
}

export type EntryType = 'incoming_request' | 'outgoing_request' | 'exception' | 'log' | 'query';

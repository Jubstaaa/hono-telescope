export interface BaseEntry {
  id: string;
  timestamp: number;
  created_at: string;
  parent_id?: string;
}

export type EntryType =
  | 'incoming_request'
  | 'outgoing_request'
  | 'exception'
  | 'log'
  | 'query';

export const ENTRY_TYPES: readonly EntryType[] = [
  'incoming_request',
  'outgoing_request',
  'exception',
  'log',
  'query',
];

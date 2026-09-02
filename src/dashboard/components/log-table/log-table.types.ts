import type { LogResponse } from '@/types';

export interface LogTableProps {
  entries: LogResponse[];
  loading?: boolean;
}

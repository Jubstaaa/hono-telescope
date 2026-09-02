import type { QueryResponse } from '@/types';

export interface QueryTableProps {
  entries: QueryResponse[];
  loading?: boolean;
}

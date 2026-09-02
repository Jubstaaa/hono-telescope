import type { ExceptionResponse } from '@/types';

export interface ExceptionTableProps {
  entries: ExceptionResponse[];
  loading?: boolean;
}

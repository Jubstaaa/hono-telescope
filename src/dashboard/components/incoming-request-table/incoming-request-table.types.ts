import type { IncomingRequestResponse } from '@/types';

export interface IncomingRequestTableProps {
  entries: IncomingRequestResponse[];
  loading?: boolean;
}

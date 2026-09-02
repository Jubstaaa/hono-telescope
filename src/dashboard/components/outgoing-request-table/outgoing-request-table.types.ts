import type { OutgoingRequestResponse } from '@/types';

export interface OutgoingRequestTableProps {
  entries: OutgoingRequestResponse[];
  loading?: boolean;
}

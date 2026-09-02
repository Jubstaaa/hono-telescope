import { formatDate } from '../../utils/format';
import DurationTag from '../duration-tag/duration-tag';
import Table from '../entry-table/entry-table';
import MethodTag from '../method-tag/method-tag';
import StatusTag from '../status-tag/status-tag';

import type { IncomingRequestTableProps } from './incoming-request-table.types.js';

export const IncomingRequestTable = ({ entries, loading = false }: IncomingRequestTableProps) => {
  const columns = [
    {
      dataIndex: 'method',
      key: 'method',
      render: (method: string) => <MethodTag method={method} />,
      title: 'Method',
      width: 80,
    },
    {
      dataIndex: 'uri',
      key: 'uri',
      render: (uri: string) => uri,
      title: 'Path',
      width: 150,
    },
    {
      dataIndex: 'response_status',
      key: 'response_status',
      render: (status: number) => <StatusTag status={status} />,
      title: 'Status',
      width: 80,
    },
    {
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => <DurationTag value={duration} />,
      title: 'Duration',
      width: 100,
    },
    {
      dataIndex: 'created_at',
      key: 'created_at',
      render: (created_at: string) => formatDate(created_at),
      title: 'Time',
      width: 180,
    },
  ];

  return (
    <Table columns={columns} dataSource={entries} loading={loading} path="incoming-requests" />
  );
};

export default IncomingRequestTable;

import React from 'react';
import { formatDate } from '../../utils/helpers';
import { IncomingRequestResponse } from '@hono-telescope/types';
import MethodTag from '../Tag/MethodTag';
import StatusTag from '../Tag/StatusTag';
import DurationTag from '../Tag/DurationTag';
import Table from './Table';

interface IncomingRequestTableProps {
  entries: IncomingRequestResponse[];
  loading?: boolean;
}

export const IncomingRequestTable: React.FC<IncomingRequestTableProps> = ({
  entries,
  loading = false,
}) => {
  const columns = [
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => <MethodTag method={method} />,
    },
    {
      title: 'Path',
      dataIndex: 'uri',
      key: 'uri',
      width: 150,
      render: (uri: string) => uri,
    },
    {
      title: 'Status',
      dataIndex: 'response_status',
      key: 'response_status',
      width: 80,
      render: (status: number) => <StatusTag status={status} />,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => <DurationTag value={duration} />,
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (created_at: string) => formatDate(created_at),
    },
  ];

  return (
    <Table columns={columns} dataSource={entries} loading={loading} path="incoming-requests" />
  );
};

export default IncomingRequestTable;

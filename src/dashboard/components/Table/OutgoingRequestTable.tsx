import React from 'react';
import { formatDate } from '../../utils/helpers';
import { OutgoingRequestResponse } from '@hono-telescope/types';
import DurationTag from '../Tag/DurationTag';
import StatusTag from '../Tag/StatusTag';
import MethodTag from '../Tag/MethodTag';
import Table from './Table';

interface OutgoingRequestTableProps {
  entries: OutgoingRequestResponse[];
  loading?: boolean;
}

export const OutgoingRequestTable: React.FC<OutgoingRequestTableProps> = ({
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
      key: 'path',
      width: 200,
      render: (uri: string) => uri,
    },
    {
      title: 'Status',
      dataIndex: 'response_status',
      key: 'status',
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
    <Table columns={columns} dataSource={entries} loading={loading} path="outgoing-requests" />
  );
};

export default OutgoingRequestTable;

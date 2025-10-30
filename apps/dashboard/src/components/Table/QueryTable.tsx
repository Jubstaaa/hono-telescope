import React from 'react';
import { formatDate } from '../../utils/helpers';
import { QueryResponse } from '@hono-telescope/types';
import DurationTag from '../Tag/DurationTag';
import Table from './Table';

interface QueryTableProps {
  entries: QueryResponse[];
  loading?: boolean;
}

export const QueryTable: React.FC<QueryTableProps> = ({ entries, loading }) => {
  const columns = [
    {
      title: 'Query',
      dataIndex: 'query',
      key: 'query',
      render: (query: string) => query,
    },
    {
      title: 'Duration',
      dataIndex: 'time',
      key: 'duration',
      render: (time: number) => <DurationTag value={time} />,
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'time',
      render: (created_at: string) => formatDate(created_at),
    },
  ];

  return <Table columns={columns} dataSource={entries} loading={loading} path="queries" />;
};

export default QueryTable;

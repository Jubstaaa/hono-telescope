import { Tag } from 'antd';

import type { QueryResponse } from '@/types';

import { formatDate } from '../../utils/helpers';
import DurationTag from '../Tag/DurationTag';

import Table from './Table';

interface QueryTableProps {
  entries: QueryResponse[];
  loading?: boolean;
}

export const QueryTable = ({ entries, loading }: QueryTableProps) => {
  const columns = [
    {
      dataIndex: 'query',
      key: 'query',
      render: (query: string) => query,
      title: 'Query',
    },
    {
      dataIndex: 'failed',
      key: 'failed',
      render: (failed?: boolean) => (failed ? <Tag color="red">failed</Tag> : null),
      title: 'Status',
    },
    {
      dataIndex: 'time',
      key: 'duration',
      render: (time: number) => <DurationTag value={time} />,
      title: 'Duration',
    },
    {
      dataIndex: 'created_at',
      key: 'created_at',
      render: (created_at: string) => formatDate(created_at),
      title: 'Time',
    },
  ];

  return <Table columns={columns} dataSource={entries} loading={loading} path="queries" />;
};

export default QueryTable;

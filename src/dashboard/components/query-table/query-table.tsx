import { Tag } from 'antd';

import { formatDate } from '../../utils/format';
import DurationTag from '../duration-tag/duration-tag';
import Table from '../entry-table/entry-table';

import type { QueryTableProps } from './query-table.types.js';

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

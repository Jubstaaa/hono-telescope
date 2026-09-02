import { formatDate } from '../../utils/format';
import Table from '../entry-table/entry-table';
import LevelTag from '../level-tag/level-tag';

import type { LogTableProps } from './log-table.types.js';

export const LogTable = ({ entries, loading }: LogTableProps) => {
  const columns = [
    {
      dataIndex: 'level',
      key: 'level',
      render: (level: number) => <LevelTag level={level} />,
      title: 'Level',
      width: 100,
    },
    {
      dataIndex: 'message',
      ellipsis: true,
      key: 'message',
      render: (message: string) => message,
      title: 'Message',
    },
    {
      dataIndex: 'created_at',
      key: 'created_at',
      render: (created_at: string) => formatDate(created_at),
      title: 'Time',
      width: 180,
    },
  ];

  return <Table columns={columns} dataSource={entries} loading={loading} path="logs" />;
};

export default LogTable;

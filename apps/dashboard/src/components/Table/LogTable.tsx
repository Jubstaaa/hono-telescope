import React from 'react';
import { formatDate } from '../../utils/helpers';
import { LogResponse } from '@hono-telescope/types';
import LevelTag from '../Tag/LevelTag';
import Table from './Table';

interface LogTableProps {
  entries: LogResponse[];
  loading?: boolean;
}

export const LogTable: React.FC<LogTableProps> = ({ entries, loading }) => {
  const columns = [
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: number) => <LevelTag level={level} />,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string) => message,
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (created_at: string) => formatDate(created_at),
    },
  ];

  return <Table columns={columns} dataSource={entries} loading={loading} path={'logs'} />;
};

export default LogTable;

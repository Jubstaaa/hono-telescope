import type { ExceptionResponse } from '@/types';

import { formatDate } from '../../utils/helpers';
import ExceptionTag from '../Tag/ExceptionTag';

import Table from './Table';

interface ExceptionTableProps {
  entries: ExceptionResponse[];
  loading?: boolean;
}

export const ExceptionTable = ({ entries, loading = false }: ExceptionTableProps) => {
  const columns = [
    {
      dataIndex: 'class',
      key: 'class',
      render: (classNum: number) => <ExceptionTag classNum={classNum} />,
      title: 'Exception',
      width: 200,
    },
    {
      dataIndex: 'message',
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

  return <Table columns={columns} dataSource={entries} loading={loading} path="exceptions" />;
};

export default ExceptionTable;

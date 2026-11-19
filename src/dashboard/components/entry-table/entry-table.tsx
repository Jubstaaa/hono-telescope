import type { ReactNode } from 'react';

import { Link, useNavigate } from 'react-router';

import type { TableColumnsType } from 'antd';
import { Table as AntTable } from 'antd';

interface Entry {
  id: string;
}

interface EntryTableProps<T extends Entry> {
  columns: TableColumnsType<T>;
  dataSource: T[];
  loading?: boolean;
  path: string;
}

const PAGE_SIZE = 50;

// The first cell is a real link, so keyboard and screen-reader users reach the detail page;
// the whole row stays clickable for the mouse.
function Table<T extends Entry>({ columns, dataSource, loading, path }: EntryTableProps<T>) {
  const navigate = useNavigate();
  const detailPath = (record: T) => `/${path}/${record.id}`;

  const linked = columns.map((column, index) => {
    if (index !== 0) return column;

    const render = column.render;
    return {
      ...column,
      render: (value: unknown, record: T, rowIndex: number) => (
        <Link to={detailPath(record)}>
          {(render ? render(value, record, rowIndex) : value) as ReactNode}
        </Link>
      ),
    };
  });

  return (
    <AntTable<T>
      columns={linked}
      dataSource={dataSource}
      loading={loading}
      pagination={{ hideOnSinglePage: true, pageSize: PAGE_SIZE, showSizeChanger: false }}
      rowKey="id"
      scroll={{ x: 800 }}
      onRow={(record) => ({
        style: { cursor: 'pointer' },
        onClick: (event) => {
          if ((event.target as HTMLElement).closest('a')) return;
          void navigate(detailPath(record));
        },
      })}
    />
  );
}

export default Table;

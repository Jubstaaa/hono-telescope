import { useNavigate } from 'react-router';

import type { TableProps } from 'antd';
import { Table as AntTable } from 'antd';

function Table({ columns, dataSource, loading, path }: TableProps & { path: string }) {
  const navigate = useNavigate();

  return (
    <AntTable
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={false}
      rowKey="id"
      scroll={{ x: 800 }}
      onRow={(record) => ({
        style: {
          cursor: 'pointer',
        },
        onClick: () => navigate(`/${path}/${record.id}`),
      })}
    />
  );
}

export default Table;

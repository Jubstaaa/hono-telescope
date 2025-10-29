import { Table as AntTable, TableProps } from 'antd'
import { useNavigate } from 'react-router-dom'

function Table({ columns, dataSource, loading, path }: TableProps & { path: string } ) {
    const navigate = useNavigate()

  return (
    <AntTable
    pagination={false}
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      loading={loading}
      onRow={(record) => ({
        onClick: () => navigate(`/${path}/${record.id}`),
        style: { 
          cursor: 'pointer',
        },
      })}
    scroll={{ x: 800 }}

    />
  )
}

export default Table
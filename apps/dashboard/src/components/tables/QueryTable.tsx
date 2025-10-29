import React from 'react'
import { Table, Tag, Typography, theme } from 'antd'
import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/tableUtils'
import { TelescopeEntry } from '@hono-telescope/types'

const { Text } = Typography

interface QueryTableProps {
  data: TelescopeEntry[]
  loading?: boolean
}

export const QueryTable: React.FC<QueryTableProps> = ({ data, loading }) => {
  const { token } = theme.useToken()
  
  const columns = [
    {
      title: 'Query',
      dataIndex: 'query',
      key: 'query',
      render: (query: string, record: TelescopeEntry) => (
        <div className="font-semibold">{query}</div>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'time',
      key: 'duration',
      render: (time: number) => (
        <Tag color={time > 100 ? 'red' : 'green'}>
          {time}ms
        </Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'time',
      render: (created_at: string) => (
        <span style={{ color: token.colorTextSecondary, fontSize: '14px' }}>
          {formatDate(created_at)}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: TelescopeEntry) => (
        <Link to={`/queries/${record.id}`}>
          <Text type="secondary">View Details</Text>
        </Link>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 20 }}
    />
  )
}

export default QueryTable
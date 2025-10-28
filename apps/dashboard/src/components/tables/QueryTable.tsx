import React from 'react'
import { Table, Tag, Typography, theme } from 'antd'
import { Link } from 'react-router-dom'
import { formatTimestamp } from '../../utils/tableUtils'
import { TelescopeEntry } from '../../api/telescopeApi'

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
      dataIndex: 'content',
      key: 'query',
      render: (content: any) => (
        <div>
          <div className="font-semibold">{content.sql}</div>
          <div style={{ color: token.colorTextSecondary }}>
            Bindings: {JSON.stringify(content.bindings)}
          </div>
        </div>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'content',
      key: 'duration',
      render: (content: any) => (
        <Tag color={content.time > 100 ? 'red' : 'green'}>
          {content.time}ms
        </Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'time',
      render: (timestamp: string) => (
        <span style={{ color: token.colorTextSecondary, fontSize: '14px' }}>
          {formatTimestamp(timestamp)}
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
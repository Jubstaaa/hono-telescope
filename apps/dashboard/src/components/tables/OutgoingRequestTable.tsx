import React from 'react'
import { Table, Tag, Space, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { ClockCircleOutlined } from '@ant-design/icons'
import { TelescopeEntry } from '@hono-telescope/types'
import { getStatusColor, formatDuration, formatDate } from '../../utils/tableUtils'

interface OutgoingRequestTableProps {
  entries: TelescopeEntry[]
  loading?: boolean
}

const getMethodColor = (method: string): string => {
  const colors: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple'
  }
  return colors[method] || 'default'
}

export const OutgoingRequestTable: React.FC<OutgoingRequestTableProps> = ({ entries, loading = false }) => {
  const navigate = useNavigate()
  const { token } = theme.useToken()

  const columns = [
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => (
        <Tag color={getMethodColor(method)}>
          {method || 'GET'}
        </Tag>
      )
    },
    {
      title: 'Path',
      dataIndex: 'uri',
      key: 'path',
      render: (uri: string) => (
        <span className="font-mono text-sm">
          {uri || '/'}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'response_status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={getStatusColor(status)}>
          {status || '-'}
        </Tag>
      )
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: number) => (
        <Space>
          <ClockCircleOutlined />
          <span>{formatDuration(duration)}</span>
        </Space>
      )
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (timestamp: string) => (
        <span style={{ color: token.colorTextSecondary, fontSize: '14px' }}>
          {formatDate(timestamp)}
        </span>
      )
    }
  ]

  return (
    <Table
      columns={columns}
      dataSource={entries}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 50,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} of ${total} requests`,
      }}
      onRow={(record) => ({
        onClick: () => navigate(`/outgoing-requests/${record.id}`),
        style: { cursor: 'pointer' },
      })}
      scroll={{ x: 800 }}
    />
  )
}

export default OutgoingRequestTable
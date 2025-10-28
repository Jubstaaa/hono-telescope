import React from 'react'
import { Table, Tag, Space, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { ClockCircleOutlined } from '@ant-design/icons'
import { TelescopeEntry } from '../../types'
import { getStatusColor, formatDuration, formatTimestamp } from '../../utils/tableUtils'

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
      dataIndex: 'content',
      key: 'method',
      width: 80,
      render: (content: any) => (
        <Tag color={getMethodColor(content?.method)}>
          {content?.method || 'GET'}
        </Tag>
      )
    },
    {
      title: 'Path',
      dataIndex: 'content',
      key: 'path',
      render: (content: any) => (
        <span className="font-mono text-sm">
          {content?.uri || content?.path || '/'}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'content',
      key: 'status',
      width: 80,
      render: (content: any) => (
        <Tag color={getStatusColor(content?.status)}>
          {content?.status || '-'}
        </Tag>
      )
    },
    {
      title: 'Duration',
      dataIndex: 'content',
      key: 'duration',
      width: 100,
      render: (content: any) => (
        <Space>
          <ClockCircleOutlined />
          <span>{formatDuration(content?.duration)}</span>
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
          {formatTimestamp(timestamp)}
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
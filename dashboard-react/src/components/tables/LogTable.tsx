import React from 'react'
import { Table, Tag, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { TelescopeEntry } from '../../types'
import { formatTimestamp } from '../../utils/tableUtils'

interface LogTableProps {
  entries: TelescopeEntry[]
  loading?: boolean
}

const getLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    debug: 'gray',
    info: 'blue',
    notice: 'cyan',
    warning: 'orange',
    error: 'red',
    critical: 'red',
    alert: 'red',
    emergency: 'red'
  }
  return colors[level?.toLowerCase()] || 'default'
}

export const LogTable: React.FC<LogTableProps> = ({ entries, loading }) => {
  const navigate = useNavigate()
  const { token } = theme.useToken()

  const columns = [
    {
      title: 'Level',
      dataIndex: ['content', 'level'],
      key: 'level',
      width: 100,
      render: (level: string) => (
        <Tag color={getLevelColor(level)}>
          {level?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: ['content', 'message'],
      key: 'message',
      ellipsis: true,
      render: (message: string) => (
        <span style={{ color: token.colorText }}>
          {message?.length > 100 ? `${message.substring(0, 100)}...` : message}
        </span>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: number) => (
        <span style={{ color: token.colorTextSecondary }}>
          {formatTimestamp(timestamp.toString())}
        </span>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={entries}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 50,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      }}
      onRow={(record) => ({
        onClick: () => navigate(`/logs/${record.id}`),
        style: { 
          cursor: 'pointer',
          backgroundColor: token.colorBgContainer
        },
      })}
      style={{ backgroundColor: token.colorBgContainer }}
    />
  )
}

export default LogTable
import React from 'react'
import { Table, Tag, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { TelescopeEntry } from '@hono-telescope/types'
import { formatDate, getLevelName } from '../../utils/tableUtils'

interface LogTableProps {
  entries: TelescopeEntry[]
  loading?: boolean
}

const getLevelColor = (level: number): string => {
  const colors: Record<number, string> = {
    0: 'gray',    // debug
    1: 'blue',    // info
    2: 'cyan',    // notice
    3: 'orange',  // warning
    4: 'red',     // error
    5: 'red',     // critical
    6: 'red',     // alert
    7: 'red'      // emergency
  }
  return colors[level] || 'default'
}

export const LogTable: React.FC<LogTableProps> = ({ entries, loading }) => {
  const navigate = useNavigate()
  const { token } = theme.useToken()

  const columns = [
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: number) => (
        <Tag color={getLevelColor(level)}>
          {getLevelName(level)}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
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
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (created_at: string) => (
        <span style={{ color: token.colorTextSecondary }}>
          {formatDate(created_at)}
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
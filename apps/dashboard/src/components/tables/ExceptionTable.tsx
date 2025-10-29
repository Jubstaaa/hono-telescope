import React from 'react'
import { Table, Tag, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { TelescopeEntry } from '@hono-telescope/types'
import { formatDate, getExceptionClassName } from '../../utils/tableUtils'

interface ExceptionTableProps {
  entries: TelescopeEntry[]
  loading?: boolean
}

export const ExceptionTable: React.FC<ExceptionTableProps> = ({ entries, loading = false }) => {
  const navigate = useNavigate()
  const { token } = theme.useToken()

  const columns = [
    {
      title: 'Exception',
      dataIndex: 'class',
      key: 'class',
      width: 200,
      render: (classNum: number) => (
        <Tag color="red">
          {getExceptionClassName(classNum)}
        </Tag>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (message: string) => (
        <span style={{ fontSize: '14px' }}>
          {message || 'No message available'}
        </span>
      )
    },
    {
      title: 'File',
      dataIndex: 'file',
      key: 'file',
      width: 200,
      render: (file: string, record: TelescopeEntry) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: token.colorTextSecondary }}>
          {file ? `${file}:${(record as any).line || '?'}` : 'Unknown'}
        </span>
      )
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (created_at: string) => (
        <span style={{ color: token.colorTextSecondary, fontSize: '14px' }}>
          {formatDate(created_at)}
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
          `${range[0]}-${range[1]} of ${total} exceptions`,
      }}
      onRow={(record) => ({
        onClick: () => navigate(`/exceptions/${record.id}`),
        style: { cursor: 'pointer' },
      })}
      scroll={{ x: 800 }}
    />
  )
}

export default ExceptionTable
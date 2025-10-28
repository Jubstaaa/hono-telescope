import React from 'react'
import { Table, Tag, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { TelescopeEntry } from '../../types'
import { formatTimestamp } from '../../utils/tableUtils'

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
      dataIndex: 'content',
      key: 'class',
      width: 200,
      render: (content: any) => (
        <Tag color="red">
          {content?.class || 'Exception'}
        </Tag>
      )
    },
    {
      title: 'Message',
      dataIndex: 'content',
      key: 'message',
      render: (content: any) => (
        <span style={{ fontSize: '14px' }}>
          {content?.message || 'No message available'}
        </span>
      )
    },
    {
      title: 'File',
      dataIndex: 'content',
      key: 'file',
      width: 200,
      render: (content: any) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: token.colorTextSecondary }}>
          {content?.file ? `${content.file}:${content.line || '?'}` : 'Unknown'}
        </span>
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
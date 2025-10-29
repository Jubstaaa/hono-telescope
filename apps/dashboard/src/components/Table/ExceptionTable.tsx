import React from 'react'
import { ExceptionResponse } from '@hono-telescope/types'
import { formatDate } from '../../utils/helpers'
import ExceptionTag from '../Tag/ExceptionTag'
import Table from './Table'

interface ExceptionTableProps {
  entries: ExceptionResponse[]  
  loading?: boolean
}

export const ExceptionTable: React.FC<ExceptionTableProps> = ({ entries, loading = false }) => {

  const columns = [
    {
      title: 'Exception',
      dataIndex: 'class',
      key: 'class',
      width: 200,
      render: (classNum: number) => <ExceptionTag classNum={classNum} />
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (message: string) => message
    },
    {
      title: 'Time',  
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (created_at: string) => formatDate(created_at)
    }
  ]

  return (
    <Table
          columns={columns}
    dataSource={entries}
    loading={loading}
    path="exceptions"
    />
  )
}

export default ExceptionTable
import type { ExceptionResponse } from '@/core/hono/dashboard-api'

import { formatDate } from '../../format'
import Table from '../entry-table/entry-table'
import ExceptionTag from '../exception-tag/exception-tag'

interface ExceptionTableProps {
    entries: ExceptionResponse[]
    loading?: boolean
}

export const ExceptionTable = ({
    entries,
    loading = false,
}: ExceptionTableProps) => {
    const columns = [
        {
            dataIndex: 'class',
            key: 'class',
            render: (classNum: number) => <ExceptionTag classNum={classNum} />,
            title: 'Exception',
            width: 200,
        },
        {
            dataIndex: 'message',
            key: 'message',
            render: (message: string) => message,
            title: 'Message',
        },
        {
            dataIndex: 'created_at',
            key: 'created_at',
            render: (created_at: string) => formatDate(created_at),
            title: 'Time',
            width: 180,
        },
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

import type { TableColumnsType } from 'antd'
import type { ReactNode } from 'react'

import { Table as AntTable } from 'antd'
import { Link, useNavigate } from 'react-router'

interface Entry {
    id: string
}

interface EntryTableProps<T extends Entry> {
    columns: TableColumnsType<T>
    dataSource: T[]
    loading?: boolean | undefined
    path: string
}

const PAGE_SIZE = 50

function Table<T extends Entry>({
    columns,
    dataSource,
    loading,
    path,
}: EntryTableProps<T>) {
    const navigate = useNavigate()
    const detailPath = (record: T) => `/${path}/${record.id}`

    const linked = columns.map((column, index) => {
        if (index !== 0) return column

        const render = column.render
        return {
            ...column,
            render: (value: unknown, record: T, rowIndex: number) => (
                <Link to={detailPath(record)}>
                    {
                        (render
                            ? render(value, record, rowIndex)
                            : value) as ReactNode
                    }
                </Link>
            ),
        }
    })

    return (
        <AntTable<T>
            columns={linked}
            dataSource={dataSource}
            loading={loading ?? false}
            onRow={record => ({
                onClick: event => {
                    if ((event.target as HTMLElement).closest('a')) return
                    void navigate(detailPath(record))
                },
                style: { cursor: 'pointer' },
            })}
            pagination={{
                hideOnSinglePage: true,
                pageSize: PAGE_SIZE,
                showSizeChanger: false,
            }}
            rowKey="id"
            scroll={{ x: 800 }}
        />
    )
}

export default Table

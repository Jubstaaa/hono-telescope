import React from 'react'
import { Button, Flex } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { QueryTable } from '../../components/tables/QueryTable'
import { useGetQueriesQuery } from '../../api/telescopeApi'

export const QueryListView: React.FC = () => {
  const { data: entries = [], isLoading, refetch } = useGetQueriesQuery({})

  return (
    <>
      <Flex vertical gap="large">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Queries</h1>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
        <QueryTable data={entries} loading={isLoading} />
      </Flex>
    </>
  )
}

export default QueryListView
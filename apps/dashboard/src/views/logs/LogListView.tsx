import React from 'react'
import { Button, Flex } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { LogTable } from '../../components/tables/LogTable'
import { useGetLogsQuery } from '../../api/telescopeApi'

export const LogListView: React.FC = () => {
  const { data: entries = [], isLoading, refetch } = useGetLogsQuery({})

  return (
    <>
      <Flex vertical gap="large">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Logs</h1>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refetch}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
        <LogTable entries={entries} loading={isLoading} />
      </Flex>
    </>
  )
}

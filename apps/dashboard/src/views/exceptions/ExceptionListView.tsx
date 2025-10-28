import React from 'react'
import { Button, Flex } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { ExceptionTable } from '../../components/tables/ExceptionTable'
import { useGetExceptionsQuery } from '../../api/telescopeApi'

export const ExceptionListView: React.FC = () => {
  const { data: entries = [], isLoading, refetch } = useGetExceptionsQuery({})

  return (
    <>
      <Flex vertical gap="large">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Exceptions</h1>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
        <ExceptionTable entries={entries} loading={isLoading} />
      </Flex>
    </>
  )
}
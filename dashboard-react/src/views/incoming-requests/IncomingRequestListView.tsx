import React from 'react'
import { Button, Flex } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { IncomingRequestTable } from '../../components/tables/IncomingRequestTable'
import { useGetIncomingRequestsQuery } from '../../api/telescopeApi'

export const IncomingRequestListView: React.FC = () => {
  const { data: entries = [], isLoading, refetch } = useGetIncomingRequestsQuery({})

  return (
    <>
      <Flex vertical gap="large">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Incoming Requests</h1>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
        <IncomingRequestTable entries={entries} loading={isLoading} />
      </Flex>
    </>
  )
}

export default IncomingRequestListView
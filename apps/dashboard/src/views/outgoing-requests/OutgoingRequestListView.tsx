import React from 'react'
import { Button, Flex } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { OutgoingRequestTable } from '../../components/tables/OutgoingRequestTable'
import { useGetOutgoingRequestsQuery } from '../../api/telescopeApi'

export const OutgoingRequestListView: React.FC = () => {
  const { data: entries = [], isLoading, refetch } = useGetOutgoingRequestsQuery({})

  return (
    <>
      <Flex vertical gap="large">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Outgoing Requests</h1>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
        <OutgoingRequestTable entries={entries} loading={isLoading} />
      </Flex>
    </>
  )
}

export default OutgoingRequestListView
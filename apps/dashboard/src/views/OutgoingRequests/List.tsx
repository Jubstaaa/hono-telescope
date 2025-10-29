import React from 'react'
import { Button, Flex, Typography, theme } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { OutgoingRequestTable } from '../../components/Table/OutgoingRequestTable'
import { useGetOutgoingRequestsQuery } from '../../api/telescopeApi'

const { Title } = Typography

export const OutgoingRequestList: React.FC = () => {
  const { token } = theme.useToken()
  const { data: entries = [], isLoading, refetch } = useGetOutgoingRequestsQuery()

  return (
    <>
      <Flex vertical gap="large">
          <Flex justify="space-between" align="center">
          <Title level={2} style={{ margin: 0, color: token.colorText }}>Outgoing Requests</Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refetch}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Flex>
        <OutgoingRequestTable entries={entries} loading={isLoading} />
      </Flex>
    </>
  )
}

export default OutgoingRequestList
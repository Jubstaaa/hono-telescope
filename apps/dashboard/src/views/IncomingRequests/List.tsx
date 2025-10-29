import React from 'react'
import { Button, Flex, Typography, theme } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { IncomingRequestTable } from '../../components/Table/IncomingRequestTable'
import { useGetIncomingRequestsQuery } from '../../api/telescopeApi'

const { Title } = Typography

export const IncomingRequestList: React.FC = () => {
  const { token } = theme.useToken()
  const { data: entries = [], isLoading, refetch } = useGetIncomingRequestsQuery()

  return (
    <>
      <Flex vertical gap="large">
        <Flex justify="space-between" align="center">
          <Title level={2} style={{ margin: 0, color: token.colorText }}>Incoming Requests</Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refetch}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Flex>
        <IncomingRequestTable entries={entries} loading={isLoading} />
      </Flex>
    </>
  )
}

export default IncomingRequestList
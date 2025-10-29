import React from 'react'
import { Button, Flex, Typography, theme } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { QueryTable } from '../../components/Table/QueryTable'
import { useGetQueriesQuery } from '../../api/telescopeApi'

const { Title } = Typography

export const QueryList: React.FC = () => {
  const { token } = theme.useToken()
  const { data: entries = [], isLoading, refetch } = useGetQueriesQuery()

  return (
    <>
      <Flex vertical gap="large">
            <Flex justify="space-between" align="center">
          <Title level={2} style={{ margin: 0, color: token.colorText }}>Queries</Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={refetch}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Flex>
        <QueryTable entries={entries} loading={isLoading} />
      </Flex>
    </>
  )
}

export default QueryList
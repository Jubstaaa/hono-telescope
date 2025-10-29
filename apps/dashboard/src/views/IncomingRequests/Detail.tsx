import React from 'react'
import { useParams } from 'react-router-dom'
import { Card, Typography, Alert, Descriptions, theme, Flex, Tabs } from 'antd'
import { useGetIncomingRequestQuery } from '../../api/telescopeApi'
  import { formatDate } from '../../utils/helpers'
import QueryTable from '../../components/Table/QueryTable'
import LogTable from '../../components/Table/LogTable'
import ExceptionTable from '../../components/Table/ExceptionTable'
import OutgoingRequestTable from '../../components/Table/OutgoingRequestTable'
import { JsonViewer } from '../../components/JsonViewer'
import Loader from '../../components/Loader'
import StatusTag from '../../components/Tag/StatusTag'
import MethodTag from '../../components/Tag/MethodTag'
import DurationTag from '../../components/Tag/DurationTag'
const { Title, Text } = Typography

export const IncomingRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = theme.useToken()
    const { data: response, isLoading, error } = useGetIncomingRequestQuery(id!, { skip: !id })

  if (isLoading) {  
    return <Loader />
  } 

  if (error || !response) {
    return (
      <Alert
        message="Error"
        description="Failed to load incoming request details"
        type="error"
        showIcon
      />
    )
  }

  const logs = response.relation_entries?.logs || []
  const queries = response.relation_entries?.queries || []
  const exceptions = response.relation_entries?.exceptions || []
  const outgoingRequests = response.relation_entries?.outgoing_requests || []


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ color: token.colorText }}>Incoming Request Details</Title>
      </div>

      <Flex vertical gap="large">

      <Card className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Method" span={1}>
            <MethodTag method={response.method} />
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            <StatusTag status={response.response_status} />
          </Descriptions.Item>
          <Descriptions.Item label="Path" span={2}>
            <Text code style={{ color: token.colorText }}>
              {response.uri || '/'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Duration" span={1}>
<DurationTag value={response.duration} />            </Descriptions.Item> 
          <Descriptions.Item label="Time" span={1}>
            {formatDate(response.created_at || '')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {response.headers && (
        <Card title="Headers" size="small" style={{ backgroundColor: token.colorBgContainer }}>
          <JsonViewer data={response.headers} />
        </Card>
      )}

      {response.payload && (
        <Card title="Request Body" size="small" style={{ backgroundColor: token.colorBgContainer }}>
          <JsonViewer data={response.payload} />
        </Card>
      )}

      {response.response && (
        <Card title="Response" size="small" style={{ backgroundColor: token.colorBgContainer }}>
          <JsonViewer data={response.response} />
        </Card>
      )}

      <Card style={{ backgroundColor: token.colorBgContainer }}>
        <Tabs
          items={[
            {
              key: 'logs',
              label: `Logs (${logs.length})`,
              children: (
                <LogTable
                  entries={logs}
                />
              )
            },
            {
              key: 'queries',
              label: `Queries (${queries.length})`,
              children: (
                <QueryTable entries={queries} />
              )
            },
            {
              key: 'exceptions',
              label: `Exceptions (${exceptions.length})`,
              children: (
                <ExceptionTable
                  entries={exceptions}
                />
              )
            },
            {
              key: 'outgoingRequests',
              label: `Outgoing Requests (${outgoingRequests.length})`,
              children: (
                <OutgoingRequestTable
                  entries={outgoingRequests}
                />
              )
            }
          ]}
        />
      </Card>
      </Flex>
    </>
  )
}
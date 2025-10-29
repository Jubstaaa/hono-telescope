import React from 'react'
import { useParams } from 'react-router-dom'
import { Card, Typography, Alert, Descriptions, Tag, theme, Flex } from 'antd'
import { useGetOutgoingRequestQuery } from '../../api/telescopeApi'
import { getStatusColor, formatDate } from '../../utils/helpers'
import Loader from '../../components/Loader'  
import { JsonViewer } from '../../components/JsonViewer'
import DurationTag from '../../components/Tag/DurationTag'
const { Title, Text } = Typography

export const OutgoingRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = theme.useToken()
  const { data: request, isLoading, error } = useGetOutgoingRequestQuery(id!, { skip: !id })

  if (isLoading) {
    return <Loader />
  }

  if (error || !request) {
    return (
      <Alert
        message="Error"
        description="Failed to load outgoing request details"
        type="error"
        showIcon
      />
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ color: token.colorText }}>Outgoing Request Details</Title>
      </div>

      <Flex vertical gap="large">

      <Card className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
        <Descriptions title="Request Information" bordered>
          <Descriptions.Item label="Method" span={1}>
            <Tag color="blue">{request.method}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            <Tag color={getStatusColor(request.response_status)}>
              {request.response_status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="URL" span={2}>
            <Text code style={{ color: token.colorText }}>
              {request.uri}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Duration" span={1}>
<DurationTag value={request.duration} />            </Descriptions.Item>
          <Descriptions.Item label="Time" span={1}>
            {formatDate(request.created_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {request.headers && (
        <Card title="Headers" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
            <JsonViewer data={request.headers} />
        </Card>
      )}

      {request.payload && (
        <Card title="Request Body" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <JsonViewer data={request.payload} />
        </Card>
      )}

      {request.response && (
        <Card title="Response" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
      <JsonViewer data={request.response} />
        </Card>
      )}

      </Flex>
    </>
  )
}

export default OutgoingRequestDetail
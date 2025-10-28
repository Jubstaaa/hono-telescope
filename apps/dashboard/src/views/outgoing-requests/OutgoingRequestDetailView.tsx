import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Space, Button, Tag, Descriptions, Alert, Spin, theme, Flex } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { formatTimestamp, formatDuration, getStatusColor } from '../../utils/tableUtils'
import { useGetOutgoingRequestQuery } from '../../api/telescopeApi'

const { Title, Text } = Typography

export const OutgoingRequestDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const { data: entry, isLoading, error, refetch } = useGetOutgoingRequestQuery(id || '', { skip: !id })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (error || !entry) {
    return (
      <Alert
        message="Error"
        description="Failed to load outgoing request details"
        type="error"
        showIcon
      />
    )
  }

  const content = entry.content

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ color: token.colorText }}>Outgoing Request Details</Title>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/outgoing-requests')}
          >
            Back
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Flex vertical gap="large">

      <Card className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
        <Descriptions title="Request Information" bordered>
          <Descriptions.Item label="Method" span={1}>
            <Tag color="blue">{content.method}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            <Tag color={getStatusColor(content.status)}>
              {content.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="URL" span={2}>
            <Text code style={{ color: token.colorText }}>
              {content.uri || content.url}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Duration" span={1}>
            {formatDuration(content.duration)}
          </Descriptions.Item>
          <Descriptions.Item label="Time" span={1}>
            {formatTimestamp(entry.created_at || '')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {content.headers && (
        <Card title="Headers" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <pre style={{ 
            fontSize: '14px',
            backgroundColor: token.colorBgLayout,
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto',
            color: token.colorText
          }}>
            {JSON.stringify(content.headers, null, 2)}
          </pre>
        </Card>
      )}

      {content.body && (
        <Card title="Request Body" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <pre style={{ 
            fontSize: '14px',
            backgroundColor: token.colorBgLayout,
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto',
            color: token.colorText
          }}>
            {typeof content.body === 'string' ? content.body : JSON.stringify(content.body, null, 2)}
          </pre>
        </Card>
      )}

      {content.response && (
        <Card title="Response" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <pre style={{ 
            fontSize: '14px',
            backgroundColor: token.colorBgLayout,
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto',
            color: token.colorText
          }}>
            {typeof content.response === 'string' ? content.response : JSON.stringify(content.response, null, 2)}
          </pre>
        </Card>
      )}
      </Flex>
    </>
  )
}

export default OutgoingRequestDetailView
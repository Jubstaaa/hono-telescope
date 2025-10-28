import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Space, Button, Tag, Descriptions, Alert, Spin, theme, Table, Flex } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { formatTimestamp, formatDuration, getStatusColor } from '../../utils/tableUtils'
import { useGetIncomingRequestQuery } from '../../api/telescopeApi'

const { Title, Text } = Typography

const getMethodColor = (method: string): string => {
  const colors: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple'
  }
  return colors[method] || 'default'
}

export const IncomingRequestDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  
  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useGetIncomingRequestQuery(id || '', { skip: !id })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (error || !response) {
    return (
      <div className="p-6">
        <Alert
          message="Error loading request details"
          description="The requested entry could not be found or loaded."
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      </div>
    )
  }

  const entry = response.request
  const children = response.children || []
  const content = entry.content || {}

  // Prepare children data for table
  const childrenColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => formatTimestamp(time),
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: (content: any) => (
        <Text ellipsis style={{ maxWidth: 300 }}>
          {typeof content === 'object' ? JSON.stringify(content) : String(content)}
        </Text>
      ),
    },
  ]

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ color: token.colorText }}>Request Details</Title>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/incoming-requests')}
          >
            Back to Requests
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Flex vertical gap="large">

          <Descriptions bordered column={2}>
            <Descriptions.Item label="Method" span={1}>
              <Tag color={getMethodColor(content.method)}>
                {content.method || 'GET'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <Tag color={getStatusColor(content.status)}>
                {content.status || '-'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Path" span={2}>
              <Text code style={{ color: token.colorText }}>
                {content.uri || content.path || '/'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Duration" span={1}>
              {formatDuration(content.duration)}
            </Descriptions.Item>
            <Descriptions.Item label="Time" span={1}>
              {formatTimestamp(entry.created_at || '')}
            </Descriptions.Item>
          </Descriptions>

          {content.headers && (
            <Card title="Headers" size="small" style={{ backgroundColor: token.colorBgContainer }}>
              <pre 
                style={{ 
                  fontSize: '12px', 
                  backgroundColor: token.colorBgLayout, 
                  color: token.colorText,
                  padding: '16px', 
                  borderRadius: '6px', 
                  overflow: 'auto' 
                }}
              >
                {JSON.stringify(content.headers, null, 2)}
              </pre>
            </Card>
          )}

          {content.body && (
            <Card title="Request Body" size="small" style={{ backgroundColor: token.colorBgContainer }}>
              <pre 
                style={{ 
                  fontSize: '12px', 
                  backgroundColor: token.colorBgLayout, 
                  color: token.colorText,
                  padding: '16px', 
                  borderRadius: '6px', 
                  overflow: 'auto' 
                }}
              >
                {typeof content.body === 'string' ? content.body : JSON.stringify(content.body, null, 2)}
              </pre>
            </Card>
          )}

          {content.response && (
            <Card title="Response" size="small" style={{ backgroundColor: token.colorBgContainer }}>
              <pre 
                style={{ 
                  fontSize: '12px', 
                  backgroundColor: token.colorBgLayout, 
                  color: token.colorText,
                  padding: '16px', 
                  borderRadius: '6px', 
                  overflow: 'auto' 
                }}
              >
                {typeof content.response === 'string' ? content.response : JSON.stringify(content.response, null, 2)}
              </pre>
            </Card>
          )}

          {children.length > 0 && (
            <Card title={`Related Entries (${children.length})`} size="small" style={{ backgroundColor: token.colorBgContainer }}>
              <Table
                columns={childrenColumns}
                dataSource={children}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </Flex>
    </>
  )
}

export default IncomingRequestDetailView
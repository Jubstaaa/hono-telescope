import React from 'react'
import { Card, Typography, Space, Button, Descriptions, Tag, Alert, Spin, theme, Flex } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetQueryQuery } from '../../api/telescopeApi'
import { formatTimestamp, formatDuration } from '../../utils/tableUtils'

const { Title, Text } = Typography

export const QueryDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  
  const {
    data: entry,
    isLoading,
    error,
    refetch
  } = useGetQueryQuery(id || '', { skip: !id })

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error loading query details"
          description={error ? String(error) : 'An unknown error occurred'}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="p-6">
        <Alert
          message="Query not found"
          description="The requested entry could not be found."
          type="warning"
          showIcon
        />
      </div>
    )
  }

  const content = entry.content || {}

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ color: token.colorText }}>Query Details</Title>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/queries')}
          >
            Back to Queries
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
            <Descriptions.Item label="Connection" span={1}>
              <Tag color="blue">
                {content.connection_name || 'default'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Duration" span={1}>
              {formatDuration(content.duration)}
            </Descriptions.Item>
            <Descriptions.Item label="Time" span={2}>
              {formatTimestamp(entry.created_at || '')}
            </Descriptions.Item>
          </Descriptions>

          {content.sql && (
            <Card title="SQL Query" size="small" style={{ backgroundColor: token.colorBgContainer }}>
              <pre 
                style={{
                  backgroundColor: token.colorBgLayout,
                  color: token.colorText,
                  padding: '16px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
              >
                {content.sql}
              </pre>
            </Card>
          )}

          {content.bindings && content.bindings.length > 0 && (
            <Card title="Bindings" size="small" style={{ backgroundColor: token.colorBgContainer }}>
              <Descriptions bordered size="small" column={1}>
                {content.bindings.map((binding: any, index: number) => (
                  <Descriptions.Item key={index} label={`Binding ${index + 1}`}>
                    <Text code>{String(binding)}</Text>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          )}

          {content.result && (
            <Card title="Result" size="small" style={{ backgroundColor: token.colorBgContainer }}>
              <pre 
                style={{
                  backgroundColor: token.colorBgLayout,
                  color: token.colorText,
                  padding: '16px',
                  borderRadius: '6px',
                  overflow: 'auto'
                }}
              >
                {typeof content.result === 'string' 
                  ? content.result 
                  : JSON.stringify(content.result, null, 2)
                }
              </pre>
            </Card>
          )}
        </Flex>
    </>
  )
}

export default QueryDetailView
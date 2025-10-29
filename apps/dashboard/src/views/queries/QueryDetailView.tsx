import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Spin, Alert, Descriptions, Tag, theme, Button, Space, Flex, Tabs, Table } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { useGetQueryQuery } from '../../api/telescopeApi'
import { formatDate } from '../../utils/tableUtils'
import { isQuery, type QueryEntryData } from '@hono-telescope/types'
import { formatDuration } from '../../utils/tableUtils'

const { Title, Text } = Typography

export const QueryDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const { data: entry, isLoading, error, refetch } = useGetQueryQuery(id || '', { skip: !id })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (error || !entry || !isQuery(entry)) {
    return (
      <Alert
        message="Error"
        description="Failed to load query details"
        type="error"
        showIcon
      />
    )
  }

  const query = entry as QueryEntryData

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
                {query.connection || 'default'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Duration" span={1}>
              {formatDuration(query.time)}
            </Descriptions.Item>
            <Descriptions.Item label="Time" span={2}>
              {formatDate(query.created_at)}
            </Descriptions.Item>
          </Descriptions>

          {(query as any).query && (
            <Card title="Query" size="small" style={{ backgroundColor: token.colorBgContainer }}>
              <pre 
                style={{
                  backgroundColor: token.colorBgLayout,
                  color: token.colorText,
                  padding: '16px',
                  borderRadius: '6px',
                  overflow: 'auto'
                }}
              >
                {(query as any).query}
              </pre>
            </Card>
          )}

          {query.bindings && query.bindings.length > 0 && (
            <Card title="Bindings" size="small" style={{ backgroundColor: token.colorBgContainer }}>
              <Descriptions bordered size="small" column={1}>
                {query.bindings.map((binding: any, index: number) => (
                  <Descriptions.Item key={index} label={`Binding ${index + 1}`}>
                    <Text code>{String(binding)}</Text>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          )}
      </Flex>
    </>
  )
}

export default QueryDetailView
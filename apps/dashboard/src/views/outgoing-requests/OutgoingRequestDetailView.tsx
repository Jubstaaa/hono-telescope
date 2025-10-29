import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Spin, Alert, Descriptions, Tag, Button, Space, theme, Flex, Tabs, Table } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { useGetOutgoingRequestQuery } from '../../api/telescopeApi'
import { getStatusColor, formatDuration, formatDate } from '../../utils/tableUtils'
import { isOutgoingRequest, type OutgoingRequestEntry } from '@hono-telescope/types'

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

  if (error || !entry || !isOutgoingRequest(entry)) {
    return (
      <Alert
        message="Error"
        description="Failed to load outgoing request details"
        type="error"
        showIcon
      />
    )
  }

  const request = entry as OutgoingRequestEntry

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
            {formatDuration(request.duration)}
          </Descriptions.Item>
          <Descriptions.Item label="Time" span={1}>
            {formatDate(request.created_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {request.headers && (
        <Card title="Headers" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <pre style={{ 
            fontSize: '14px',
            backgroundColor: token.colorBgLayout,
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto',
            color: token.colorText
          }}>
            {JSON.stringify(request.headers, null, 2)}
          </pre>
        </Card>
      )}

      {request.payload && (
        <Card title="Request Body" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <pre style={{ 
            fontSize: '14px',
            backgroundColor: token.colorBgLayout,
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto',
            color: token.colorText
          }}>
            {typeof request.payload === 'string' ? request.payload : JSON.stringify(request.payload, null, 2)}
          </pre>
        </Card>
      )}

      {request.response && (
        <Card title="Response" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <pre style={{ 
            fontSize: '14px',
            backgroundColor: token.colorBgLayout,
            padding: '16px',
            borderRadius: '6px',
            overflow: 'auto',
            color: token.colorText
          }}>
            {typeof request.response === 'string' ? request.response : JSON.stringify(request.response, null, 2)}
          </pre>
        </Card>
      )}

      {((entry as any).relation_entries?.logs?.length > 0 || (entry as any).relation_entries?.exceptions?.length > 0 || (entry as any).relation_entries?.queries?.length > 0) && (
        <Card style={{ backgroundColor: token.colorBgContainer }}>
          <Tabs
            items={[
              {
                key: 'logs',
                label: `Logs (${(entry as any).relation_entries?.logs?.length || 0})`,
                children: (
                  <Table
                    columns={[
                      { title: 'Level', dataIndex: 'level', key: 'level', width: 100 },
                      { title: 'Message', dataIndex: 'message', key: 'message' },
                      { title: 'Time', dataIndex: 'created_at', key: 'created_at', render: formatDate, width: 180 }
                    ]}
                    dataSource={(entry as any).relation_entries?.logs || []}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                )
              },
              {
                key: 'exceptions',
                label: `Exceptions (${(entry as any).relation_entries?.exceptions?.length || 0})`,
                children: (
                  <Table
                    columns={[
                      { title: 'Class', dataIndex: 'class', key: 'class' },
                      { title: 'Message', dataIndex: 'message', key: 'message' },
                      { title: 'Time', dataIndex: 'created_at', key: 'created_at', render: formatDate, width: 180 }
                    ]}
                    dataSource={(entry as any).relation_entries?.exceptions || []}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                )
              },
              {
                key: 'queries',
                label: `Queries (${(entry as any).relation_entries?.queries?.length || 0})`,
                children: (
                  <Table
                    columns={[
                      { title: 'Connection', dataIndex: 'connection', key: 'connection', width: 120 },
                      { title: 'Query', dataIndex: 'query', key: 'query' },
                      { title: 'Time', dataIndex: 'created_at', key: 'created_at', render: formatDate, width: 180 }
                    ]}
                    dataSource={(entry as any).relation_entries?.queries || []}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                )
              }
            ]}
          />
        </Card>
      )}
      </Flex>
    </>
  )
}

export default OutgoingRequestDetailView
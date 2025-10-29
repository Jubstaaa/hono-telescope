import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Spin, Alert, Descriptions, Tag, Button, Space, theme, Table, Flex, Tabs } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { useGetIncomingRequestQuery } from '../../api/telescopeApi'
import { formatDate, formatDuration } from '../../utils/tableUtils'
import { isIncomingRequest, type IncomingRequestEntry } from '@hono-telescope/types'

const { Title, Text } = Typography

export const IncomingRequestDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const { data: response, isLoading, error, refetch } = useGetIncomingRequestQuery(id || '', { skip: !id })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
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

  const entry = response as IncomingRequestEntry
  const logs = (entry as any).relation_entries?.logs || []
  const queries = (entry as any).relation_entries?.queries || []
  const exceptions = (entry as any).relation_entries?.exceptions || []
  const outgoingRequests = (entry as any).relation_entries?.outgoingRequests || []

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
      render: (time: string) => formatDate(time),
    },
    {
      title: 'Details',
      dataIndex: 'message',
      key: 'message',
      render: (_: any, record: any) => {
        if (record.type === 'log') return record.message || '-'
        if (record.type === 'query') return (record as any).query?.substring(0, 50) || '-'
        if (record.type === 'exception') return record.message || '-'
        return '-'
      },
    }
  ]

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'blue',
      POST: 'green',
      PUT: 'orange',
      DELETE: 'red',
      PATCH: 'cyan',
    }
    return colors[method] || 'default'
  }

  const getStatusColor = (status: number) => {
    if (status < 300) return 'green'
    if (status < 400) return 'blue'
    if (status < 500) return 'orange'
    return 'red'
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ color: token.colorText }}>Incoming Request Details</Title>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/incoming-requests')}
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
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Method" span={1}>
            <Tag color={getMethodColor(entry.method)}>
              {entry.method || 'GET'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status" span={1}>
            <Tag color={getStatusColor(entry.response_status)}>
              {entry.response_status || '-'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Path" span={2}>
            <Text code style={{ color: token.colorText }}>
              {entry.uri || '/'}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Duration" span={1}>
            {formatDuration(entry.duration)}
          </Descriptions.Item>
          <Descriptions.Item label="Time" span={1}>
            {formatDate(entry.created_at || '')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {entry.headers && (
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
            {JSON.stringify(entry.headers, null, 2)}
          </pre>
        </Card>
      )}

      {entry.payload && (
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
            {typeof entry.payload === 'string' ? entry.payload : JSON.stringify(entry.payload, null, 2)}
          </pre>
        </Card>
      )}

      {entry.response && (
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
            {typeof entry.response === 'string' ? entry.response : JSON.stringify(entry.response, null, 2)}
          </pre>
        </Card>
      )}

      <Card style={{ backgroundColor: token.colorBgContainer }}>
        <Tabs
          items={[
            {
              key: 'logs',
              label: `Logs (${logs.length})`,
              children: (
                <Table
                  columns={childrenColumns}
                  dataSource={logs}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              )
            },
            {
              key: 'queries',
              label: `Queries (${queries.length})`,
              children: (
                <Table
                  columns={childrenColumns}
                  dataSource={queries}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              )
            },
            {
              key: 'exceptions',
              label: `Exceptions (${exceptions.length})`,
              children: (
                <Table
                  columns={childrenColumns}
                  dataSource={exceptions}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
                />
              )
            },
            {
              key: 'outgoingRequests',
              label: `Outgoing Requests (${outgoingRequests.length})`,
              children: (
                <Table
                  columns={childrenColumns}
                  dataSource={outgoingRequests}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  size="small"
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
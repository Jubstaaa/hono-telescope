import React from 'react'
import { useParams } from 'react-router-dom'
import { Card, Typography, Spin, Alert, Descriptions, Tag, theme, Flex } from 'antd'
import {  useGetLogQuery } from '../../api/telescopeApi'
import { formatDate, getLevelName } from '../../utils/tableUtils'
import dayjs from 'dayjs'

const { Title } = Typography

export const LogDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = theme.useToken()
  const { data: entry, isLoading, error } = useGetLogQuery(id || '', { skip: !id })

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
        description="Failed to load log details"
        type="error"
        showIcon
      />
    )
  }

  return (
    <>
      <Title level={2} style={{ color: token.colorText }}>Log Details</Title>
      
      <Flex vertical gap="large">
      
      <Card className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
        <Descriptions title="Basic Information" bordered>
          <Descriptions.Item label="Level">
            <Tag color={(entry as any).level >= 4 ? 'red' : 'blue'}>{getLevelName((entry as any).level)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Time">
            {formatDate(entry.created_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Message" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
        <pre 
          style={{ 
            backgroundColor: token.colorBgLayout, 
            color: token.colorText,
            padding: '16px', 
            borderRadius: '6px', 
            overflow: 'auto' 
          }}
        >
          <code>{(entry as any).message}</code>
        </pre>
      </Card>

      {(entry as any).context && Object.keys((entry as any).context).length > 0 && (
        <Card title="Context" style={{ backgroundColor: token.colorBgContainer }}>
          <pre 
            style={{ 
              backgroundColor: token.colorBgLayout, 
              color: token.colorText,
              padding: '16px', 
              borderRadius: '6px', 
              overflow: 'auto' 
            }}
          >
            <code>{JSON.stringify((entry as any).context, null, 2)}</code>
          </pre>
        </Card>
      )}
      </Flex>
    </>
  )
}
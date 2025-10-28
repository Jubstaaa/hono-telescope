import React from 'react'
import { useParams } from 'react-router-dom'
import { Card, Typography, Spin, Alert, Descriptions, Tag, theme, Flex } from 'antd'
import { useGetExceptionQuery } from '../../api/telescopeApi'
import { formatTimestamp } from '../../utils/tableUtils'

const { Title } = Typography

export const ExceptionDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = theme.useToken()
  const { data: entry, isLoading, error } = useGetExceptionQuery(id || '', { skip: !id })

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
        description="Failed to load exception details"
        type="error"
        showIcon
      />
    )
  }

  const content = entry.content

  return (
    <>
      <Title level={2} style={{ color: token.colorText }}>Exception Details</Title>
      
      <Flex vertical gap="large">
      
      <Card className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
        <Descriptions title="Basic Information" bordered>
          <Descriptions.Item label="Exception">
            <Tag color="red">{content.class}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="File">
            {content.file}:{content.line}
          </Descriptions.Item>
          <Descriptions.Item label="Time">
            {formatTimestamp(entry.timestamp.toString())}
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
          <code>{content.message}</code>
        </pre>
      </Card>

      {content.trace && content.trace.length > 0 && (
        <Card title="Stack Trace" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <pre 
            style={{ 
              backgroundColor: token.colorBgLayout, 
              color: token.colorText,
              padding: '16px', 
              borderRadius: '6px', 
              overflow: 'auto',
              fontSize: '12px'
            }}
          >
            <code>{content.trace.join('\n')}</code>
          </pre>
        </Card>
      )}

      {content.context && Object.keys(content.context).length > 0 && (
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
            <code>{JSON.stringify(content.context, null, 2)}</code>
          </pre>
        </Card>
      )}
      </Flex>
    </>
  )
}
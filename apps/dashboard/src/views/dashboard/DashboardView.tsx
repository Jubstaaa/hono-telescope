import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Typography, Alert, Button, Flex } from 'antd'
import { useNavigate } from 'react-router-dom'
import { 
  DownloadOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { map } from 'lodash'

const { Title } = Typography

interface DashboardStats {
  incomingRequests: {
    total: number
  }
  outgoingRequests: {
    total: number
  }
  exceptions: {
    total: number
  }
  queries: {
    total: number
  }
  logs: {
    total: number
  }
}

export const DashboardView: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    incomingRequests: { total: 0 },
    outgoingRequests: { total: 0 },
    exceptions: { total: 0 },
    queries: { total: 0 },
    logs: { total: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const statsResponse = await fetch('/telescope/api/stats')
      if (!statsResponse.ok) throw new Error('Failed to fetch stats')
      const statsData = await statsResponse.json()
      
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 5000)
    return () => clearInterval(interval)
  }, [])

  const statsCards = [
    { 
      title: 'Incoming Requests', 
      value: stats.incomingRequests.total, 
      icon: <DownloadOutlined />, 
      color: '#1890ff',
      path: '/incoming-requests'
    },
    { 
      title: 'Outgoing Requests', 
      value: stats.outgoingRequests.total, 
      icon: <UploadOutlined />, 
      color: '#13c2c2',
      path: '/outgoing-requests'
    },
    { 
      title: 'Exceptions', 
      value: stats.exceptions.total, 
      icon: <ExclamationCircleOutlined />, 
      color: '#ff4d4f',
      path: '/exceptions'
    },
    { 
      title: 'Queries', 
      value: stats.queries.total, 
      icon: <DatabaseOutlined />, 
      color: '#52c41a',
      path: '/queries'
    },
    { 
      title: 'Logs', 
      value: stats.logs.total, 
      icon: <FileTextOutlined />, 
      color: '#fa8c16',
      path: '/logs'
    }
  ]

  if (error) {
    return (
      <Alert
        message="Error Loading Dashboard"
        description={error}
        type="error"
        showIcon
        action={
          <Button onClick={fetchDashboardData}>
            Retry
          </Button>
        }
      />
    )
  }

  return (
    <>
      <Flex vertical gap="large">
        <Title level={2}>Dashboard</Title>
        
        {/* Stats Cards */}
        <Row gutter={[16, 16]}>
          {map(statsCards, (stat) => (
            <Col xs={12} sm={8} md={6} lg={5} key={stat.title}>
              <Card 
                loading={loading}
                hoverable
                onClick={() => navigate(stat.path)}
                style={{ cursor: 'pointer' }}
              >
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={
                    <span style={{ color: stat.color }}>
                      {stat.icon}
                    </span>
                  }
                  valueStyle={{ color: stat.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Flex>
    </>
  )
}
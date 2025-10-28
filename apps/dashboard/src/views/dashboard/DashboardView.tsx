import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Typography, Alert, Button, Flex } from 'antd'
import { 
  GlobalOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { map } from 'lodash'

const { Title } = Typography

interface DashboardStats {
  requests: number
  exceptions: number
  queries: number
  logs: number
  jobs: number
  mail: number
  notifications: number
  cache: number
}

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    requests: 0,
    exceptions: 0,
    queries: 0,
    logs: 0,
    jobs: 0,
    mail: 0,
    notifications: 0,
    cache: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch stats from the API
      const statsResponse = await fetch('/telescope/api/stats')
      if (!statsResponse.ok) throw new Error('Failed to fetch stats')
      const statsData = await statsResponse.json()
      
      // Map the API response to our stats format
      setStats({
        requests: statsData.requests?.total || 0,
        exceptions: statsData.exceptions?.total || 0,
        queries: 0, // Will be calculated from entries if needed
        logs: 0,
        jobs: 0,
        mail: 0,
        notifications: 0,
        cache: 0
      })
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
    { title: 'Requests', value: stats.requests, icon: <GlobalOutlined />, color: '#1890ff' },
    { title: 'Exceptions', value: stats.exceptions, icon: <ExclamationCircleOutlined />, color: '#ff4d4f' },
    { title: 'Queries', value: stats.queries, icon: <DatabaseOutlined />, color: '#52c41a' },
    { title: 'Logs', value: stats.logs, icon: <FileTextOutlined />, color: '#fa8c16' },
    { title: 'Jobs', value: stats.jobs, icon: <ThunderboltOutlined />, color: '#722ed1' },
    { title: 'Mail', value: stats.mail, icon: <LinkOutlined />, color: '#13c2c2' },
    { title: 'Notifications', value: stats.notifications, icon: <WarningOutlined />, color: '#eb2f96' },
    { title: 'Cache', value: stats.cache, icon: <CheckCircleOutlined />, color: '#a0d911' },
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
            <Col xs={12} sm={8} md={6} lg={3} key={stat.title}>
              <Card loading={loading}>
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
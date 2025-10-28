import { Row, Col, Card, Statistic, Progress } from 'antd'
import { 
  BarChartOutlined, 
  GlobalOutlined, 
  ExceptionOutlined, 
  ClockCircleOutlined,
  RiseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { map } from 'lodash'
import { TelescopeStats } from '../types'

interface StatsGridProps {
  stats: TelescopeStats
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statCards = [
    {
      title: 'Total Entries',
      value: stats.total_entries,
      icon: <BarChartOutlined />,
      color: '#1890ff',
      bgGradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
      description: 'All recorded entries'
    },
    {
      title: 'HTTP Requests',
      value: stats.requests.total,
      icon: <GlobalOutlined />,
      color: '#52c41a',
      bgGradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
      description: 'Total HTTP requests'
    },
    {
      title: 'Average Duration',
      value: stats.requests.avg_duration,
      suffix: 'ms',
      precision: 1,
      icon: <ClockCircleOutlined />,
      color: '#fa8c16',
      bgGradient: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
      description: 'Response time average'
    },
    {
      title: 'Exceptions',
      value: stats.exceptions.total,
      icon: <ExceptionOutlined />,
      color: '#ff4d4f',
      bgGradient: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
      description: 'Error occurrences'
    }
  ]

  // Calculate success rate for progress indicator
  const successRate = stats.requests.total > 0 
    ? Math.round(((stats.requests.total - stats.exceptions.total) / stats.requests.total) * 100)
    : 100

  return (
    <div style={{ padding: '24px 0' }}>
      <Row gutter={[24, 24]}>
        {map(statCards, (card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              hoverable
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ 
                padding: '24px',
                position: 'relative',
                zIndex: 2
              }}
            >
              {/* Background gradient overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: card.bgGradient,
                  opacity: 0.1,
                  zIndex: 1
                }}
              />
              
              {/* Icon container */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: card.bgGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: '#fff',
                    boxShadow: `0 4px 12px ${card.color}40`
                  }}
                >
                  {card.icon}
                </div>
                <RiseOutlined 
                  style={{ 
                    color: card.color, 
                    fontSize: '16px',
                    opacity: 0.6
                  }} 
                />
              </div>

              {/* Main statistic */}
              <Statistic
                title={
                  <div>
                    <div style={{ 
                      color: '#fff', 
                      fontSize: '14px',
                      fontWeight: 500,
                      marginBottom: '4px'
                    }}>
                      {card.title}
                    </div>
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.6)', 
                      fontSize: '12px',
                      fontWeight: 400
                    }}>
                      {card.description}
                    </div>
                  </div>
                }
                value={card.value}
                precision={card.precision}
                suffix={card.suffix}
                valueStyle={{
                  color: '#fff',
                  fontSize: '28px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginTop: '8px'
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Success Rate Indicator */}
      <Row style={{ marginTop: '32px' }}>
        <Col span={24}>
          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <CheckCircleOutlined 
                style={{ 
                  fontSize: '24px', 
                  color: successRate >= 95 ? '#52c41a' : successRate >= 80 ? '#fa8c16' : '#ff4d4f'
                }} 
              />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: '#fff', 
                  fontSize: '16px', 
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  System Health: {successRate}%
                </div>
                <Progress
                  percent={successRate}
                  strokeColor={{
                    '0%': successRate >= 95 ? '#52c41a' : successRate >= 80 ? '#fa8c16' : '#ff4d4f',
                    '100%': successRate >= 95 ? '#73d13d' : successRate >= 80 ? '#ffc53d' : '#ff7875'
                  }}
                  trailColor="rgba(255, 255, 255, 0.1)"
                  showInfo={false}
                  strokeWidth={8}
                  style={{ margin: 0 }}
                />
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {stats.requests.total - stats.exceptions.total} successful requests out of {stats.requests.total} total
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
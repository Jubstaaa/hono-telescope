import { Card, Row, Col, Statistic, Typography, Alert, Button, Flex, Grid } from 'antd';
import { useNavigate } from 'react-router';
import {
  DownloadOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useGetStatsQuery } from '../../api/telescopeApi';

const { Title } = Typography;
const { useBreakpoint } = Grid;

const statsCards = [
  {
    title: 'Incoming Requests',
    key: 'incomingRequests' as const,
    icon: <DownloadOutlined />,
    color: '#1890ff',
    path: '/incoming-requests',
  },
  {
    title: 'Outgoing Requests',
    key: 'outgoingRequests' as const,
    icon: <UploadOutlined />,
    color: '#13c2c2',
    path: '/outgoing-requests',
  },
  {
    title: 'Exceptions',
    key: 'exceptions' as const,
    icon: <ExclamationCircleOutlined />,
    color: '#ff4d4f',
    path: '/exceptions',
  },
  {
    title: 'Queries',
    key: 'queries' as const,
    icon: <DatabaseOutlined />,
    color: '#52c41a',
    path: '/queries',
  },
  {
    title: 'Logs',
    key: 'logs' as const,
    icon: <FileTextOutlined />,
    color: '#fa8c16',
    path: '/logs',
  },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { data: stats, isLoading, error, refetch } = useGetStatsQuery();

  if (error) {
    return (
      <Alert
        message="Error Loading Dashboard"
        description={error instanceof Error ? error.message : 'Failed to load dashboard data'}
        type="error"
        showIcon
        action={<Button onClick={refetch}>Retry</Button>}
      />
    );
  }

  return (
    <Flex vertical gap="large">
      <Title level={2} style={{ margin: 0 }}>
        Dashboard
      </Title>

      <Row gutter={[16, 16]}>
        {statsCards.map((stat) => (
          <Col key={stat.title} xs={12} sm={12} md={8} lg={4} xl={4} flex="20%">
            <Card
              loading={isLoading}
              hoverable
              onClick={() => navigate(stat.path)}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <Statistic
                title={stat.title}
                value={stats?.[stat.key].total ?? 0}
                prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                valueStyle={{ color: stat.color, fontSize: screens.xs ? '18px' : '24px' }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Flex>
  );
};

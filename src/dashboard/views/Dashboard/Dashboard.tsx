import { useNavigate } from 'react-router';

import {
  DatabaseOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Flex, Grid, Row, Statistic, Typography } from 'antd';

import { useStats } from '../../hooks/use-entries';

const { Title } = Typography;
const { useBreakpoint } = Grid;

const statsCards = [
  {
    color: '#1890ff',
    icon: <DownloadOutlined />,
    key: 'incomingRequests' as const,
    path: '/incoming-requests',
    title: 'Incoming Requests',
  },
  {
    color: '#13c2c2',
    icon: <UploadOutlined />,
    key: 'outgoingRequests' as const,
    path: '/outgoing-requests',
    title: 'Outgoing Requests',
  },
  {
    color: '#ff4d4f',
    icon: <ExclamationCircleOutlined />,
    key: 'exceptions' as const,
    path: '/exceptions',
    title: 'Exceptions',
  },
  {
    color: '#52c41a',
    icon: <DatabaseOutlined />,
    key: 'queries' as const,
    path: '/queries',
    title: 'Queries',
  },
  {
    color: '#fa8c16',
    icon: <FileTextOutlined />,
    key: 'logs' as const,
    path: '/logs',
    title: 'Logs',
  },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { data: stats, error, isLoading, refetch } = useStats();

  if (error) {
    return (
      <Alert
        showIcon
        action={<Button onClick={refetch}>Retry</Button>}
        description={error instanceof Error ? error.message : 'Failed to load dashboard data'}
        message="Error Loading Dashboard"
        type="error"
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
          <Col key={stat.title} flex="20%" lg={4} md={8} sm={12} xl={4} xs={12}>
            <Card
              hoverable
              loading={isLoading}
              style={{ cursor: 'pointer', height: '100%' }}
              onClick={() => navigate(stat.path)}
            >
              <Statistic
                prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                title={stat.title}
                value={stats?.[stat.key].total ?? 0}
                valueStyle={{ color: stat.color, fontSize: screens.xs ? '18px' : '24px' }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Flex>
  );
};

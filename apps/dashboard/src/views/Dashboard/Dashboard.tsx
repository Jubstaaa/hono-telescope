import React from 'react';
import { Card, Row, Col, Statistic, Typography, Alert, Button, Flex } from 'antd';
import { useNavigate } from 'react-router';
import {
  DownloadOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { map } from 'lodash';
import { useGetStatsQuery } from '../../api/telescopeApi';

const { Title } = Typography;

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading, error, refetch } = useGetStatsQuery();

  const statsCards = [
    {
      title: 'Incoming Requests',
      value: stats?.incomingRequests.total ?? 0,
      icon: <DownloadOutlined />,
      color: '#1890ff',
      path: '/incoming-requests',
    },
    {
      title: 'Outgoing Requests',
      value: stats?.outgoingRequests.total ?? 0,
      icon: <UploadOutlined />,
      color: '#13c2c2',
      path: '/outgoing-requests',
    },
    {
      title: 'Exceptions',
      value: stats?.exceptions.total ?? 0,
      icon: <ExclamationCircleOutlined />,
      color: '#ff4d4f',
      path: '/exceptions',
    },
    {
      title: 'Queries',
      value: stats?.queries.total ?? 0,
      icon: <DatabaseOutlined />,
      color: '#52c41a',
      path: '/queries',
    },
    {
      title: 'Logs',
      value: stats?.logs.total ?? 0,
      icon: <FileTextOutlined />,
      color: '#fa8c16',
      path: '/logs',
    },
  ];

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
    <>
      <Flex vertical gap="large">
        <Title level={2}>Dashboard</Title>

        <Row gutter={[16, 16]} wrap={false} style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {map(statsCards, (stat) => (
            <Col
              key={stat.title}
              style={{
                flex: '0 0 auto',
                minWidth: 220,
                maxWidth: 260,
              }}
            >
              <Card
                loading={isLoading}
                hoverable
                onClick={() => navigate(stat.path)}
                style={{ cursor: 'pointer', height: '100%' }}
              >
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                  valueStyle={{ color: stat.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Flex>
    </>
  );
};

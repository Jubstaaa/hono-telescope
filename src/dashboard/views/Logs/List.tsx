import React from 'react';
import { Button, Flex, Typography, theme } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { LogTable } from '../../components/Table/LogTable';
import { useGetLogsQuery } from '../../api/telescopeApi';

const { Title } = Typography;

export const LogList: React.FC = () => {
  const { token } = theme.useToken();
  const { data: entries = [], isLoading, refetch } = useGetLogsQuery();

  return (
    <>
      <Flex vertical gap="large">
        <Flex justify="space-between" align="center">
          <Title level={2} style={{ margin: 0, color: token.colorText }}>
            Logs
          </Title>
          <Button icon={<ReloadOutlined />} onClick={refetch} loading={isLoading}>
            Refresh
          </Button>
        </Flex>
        <LogTable entries={entries} loading={isLoading} />
      </Flex>
    </>
  );
};

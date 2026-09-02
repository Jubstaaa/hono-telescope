import { ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, theme, Typography } from 'antd';

import type { LogResponse } from '@/types';

import { LogTable } from '../../components/Table/LogTable';
import { useList } from '../../hooks/use-entries';

const { Title } = Typography;

export const LogList = () => {
  const { token } = theme.useToken();
  const { data: entries, isLoading, refetch } = useList<LogResponse>('logs');

  return (
    <Flex vertical gap="large">
      <Flex align="center" justify="space-between">
        <Title level={2} style={{ color: token.colorText, margin: 0 }}>
          Logs
        </Title>
        <Button icon={<ReloadOutlined />} loading={isLoading} onClick={refetch}>
          Refresh
        </Button>
      </Flex>
      <LogTable entries={entries} loading={isLoading} />
    </Flex>
  );
};

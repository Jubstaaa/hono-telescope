import { ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, theme, Typography } from 'antd';

import type { OutgoingRequestResponse } from '@/core/hono/dashboard-api';

import { OutgoingRequestTable } from '../../components/outgoing-request-table/outgoing-request-table';
import { useList } from '../../hooks/use-entries';

const { Title } = Typography;

export const OutgoingRequestList = () => {
  const { token } = theme.useToken();
  const {
    data: entries,
    isLoading,
    isRefreshing,
    refetch,
  } = useList<OutgoingRequestResponse>('outgoing-requests');

  return (
    <Flex vertical gap="large">
      <Flex align="center" justify="space-between">
        <Title level={2} style={{ color: token.colorText, margin: 0 }}>
          Outgoing Requests
        </Title>
        <Button icon={<ReloadOutlined />} loading={isRefreshing} onClick={refetch}>
          Refresh
        </Button>
      </Flex>
      <OutgoingRequestTable entries={entries} loading={isLoading} />
    </Flex>
  );
};

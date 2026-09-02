import { ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, theme, Typography } from 'antd';

import type { IncomingRequestResponse } from '@/types';

import { IncomingRequestTable } from '../../components/Table/IncomingRequestTable';
import { useList } from '../../hooks/use-entries';

const { Title } = Typography;

export const IncomingRequestList = () => {
  const { token } = theme.useToken();
  const {
    data: entries,
    isLoading,
    refetch,
  } = useList<IncomingRequestResponse>('incoming-requests');

  return (
    <Flex vertical gap="large">
      <Flex align="center" justify="space-between">
        <Title level={2} style={{ color: token.colorText, margin: 0 }}>
          Incoming Requests
        </Title>
        <Button icon={<ReloadOutlined />} loading={isLoading} onClick={refetch}>
          Refresh
        </Button>
      </Flex>
      <IncomingRequestTable entries={entries} loading={isLoading} />
    </Flex>
  );
};

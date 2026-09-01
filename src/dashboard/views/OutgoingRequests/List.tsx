import { Button, Flex, Typography, theme } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { OutgoingRequestTable } from '../../components/Table/OutgoingRequestTable';
import { useList } from '../../hooks/use-entries';
import type { OutgoingRequestResponse } from '@/types';

const { Title } = Typography;

export const OutgoingRequestList = () => {
  const { token } = theme.useToken();
  const {
    data: entries,
    isLoading,
    refetch,
  } = useList<OutgoingRequestResponse>('outgoing-requests');

  return (
    <Flex vertical gap="large">
      <Flex justify="space-between" align="center">
        <Title level={2} style={{ margin: 0, color: token.colorText }}>
          Outgoing Requests
        </Title>
        <Button icon={<ReloadOutlined />} onClick={refetch} loading={isLoading}>
          Refresh
        </Button>
      </Flex>
      <OutgoingRequestTable entries={entries} loading={isLoading} />
    </Flex>
  );
};

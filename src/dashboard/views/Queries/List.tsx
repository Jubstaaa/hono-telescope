import { Button, Flex, Typography, theme } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { QueryTable } from '../../components/Table/QueryTable';
import { useList } from '../../hooks/use-entries';
import type { QueryResponse } from '@/types';

const { Title } = Typography;

export const QueryList = () => {
  const { token } = theme.useToken();
  const { data: entries, isLoading, refetch } = useList<QueryResponse>('queries');

  return (
    <Flex vertical gap="large">
      <Flex justify="space-between" align="center">
        <Title level={2} style={{ margin: 0, color: token.colorText }}>
          Queries
        </Title>
        <Button icon={<ReloadOutlined />} onClick={refetch} loading={isLoading}>
          Refresh
        </Button>
      </Flex>
      <QueryTable entries={entries} loading={isLoading} />
    </Flex>
  );
};

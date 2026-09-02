import { ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, theme, Typography } from 'antd';

import type { QueryResponse } from '@/types';

import { QueryTable } from '../../components/Table/QueryTable';
import { useList } from '../../hooks/use-entries';

const { Title } = Typography;

export const QueryList = () => {
  const { token } = theme.useToken();
  const { data: entries, isLoading, refetch } = useList<QueryResponse>('queries');

  return (
    <Flex vertical gap="large">
      <Flex align="center" justify="space-between">
        <Title level={2} style={{ color: token.colorText, margin: 0 }}>
          Queries
        </Title>
        <Button icon={<ReloadOutlined />} loading={isLoading} onClick={refetch}>
          Refresh
        </Button>
      </Flex>
      <QueryTable entries={entries} loading={isLoading} />
    </Flex>
  );
};

import { ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, theme, Typography } from 'antd';

import type { ExceptionResponse } from '@/types';

import { ExceptionTable } from '../../components/Table/ExceptionTable';
import { useList } from '../../hooks/use-entries';

const { Title } = Typography;

export const ExceptionList = () => {
  const { token } = theme.useToken();
  const { data: entries, isLoading, refetch } = useList<ExceptionResponse>('exceptions');

  return (
    <Flex vertical gap="large">
      <Flex align="center" justify="space-between">
        <Title level={2} style={{ color: token.colorText, margin: 0 }}>
          Exceptions
        </Title>
        <Button icon={<ReloadOutlined />} loading={isLoading} onClick={refetch}>
          Refresh
        </Button>
      </Flex>
      <ExceptionTable entries={entries} loading={isLoading} />
    </Flex>
  );
};

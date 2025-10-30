import React from 'react';
import { Button, Flex, Typography, theme } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ExceptionTable } from '../../components/Table/ExceptionTable';
import { useGetExceptionsQuery } from '../../api/telescopeApi';

const { Title } = Typography;

export const ExceptionList: React.FC = () => {
  const { token } = theme.useToken();
  const { data: entries = [], isLoading, refetch } = useGetExceptionsQuery();

  return (
    <>
      <Flex vertical gap="large">
        <Flex justify="space-between" align="center">
          <Title level={2} style={{ margin: 0, color: token.colorText }}>
            Exceptions
          </Title>
          <Button icon={<ReloadOutlined />} onClick={refetch} loading={isLoading}>
            Refresh
          </Button>
        </Flex>
        <ExceptionTable entries={entries} loading={isLoading} />
      </Flex>
    </>
  );
};

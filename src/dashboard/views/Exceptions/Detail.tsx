import React from 'react';
import { useParams } from 'react-router';
import { Card, Typography, Alert, Descriptions, theme, Flex, Grid } from 'antd';
import { useGetExceptionQuery } from '../../api/telescopeApi';
import { formatDate } from '../../utils/helpers';
import Loader from '../../components/Loader';
import ExceptionTag from '../../components/Tag/ExceptionTag';
import { JsonViewer } from '../../components/JsonViewer';
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export const ExceptionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { data: entry, isLoading, error } = useGetExceptionQuery(id!, { skip: !id });

  if (isLoading) {
    return <Loader />;
  }

  if (error || !entry) {
    return (
      <Alert message="Error" description="Failed to load exception details" type="error" showIcon />
    );
  }

  const descriptionsColumn = screens.md ? 2 : 1;

  return (
    <>
      <Title level={2} style={{ color: token.colorText }}>
        Exception Details
      </Title>

      <Flex vertical gap="large" style={{ padding: '0' }}>
        <Card className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <Descriptions
            title="Basic Information"
            bordered={screens.xs ? false : true}
            column={descriptionsColumn}
          >
            <Descriptions.Item label="Exception">
              <ExceptionTag classNum={entry.class} />
            </Descriptions.Item>
            <Descriptions.Item label="Time">{formatDate(entry.created_at)}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Message" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <Text>{entry.message}</Text>
        </Card>

        {entry.trace && entry.trace.length > 0 && (
          <Card
            title="Stack Trace"
            className="mb-4"
            style={{ backgroundColor: token.colorBgContainer }}
          >
            <Text code>{entry.trace}</Text>
          </Card>
        )}

        {entry.context && Object.keys(entry.context).length > 0 && (
          <Card title="Context" style={{ backgroundColor: token.colorBgContainer }}>
            <JsonViewer data={entry.context} />
          </Card>
        )}
      </Flex>
    </>
  );
};

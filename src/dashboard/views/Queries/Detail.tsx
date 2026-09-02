import { Link, useParams } from 'react-router';

import { Alert, Card, Descriptions, Flex, Grid, Tag, theme, Typography } from 'antd';

import type { QueryDetailResponse } from '@/types';

import Loader from '../../components/Loader';
import DurationTag from '../../components/Tag/DurationTag';
import { useDetail } from '../../hooks/use-entries';
import { formatDate } from '../../utils/helpers';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

export const QueryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { data: query, error, isLoading } = useDetail<QueryDetailResponse>('queries', id);

  if (isLoading) {
    return <Loader />;
  }

  if (error || !query) {
    return (
      <Alert showIcon description="Failed to load query details" message="Error" type="error" />
    );
  }

  const descriptionsColumn = screens.md ? 2 : 1;

  return (
    <>
      <Title level={2} style={{ color: token.colorText }}>
        Query Details
      </Title>

      <Flex vertical gap="large">
        <Card style={{ backgroundColor: token.colorBgContainer }}>
          <Descriptions bordered={!screens.xs} column={descriptionsColumn}>
            <Descriptions.Item label="Connection" span={1}>
              <Tag color="blue">{query.connection || 'default'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Duration" span={1}>
              <DurationTag slowAt={200} value={query.time} warnAt={50} />
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              {query.failed ? <Tag color="red">failed</Tag> : <Tag color="green">ok</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Time" span={1}>
              {formatDate(query.created_at)}
            </Descriptions.Item>
            {query.parent_id && (
              <Descriptions.Item label="Request" span={descriptionsColumn}>
                <Link to={`/incoming-requests/${query.parent_id}`}>
                  Open the request this query ran in
                </Link>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {query.failed && (
          <Alert
            showIcon
            description={query.error ?? 'The database client reported no message.'}
            message="This query failed"
            type="error"
          />
        )}

        {query.query && (
          <Card size="small" style={{ backgroundColor: token.colorBgContainer }} title="Query">
            <Text
              style={{
                display: 'block',
                fontFamily: 'monospace',
                fontSize: 13,
                whiteSpace: 'pre-wrap',
              }}
            >
              {query.query}
            </Text>
          </Card>
        )}

        {query.bindings && query.bindings.length > 0 && (
          <Card size="small" style={{ backgroundColor: token.colorBgContainer }} title="Bindings">
            <Descriptions bordered={!screens.xs} column={1} size="small">
              {query.bindings.map((binding: string, index: number) => (
                <Descriptions.Item key={index} label={`Binding ${index + 1}`}>
                  <Text code>{binding}</Text>
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        )}
      </Flex>
    </>
  );
};

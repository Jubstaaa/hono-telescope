import { Link, useParams } from 'react-router';
import { Card, Typography, Alert, Descriptions, Tag, theme, Flex, Grid } from 'antd';
import { useDetail } from '../../hooks/use-entries';
import type { QueryDetailResponse } from '@/types';
import { formatDate } from '../../utils/helpers';
import Loader from '../../components/Loader';
import DurationTag from '../../components/Tag/DurationTag';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export const QueryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { data: query, isLoading, error } = useDetail<QueryDetailResponse>('queries', id);

  if (isLoading) {
    return <Loader />;
  }

  if (error || !query) {
    return (
      <Alert message="Error" description="Failed to load query details" type="error" showIcon />
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
              <DurationTag value={query.time} warnAt={50} slowAt={200} />
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
            message="This query failed"
            description={query.error ?? 'The database client reported no message.'}
            type="error"
            showIcon
          />
        )}

        {query.query && (
          <Card title="Query" size="small" style={{ backgroundColor: token.colorBgContainer }}>
            <Text
              style={{
                display: 'block',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: 13,
              }}
            >
              {query.query}
            </Text>
          </Card>
        )}

        {query.bindings && query.bindings.length > 0 && (
          <Card title="Bindings" size="small" style={{ backgroundColor: token.colorBgContainer }}>
            <Descriptions bordered={!screens.xs} size="small" column={1}>
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

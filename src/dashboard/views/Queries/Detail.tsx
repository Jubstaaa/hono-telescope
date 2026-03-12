import { useParams } from 'react-router';
import { Card, Typography, Alert, Descriptions, Tag, theme, Flex, Grid } from 'antd';
import { useGetQueryQuery } from '../../api/telescopeApi';
import { formatDate } from '../../utils/helpers';
import Loader from '../../components/Loader';
import DurationTag from '../../components/Tag/DurationTag';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export const QueryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { data: query, isLoading, error } = useGetQueryQuery(id!, { skip: !id });

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
              <DurationTag value={query.time} />
            </Descriptions.Item>
            <Descriptions.Item label="Time" span={2}>
              {formatDate(query.created_at)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {query.query && (
          <Card title="Query" size="small" style={{ backgroundColor: token.colorBgContainer }}>
            {query.query}
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

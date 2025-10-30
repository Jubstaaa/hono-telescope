import React from 'react';
import { useParams } from 'react-router';
import { Card, Typography, Alert, Descriptions, Tag, theme, Flex } from 'antd';
import { useGetQueryQuery } from '../../api/telescopeApi';
import { formatDate } from '../../utils/helpers';
import Loader from '../../components/Loader';
import { map } from 'lodash';
import DurationTag from '../../components/Tag/DurationTag';
const { Title, Text } = Typography;

export const QueryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const { data: entry, isLoading, error } = useGetQueryQuery(id!, { skip: !id });

  if (isLoading) {
    return <Loader />;
  }

  if (error || !entry) {
    return (
      <Alert message="Error" description="Failed to load query details" type="error" showIcon />
    );
  }

  const query = entry;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <Title level={2} style={{ color: token.colorText }}>
          Query Details
        </Title>
      </div>

      <Flex vertical gap="large">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Connection" span={1}>
            <Tag color="blue">{query.connection || 'default'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Duration" span={1}>
            <DurationTag value={query.time} />{' '}
          </Descriptions.Item>
          <Descriptions.Item label="Time" span={2}>
            {formatDate(query.created_at)}
          </Descriptions.Item>
        </Descriptions>

        {query.query && (
          <Card title="Query" size="small" style={{ backgroundColor: token.colorBgContainer }}>
            {query.query}
          </Card>
        )}

        {query.bindings && query.bindings.length > 0 && (
          <Card title="Bindings" size="small" style={{ backgroundColor: token.colorBgContainer }}>
            <Descriptions bordered size="small" column={1}>
              {map(query.bindings, (binding, index: number) => (
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
export default QueryDetail;

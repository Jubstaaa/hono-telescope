import React from 'react';
import { useParams } from 'react-router';
import { Card, Typography, Alert, Descriptions, theme, Flex, Grid } from 'antd';
import { useGetLogQuery } from '../../api/telescopeApi';
import { formatDate } from '../../utils/helpers';
import { JsonViewer } from '../../components/JsonViewer';
import Loader from '../../components/Loader';
import LevelTag from '../../components/Tag/LevelTag';
const { Title } = Typography;
const { useBreakpoint } = Grid;

export const LogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { data: entry, isLoading, error } = useGetLogQuery(id!, { skip: !id });

  if (isLoading) {
    return <Loader />;
  }

  if (error || !entry) {
    return <Alert message="Error" description="Failed to load log details" type="error" showIcon />;
  }

  const descriptionsColumn = screens.md ? 2 : 1;

  return (
    <>
      <Title level={2} style={{ color: token.colorText }}>
        Log Details
      </Title>

      <Flex vertical gap="large">
        <Card className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          <Descriptions
            title="Basic Information"
            bordered={screens.xs ? false : true}
            column={descriptionsColumn}
          >
            <Descriptions.Item label="Level">
              <LevelTag level={entry.level} />
            </Descriptions.Item>
            <Descriptions.Item label="Time">{formatDate(entry.created_at)}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Message" className="mb-4" style={{ backgroundColor: token.colorBgContainer }}>
          {entry.message}
        </Card>

        {entry.context && Object.keys(entry.context).length > 0 && (
          <Card title="Context" style={{ backgroundColor: token.colorBgContainer }}>
            <JsonViewer data={entry.context} />
          </Card>
        )}
      </Flex>
    </>
  );
};

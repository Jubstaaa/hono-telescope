import { Link, useParams } from 'react-router';

import { Alert, Card, Descriptions, Flex, Grid, theme, Typography } from 'antd';

import type { ExceptionDetailResponse } from '@/types';

import { JsonViewer } from '../../components/JsonViewer';
import Loader from '../../components/Loader';
import ExceptionTag from '../../components/Tag/ExceptionTag';
import { useDetail } from '../../hooks/use-entries';
import { formatDate } from '../../utils/helpers';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

export const ExceptionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { data: entry, error, isLoading } = useDetail<ExceptionDetailResponse>('exceptions', id);

  if (isLoading) {
    return <Loader />;
  }

  if (error || !entry) {
    return (
      <Alert showIcon description="Failed to load exception details" message="Error" type="error" />
    );
  }

  const descriptionsColumn = screens.md ? 2 : 1;

  return (
    <>
      <Title level={2} style={{ color: token.colorText }}>
        Exception Details
      </Title>

      <Flex vertical gap="large">
        <Card style={{ backgroundColor: token.colorBgContainer }}>
          <Descriptions bordered={!screens.xs} column={descriptionsColumn}>
            <Descriptions.Item label="Exception">
              <ExceptionTag classNum={entry.class} />
            </Descriptions.Item>
            <Descriptions.Item label="Time">{formatDate(entry.created_at)}</Descriptions.Item>
            {entry.parent_id && (
              <Descriptions.Item label="Request" span={descriptionsColumn}>
                <Link to={`/incoming-requests/${entry.parent_id}`}>
                  Open the request that produced this exception
                </Link>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card style={{ backgroundColor: token.colorBgContainer }} title="Message">
          <Text>{entry.message}</Text>
        </Card>

        {entry.trace && entry.trace.length > 0 && (
          <Card style={{ backgroundColor: token.colorBgContainer }} title="Stack Trace">
            <Text
              style={{
                display: 'block',
                fontFamily: 'monospace',
                fontSize: 13,
                whiteSpace: 'pre-wrap',
              }}
            >
              {entry.trace}
            </Text>
          </Card>
        )}

        {entry.context && Object.keys(entry.context).length > 0 && (
          <Card style={{ backgroundColor: token.colorBgContainer }} title="Context">
            <JsonViewer data={entry.context} />
          </Card>
        )}
      </Flex>
    </>
  );
};

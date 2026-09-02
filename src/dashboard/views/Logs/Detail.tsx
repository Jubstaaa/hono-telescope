import { useParams } from 'react-router';

import { Alert, Card, Descriptions, Flex, Grid, theme, Typography } from 'antd';

import type { LogDetailResponse } from '@/types';

import { JsonViewer } from '../../components/JsonViewer';
import Loader from '../../components/Loader';
import LevelTag from '../../components/Tag/LevelTag';
import { useDetail } from '../../hooks/use-entries';
import { formatDate } from '../../utils/helpers';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export const LogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { data: entry, error, isLoading } = useDetail<LogDetailResponse>('logs', id);

  if (isLoading) {
    return <Loader />;
  }

  if (error || !entry) {
    return <Alert showIcon description="Failed to load log details" message="Error" type="error" />;
  }

  const descriptionsColumn = screens.md ? 2 : 1;

  return (
    <>
      <Title level={2} style={{ color: token.colorText }}>
        Log Details
      </Title>

      <Flex vertical gap="large">
        <Card style={{ backgroundColor: token.colorBgContainer }}>
          <Descriptions bordered={!screens.xs} column={descriptionsColumn}>
            <Descriptions.Item label="Level">
              <LevelTag level={entry.level} />
            </Descriptions.Item>
            <Descriptions.Item label="Time">{formatDate(entry.created_at)}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card style={{ backgroundColor: token.colorBgContainer }} title="Message">
          {entry.message}
        </Card>

        {entry.context && Object.keys(entry.context).length > 0 && (
          <Card style={{ backgroundColor: token.colorBgContainer }} title="Context">
            <JsonViewer data={entry.context} />
          </Card>
        )}
      </Flex>
    </>
  );
};

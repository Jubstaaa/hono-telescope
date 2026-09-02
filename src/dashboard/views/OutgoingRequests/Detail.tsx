import { useParams } from 'react-router';

import { Alert, Card, Descriptions, Flex, Grid, theme, Typography } from 'antd';

import type { OutgoingRequestDetailResponse } from '@/types';

import { JsonViewer } from '../../components/JsonViewer';
import Loader from '../../components/Loader';
import DurationTag from '../../components/Tag/DurationTag';
import MethodTag from '../../components/Tag/MethodTag';
import StatusTag from '../../components/Tag/StatusTag';
import { useDetail } from '../../hooks/use-entries';
import { formatDate } from '../../utils/helpers';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

export const OutgoingRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const {
    data: request,
    error,
    isLoading,
  } = useDetail<OutgoingRequestDetailResponse>('outgoing-requests', id);

  if (isLoading) {
    return <Loader />;
  }

  if (error || !request) {
    return (
      <Alert
        showIcon
        description="Failed to load outgoing request details"
        message="Error"
        type="error"
      />
    );
  }

  const descriptionsColumn = screens.md ? 2 : 1;

  return (
    <>
      <Title level={2} style={{ color: token.colorText }}>
        Outgoing Request Details
      </Title>

      <Flex vertical gap="large">
        <Card style={{ backgroundColor: token.colorBgContainer }}>
          <Descriptions bordered={!screens.xs} column={descriptionsColumn}>
            <Descriptions.Item label="Method" span={1}>
              <MethodTag method={request.method} />
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <StatusTag status={request.response_status} />
            </Descriptions.Item>
            <Descriptions.Item label="URL" span={2}>
              <Text code style={{ color: token.colorText }}>
                {request.uri}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Duration" span={1}>
              <DurationTag value={request.duration} />
            </Descriptions.Item>
            <Descriptions.Item label="Time" span={1}>
              {formatDate(request.created_at)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {request.headers && (
          <Card style={{ backgroundColor: token.colorBgContainer }} title="Headers">
            <JsonViewer data={request.headers} />
          </Card>
        )}

        {request.payload && (
          <Card style={{ backgroundColor: token.colorBgContainer }} title="Request Body">
            <JsonViewer data={request.payload} />
          </Card>
        )}

        {request.response && (
          <Card style={{ backgroundColor: token.colorBgContainer }} title="Response">
            <JsonViewer data={request.response} />
          </Card>
        )}
      </Flex>
    </>
  );
};

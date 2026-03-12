import { useParams } from 'react-router';
import { Card, Typography, Alert, Descriptions, theme, Flex, Grid } from 'antd';
import { useGetOutgoingRequestQuery } from '../../api/telescopeApi';
import { formatDate } from '../../utils/helpers';
import Loader from '../../components/Loader';
import { JsonViewer } from '../../components/JsonViewer';
import StatusTag from '../../components/Tag/StatusTag';
import MethodTag from '../../components/Tag/MethodTag';
import DurationTag from '../../components/Tag/DurationTag';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export const OutgoingRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const { data: request, isLoading, error } = useGetOutgoingRequestQuery(id!, { skip: !id });

  if (isLoading) {
    return <Loader />;
  }

  if (error || !request) {
    return (
      <Alert
        message="Error"
        description="Failed to load outgoing request details"
        type="error"
        showIcon
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
          <Card title="Headers" style={{ backgroundColor: token.colorBgContainer }}>
            <JsonViewer data={request.headers} />
          </Card>
        )}

        {request.payload && (
          <Card title="Request Body" style={{ backgroundColor: token.colorBgContainer }}>
            <JsonViewer data={request.payload} />
          </Card>
        )}

        {request.response && (
          <Card title="Response" style={{ backgroundColor: token.colorBgContainer }}>
            <JsonViewer data={request.response} />
          </Card>
        )}
      </Flex>
    </>
  );
};

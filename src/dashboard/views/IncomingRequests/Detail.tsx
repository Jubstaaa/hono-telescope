import { useParams } from 'react-router';

import { Alert, Card, Descriptions, Flex, Grid, Tabs, theme, Typography } from 'antd';

import type { IncomingRequestDetailResponse } from '@/types';

import { JsonViewer } from '../../components/JsonViewer';
import Loader from '../../components/Loader';
import ExceptionTable from '../../components/Table/ExceptionTable';
import LogTable from '../../components/Table/LogTable';
import OutgoingRequestTable from '../../components/Table/OutgoingRequestTable';
import QueryTable from '../../components/Table/QueryTable';
import DurationTag from '../../components/Tag/DurationTag';
import MethodTag from '../../components/Tag/MethodTag';
import StatusTag from '../../components/Tag/StatusTag';
import { useDetail } from '../../hooks/use-entries';
import { formatDate } from '../../utils/helpers';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

export const IncomingRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const {
    data: response,
    error,
    isLoading,
  } = useDetail<IncomingRequestDetailResponse>('incoming-requests', id);

  if (isLoading) {
    return <Loader />;
  }

  if (error || !response) {
    return (
      <Alert
        showIcon
        description="Failed to load incoming request details"
        message="Error"
        type="error"
      />
    );
  }

  const logs = response.relation_entries?.logs || [];
  const queries = response.relation_entries?.queries || [];
  const exceptions = response.relation_entries?.exceptions || [];
  const outgoingRequests = response.relation_entries?.outgoing_requests || [];
  const descriptionsColumn = screens.md ? 2 : 1;

  return (
    <>
      <Title level={2} style={{ color: token.colorText }}>
        Incoming Request Details
      </Title>

      <Flex vertical gap="large">
        <Card style={{ backgroundColor: token.colorBgContainer }}>
          <Descriptions bordered={!screens.xs} column={descriptionsColumn}>
            <Descriptions.Item label="Method" span={1}>
              <MethodTag method={response.method} />
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={1}>
              <StatusTag status={response.response_status} />
            </Descriptions.Item>
            <Descriptions.Item label="Path" span={2}>
              <Text code style={{ color: token.colorText }}>
                {response.uri || '/'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Duration" span={1}>
              <DurationTag value={response.duration} />
            </Descriptions.Item>
            <Descriptions.Item label="Time" span={1}>
              {formatDate(response.created_at || '')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {response.headers && (
          <Card size="small" style={{ backgroundColor: token.colorBgContainer }} title="Headers">
            <JsonViewer data={response.headers} />
          </Card>
        )}

        {response.payload && (
          <Card
            size="small"
            style={{ backgroundColor: token.colorBgContainer }}
            title="Request Body"
          >
            <JsonViewer data={response.payload} />
          </Card>
        )}

        {response.response && (
          <Card size="small" style={{ backgroundColor: token.colorBgContainer }} title="Response">
            <JsonViewer data={response.response} />
          </Card>
        )}

        <Card style={{ backgroundColor: token.colorBgContainer }}>
          <Tabs
            items={[
              {
                children: <LogTable entries={logs} />,
                key: 'logs',
                label: `Logs (${logs.length})`,
              },
              {
                children: <QueryTable entries={queries} />,
                key: 'queries',
                label: `Queries (${queries.length})`,
              },
              {
                children: <ExceptionTable entries={exceptions} />,
                key: 'exceptions',
                label: `Exceptions (${exceptions.length})`,
              },
              {
                children: <OutgoingRequestTable entries={outgoingRequests} />,
                key: 'outgoingRequests',
                label: `Outgoing Requests (${outgoingRequests.length})`,
              },
            ]}
          />
        </Card>
      </Flex>
    </>
  );
};

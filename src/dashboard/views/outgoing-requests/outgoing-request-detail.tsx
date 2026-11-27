import { Alert, Card, Descriptions, Flex, Grid, theme, Typography } from 'antd'
import { useParams } from 'react-router'

import type { OutgoingRequestDetailResponse } from '@/core/hono/dashboard-api'

import DurationTag from '../../components/duration-tag/duration-tag'
import { JsonViewer } from '../../components/json-viewer/json-viewer'
import Loader from '../../components/loader/loader'
import MethodTag from '../../components/method-tag/method-tag'
import StatusTag from '../../components/status-tag/status-tag'
import { formatDate } from '../../format'
import { useDetail } from '../../hooks/use-entries'

const { Text, Title } = Typography
const { useBreakpoint } = Grid

export const OutgoingRequestDetail = () => {
    const { id } = useParams<{ id: string }>()
    const { token } = theme.useToken()
    const screens = useBreakpoint()
    const {
        data: request,
        error,
        isLoading,
    } = useDetail<OutgoingRequestDetailResponse>('outgoing-requests', id)

    if (isLoading) {
        return <Loader />
    }

    if (error || !request) {
        return (
            <Alert
                description="Failed to load outgoing request details"
                showIcon
                title="Error"
                type="error"
            />
        )
    }

    const descriptionsColumn = screens.md ? 2 : 1

    return (
        <>
            <Title level={2} style={{ color: token.colorText }}>
                Outgoing Request Details
            </Title>

            <Flex gap="large" vertical>
                <Card style={{ backgroundColor: token.colorBgContainer }}>
                    <Descriptions
                        bordered={!screens.xs}
                        column={descriptionsColumn}>
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

                {Object.keys(request.headers).length > 0 && (
                    <Card
                        style={{ backgroundColor: token.colorBgContainer }}
                        title="Headers">
                        <JsonViewer data={request.headers} />
                    </Card>
                )}

                {Object.keys(request.payload).length > 0 && (
                    <Card
                        style={{ backgroundColor: token.colorBgContainer }}
                        title="Request Body">
                        <JsonViewer data={request.payload} />
                    </Card>
                )}

                {Object.keys(request.response).length > 0 && (
                    <Card
                        style={{ backgroundColor: token.colorBgContainer }}
                        title="Response">
                        <JsonViewer data={request.response} />
                    </Card>
                )}
            </Flex>
        </>
    )
}

import { Tag } from 'antd';

import { getStatusColor } from '../../utils/format';

function StatusTag({ status }: { status: number }) {
  return <Tag color={getStatusColor(status)}>{status}</Tag>;
}

export default StatusTag;

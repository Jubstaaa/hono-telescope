import { Tag } from 'antd';
import { getStatusColor } from '../../utils/helpers';

function StatusTag({ status }: { status: number }) {
  return <Tag color={getStatusColor(status)}>{status}</Tag>;
}

export default StatusTag;

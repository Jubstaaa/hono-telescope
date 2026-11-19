import { Tag } from 'antd';

import { formatDuration, getDurationColor } from '../../format';

interface DurationTagProps {
  slowAt?: number;
  value: number;
  warnAt?: number;
}

function DurationTag({ slowAt = 1000, value, warnAt = 300 }: DurationTagProps) {
  return <Tag color={getDurationColor(value, warnAt, slowAt)}>{formatDuration(value)}</Tag>;
}

export default DurationTag;

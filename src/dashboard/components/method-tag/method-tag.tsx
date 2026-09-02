import { Tag } from 'antd';

import { getMethodColor } from '../../utils/format';

function MethodTag({ method }: { method: string }) {
  return <Tag color={getMethodColor(method)}>{method}</Tag>;
}

export default MethodTag;

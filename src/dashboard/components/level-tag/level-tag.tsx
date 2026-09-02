import { Tag } from 'antd';

import { getLevelColor, getLevelName } from '../../utils/format';

function LevelTag({ level }: { level: number }) {
  return <Tag color={getLevelColor(level)}>{getLevelName(level)}</Tag>;
}

export default LevelTag;

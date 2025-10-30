import { Tag } from 'antd';
import { getLevelColor, getLevelName } from '../../utils/helpers';

function LevelTag({ level }: { level: number }) {
  return <Tag color={getLevelColor(level)}>{getLevelName(level)}</Tag>;
}

export default LevelTag;

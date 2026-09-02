import { Tag } from 'antd';

import { formatDuration } from '../../utils/format';

import type { DurationTagProps } from './duration-tag.types.js';

// A single red threshold made 120ms look as alarming as 2s, so red stopped meaning anything.
// Queries live on a different scale than requests, hence the overridable bounds.
function DurationTag({ slowAt = 1000, value, warnAt = 300 }: DurationTagProps) {
  const color = value >= slowAt ? 'red' : value >= warnAt ? 'orange' : 'green';

  return <Tag color={color}>{formatDuration(value)}</Tag>;
}

export default DurationTag;

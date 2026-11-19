import { Tag } from 'antd';

import { getExceptionClassName, TAG_COLORS } from '../../format';

function ExceptionTag({ classNum }: { classNum: number }) {
  return <Tag color={TAG_COLORS.error}>{getExceptionClassName(classNum)}</Tag>;
}

export default ExceptionTag;

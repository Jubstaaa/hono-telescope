import { Tag } from 'antd'
import { formatDuration } from '../../utils/helpers'

function DurationTag({ value }: { value: number }   ) {
  return (
    <Tag color={value > 100 ? 'red' : 'green'}>
    {formatDuration(value)}
  </Tag>
  )
}

export default DurationTag
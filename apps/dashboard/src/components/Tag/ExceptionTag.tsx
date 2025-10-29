        import { Tag } from 'antd'
import { getExceptionClassName } from '../../utils/helpers'
        
        function ExceptionTag({ classNum }: { classNum: number }    ) {
          return (
                <Tag color="red">
            {getExceptionClassName(classNum)}
          </Tag>
          )
        }
        
        export default ExceptionTag
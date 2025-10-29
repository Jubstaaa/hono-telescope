import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import prettyMs from 'pretty-ms'

dayjs.extend(localizedFormat)


export const getStatusColor = (status?: number): string => {
  if (!status) return 'default'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400) return 'error'
  if (status >= 300) return 'warning'
  return 'default'
}


export const getMethodColor = (method: string): string => {
  const colors: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple'
  }
  return colors[method] || 'default'
}

export const getLevelColor = (level: number): string => {
  const colors: Record<number, string> = {
    0: 'gray',    
    1: 'blue',    
    2: 'cyan',    
    3: 'orange',  
    4: 'red',     
    5: 'red',     
    6: 'red',     
    7: 'red'      
  }
  return colors[level] || 'default'
}

export const formatDuration = (duration: number): string => {
  return prettyMs(duration)
}

export const formatDate = (createdAt: string): string => {
  return dayjs(createdAt).format('YYYY-MM-DD HH:mm')
}

export const getLevelName = (level: number): string => {
  const levels: Record<number, string> = {
    0: 'DEBUG',
    1: 'INFO',
    2: 'NOTICE',
    3: 'WARNING',
    4: 'ERROR',
    5: 'CRITICAL',
    6: 'ALERT',
    7: 'EMERGENCY'
  }
  return levels[level] || 'UNKNOWN'
}

export const getExceptionClassName = (classNum: number): string => {
  const classes: Record<number, string> = {
    0: 'Error',
    1: 'Exception',
    2: 'RuntimeError',
    3: 'TypeError',
    4: 'SyntaxError',
    5: 'ReferenceError',
    6: 'RangeError',
    7: 'ValidationError',
    8: 'NotFound',
    9: 'Unauthorized',
    10: 'Forbidden',
    11: 'BadRequest',
    12: 'InternalServerError'
  }
  return classes[classNum] || 'Unknown'
}
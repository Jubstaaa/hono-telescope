import dayjs from 'dayjs'
import prettyMs from 'pretty-ms'

import { LogLevel } from '@/core/entries'

export const TAG_COLORS = {
    blue: '#0958d9',
    cyan: '#006d75',
    error: '#a8071a',
    purple: '#531dab',
    success: '#237804',
    warning: '#ad4e00',
} as const

export const getStatusColor = (status?: number): string => {
    if (!status) return 'default'
    if (status >= 200 && status < 300) return TAG_COLORS.success
    if (status >= 400) return TAG_COLORS.error
    if (status >= 300) return TAG_COLORS.warning
    return 'default'
}

const METHOD_COLORS: Record<string, string> = {
    DELETE: TAG_COLORS.error,
    GET: TAG_COLORS.blue,
    PATCH: TAG_COLORS.purple,
    POST: TAG_COLORS.success,
    PUT: TAG_COLORS.warning,
}

export const getMethodColor = (method: string): string =>
    METHOD_COLORS[method] ?? 'default'

const LEVEL_COLORS: Record<number, string> = {
    1: TAG_COLORS.blue,
    2: TAG_COLORS.cyan,
    3: TAG_COLORS.warning,
}

export const getLevelColor = (level: number): string =>
    LEVEL_COLORS[level] ?? (level >= 4 ? TAG_COLORS.error : 'default')

export const getDurationColor = (
    value: number,
    warnAt = 300,
    slowAt = 1000
): string =>
    value >= slowAt
        ? TAG_COLORS.error
        : value >= warnAt
          ? TAG_COLORS.warning
          : TAG_COLORS.success

export const formatDuration = (duration: number): string => {
    return prettyMs(duration)
}

export const formatDate = (createdAt: string): string => {
    return dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')
}

export const getLevelName = (level: number): string =>
    LogLevel[level] ?? 'UNKNOWN'

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
        12: 'InternalServerError',
    }
    return classes[classNum] || 'Unknown'
}

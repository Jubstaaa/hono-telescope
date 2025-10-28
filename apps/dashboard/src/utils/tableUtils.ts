import React from 'react'
import { 
  GlobalOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CodeOutlined
} from '@ant-design/icons'

export const getEntryIcon = (type: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    request: React.createElement(GlobalOutlined),
    exception: React.createElement(ExclamationCircleOutlined),
    query: React.createElement(DatabaseOutlined),
    log: React.createElement(FileTextOutlined),
    job: React.createElement(ThunderboltOutlined),
    mail: React.createElement(LinkOutlined),
    notification: React.createElement(WarningOutlined),
    cache: React.createElement(CheckCircleOutlined),
    dump: React.createElement(CodeOutlined),
    view: React.createElement(FileTextOutlined)
  }
  return icons[type] || React.createElement(FileTextOutlined)
}

export const getEntryTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    request: 'blue',
    exception: 'red',
    query: 'green',
    log: 'orange',
    job: 'purple',
    mail: 'cyan',
    notification: 'magenta',
    cache: 'lime',
    dump: 'gold',
    view: 'geekblue'
  }
  return colors[type] || 'default'
}

export const getStatusColor = (status?: number): string => {
  if (!status) return 'default'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400) return 'error'
  if (status >= 300) return 'warning'
  return 'default'
}

export const formatDuration = (duration?: number): string => {
  if (!duration) return '-'
  if (duration < 1000) return `${duration}ms`
  return `${(duration / 1000).toFixed(2)}s`
}

export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString()
}
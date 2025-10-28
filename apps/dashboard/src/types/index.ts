export interface TelescopeEntry {
  id: string
  type: 'request' | 'query' | 'exception' | 'log' | 'job' | 'schedule' | 'mail' | 'notification' | 'cache' | 'redis' | 'dump' | 'view'
  timestamp: number
  content: any
  family_hash?: string
  tags?: string[]
}

export interface TelescopeStats {
  total_entries: number
  requests: {
    total: number
    avg_duration: number
  }
  exceptions: {
    total: number
  }
}

export type TabType = 
  | 'dashboard' 
  | 'requests' 
  | 'incoming-requests'
  | 'outgoing-requests'
  | 'queries' 
  | 'exceptions' 
  | 'logs'
  | 'jobs'
  | 'schedule'
  | 'mail'
  | 'notifications'
  | 'cache'
  | 'redis'
  | 'dumps'
  | 'views'
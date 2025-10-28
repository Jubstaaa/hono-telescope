import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface TelescopeEntry {
  id: string
  type: 'request' | 'query' | 'exception' | 'log' | 'job' | 'schedule' | 'mail' | 'notification' | 'cache' | 'redis' | 'dump' | 'view'
  timestamp: number
  content: any
  created_at?: string
  parent_id?: string
  family_hash?: string
  tags?: string[]
}

export interface IncomingRequestWithChildren {
  request: TelescopeEntry
  children: TelescopeEntry[]
}

export interface DashboardStats {
  total_requests: number
  total_exceptions: number
  total_queries: number
  total_logs: number
  average_response_time: number
  requests_by_status: Record<string, number>
  requests_by_method: Record<string, number>
}

export interface ApiResponse<T> {
  entries?: T[]
  data?: T
  success?: boolean
}

export const telescopeApi = createApi({
  reducerPath: 'telescopeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/telescope/api/',
  }),
  tagTypes: ['Entry', 'Stats', 'IncomingRequest', 'OutgoingRequest', 'Exception', 'Query', 'Log', 'Job', 'Cache', 'Mail', 'Notification', 'Dump'],
  endpoints: (builder) => ({
    // Dashboard stats
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => 'stats',
      providesTags: ['Stats'],
    }),

    // Clear all entries
    clearEntries: builder.mutation<void, void>({
      query: () => ({
        url: 'clear',
        method: 'POST',
      }),
      invalidatesTags: ['Entry', 'Stats', 'IncomingRequest', 'OutgoingRequest', 'Exception', 'Query', 'Log', 'Job', 'Cache', 'Mail', 'Notification', 'Dump'],
    }),

    // === INCOMING REQUESTS ===
    getIncomingRequests: builder.query<TelescopeEntry[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => 
        `incoming-requests?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (Array.isArray(response)) {
          return response
        }
        return response.entries || []
      },
      providesTags: (result) => [
        'IncomingRequest',
        ...((result || []).map(({ id }) => ({ type: 'IncomingRequest' as const, id })))
      ],
    }),

    getIncomingRequest: builder.query<IncomingRequestWithChildren, string>({
      query: (id) => `incoming-requests/${id}`,
      transformResponse: (response: any) => {
        // The API returns { request, children } structure
        return response as IncomingRequestWithChildren
      },
      providesTags: (_result, _error, id) => [{ type: 'IncomingRequest', id }],
    }),

    // === OUTGOING REQUESTS ===
    getOutgoingRequests: builder.query<TelescopeEntry[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => 
        `outgoing-requests?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (Array.isArray(response)) {
          return response
        }
        return response.entries || []
      },
      providesTags: (result) => [
        'OutgoingRequest',
        ...((result || []).map(({ id }) => ({ type: 'OutgoingRequest' as const, id })))
      ],
    }),

    getOutgoingRequest: builder.query<TelescopeEntry, string>({
      query: (id) => `outgoing-requests/${id}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (response.data) {
          return response.data
        }
        return response as TelescopeEntry
      },
      providesTags: (_result, _error, id) => [{ type: 'OutgoingRequest', id }],
    }),

    // === EXCEPTIONS ===
    getExceptions: builder.query<TelescopeEntry[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => 
        `exceptions?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (Array.isArray(response)) {
          return response
        }
        return response.entries || []
      },
      providesTags: (result) => [
        'Exception',
        ...((result || []).map(({ id }) => ({ type: 'Exception' as const, id })))
      ],
    }),

    getException: builder.query<TelescopeEntry, string>({
      query: (id) => `exceptions/${id}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (response.data) {
          return response.data
        }
        return response as TelescopeEntry
      },
      providesTags: (_result, _error, id) => [{ type: 'Exception', id }],
    }),

    // === QUERIES ===
    getQueries: builder.query<TelescopeEntry[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => 
        `queries?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (Array.isArray(response)) {
          return response
        }
        return response.entries || []
      },
      providesTags: (result) => [
        'Query',
        ...((result || []).map(({ id }) => ({ type: 'Query' as const, id })))
      ],
    }),

    getQuery: builder.query<TelescopeEntry, string>({
      query: (id) => `queries/${id}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (response.data) {
          return response.data
        }
        return response as TelescopeEntry
      },
      providesTags: (_result, _error, id) => [{ type: 'Query', id }],
    }),

    // === LOGS ===
    getLogs: builder.query<TelescopeEntry[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => 
        `logs?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (Array.isArray(response)) {
          return response
        }
        return response.entries || []
      },
      providesTags: (result) => [
        'Log',
        ...((result || []).map(({ id }) => ({ type: 'Log' as const, id })))
      ],
    }),

    getLog: builder.query<TelescopeEntry, string>({
      query: (id) => `logs/${id}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (response.data) {
          return response.data
        }
        return response as TelescopeEntry
      },
      providesTags: (_result, _error, id) => [{ type: 'Log', id }],
    }),

    // === JOBS ===
    getJobs: builder.query<TelescopeEntry[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => 
        `jobs?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (Array.isArray(response)) {
          return response
        }
        return response.entries || []
      },
      providesTags: (result) => [
        'Job',
        ...((result || []).map(({ id }) => ({ type: 'Job' as const, id })))
      ],
    }),

    getJob: builder.query<TelescopeEntry, string>({
      query: (id) => `jobs/${id}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (response.data) {
          return response.data
        }
        return response as TelescopeEntry
      },
      providesTags: (_result, _error, id) => [{ type: 'Job', id }],
    }),

    // === CACHE ===
    getCacheEntries: builder.query<TelescopeEntry[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => 
        `cache?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (Array.isArray(response)) {
          return response
        }
        return response.entries || []
      },
      providesTags: (result) => [
        'Cache',
        ...((result || []).map(({ id }) => ({ type: 'Cache' as const, id })))
      ],
    }),

    getCacheEntry: builder.query<TelescopeEntry, string>({
      query: (id) => `cache/${id}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (response.data) {
          return response.data
        }
        return response as TelescopeEntry
      },
      providesTags: (_result, _error, id) => [{ type: 'Cache', id }],
    }),

    // === MAIL ===
    getMailEntries: builder.query<TelescopeEntry[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => 
        `mail?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (Array.isArray(response)) {
          return response
        }
        return response.entries || []
      },
      providesTags: (result) => [
        'Mail',
        ...((result || []).map(({ id }) => ({ type: 'Mail' as const, id })))
      ],
    }),

    getMailEntry: builder.query<TelescopeEntry, string>({
      query: (id) => `mail/${id}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (response.data) {
          return response.data
        }
        return response as TelescopeEntry
      },
      providesTags: (_result, _error, id) => [{ type: 'Mail', id }],
    }),

    // === NOTIFICATIONS ===
    getNotifications: builder.query<TelescopeEntry[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => 
        `notifications?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (Array.isArray(response)) {
          return response
        }
        return response.entries || []
      },
      providesTags: (result) => [
        'Notification',
        ...((result || []).map(({ id }) => ({ type: 'Notification' as const, id })))
      ],
    }),

    getNotification: builder.query<TelescopeEntry, string>({
      query: (id) => `notifications/${id}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (response.data) {
          return response.data
        }
        return response as TelescopeEntry
      },
      providesTags: (_result, _error, id) => [{ type: 'Notification', id }],
    }),

    // === DUMPS ===
    getDumps: builder.query<TelescopeEntry[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 50 } = {}) => 
        `dumps?page=${page}&limit=${limit}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (Array.isArray(response)) {
          return response
        }
        return response.entries || []
      },
      providesTags: (result) => [
        'Dump',
        ...((result || []).map(({ id }) => ({ type: 'Dump' as const, id })))
      ],
    }),

    getDump: builder.query<TelescopeEntry, string>({
      query: (id) => `dumps/${id}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (response.data) {
          return response.data
        }
        return response as TelescopeEntry
      },
      providesTags: (_result, _error, id) => [{ type: 'Dump', id }],
    }),
  }),
})

export const {
  useGetDashboardStatsQuery,
  useClearEntriesMutation,
  useGetIncomingRequestsQuery,
  useGetIncomingRequestQuery,
  useGetOutgoingRequestsQuery,
  useGetOutgoingRequestQuery,
  useGetExceptionsQuery,
  useGetExceptionQuery,
  useGetQueriesQuery,
  useGetQueryQuery,
  useGetLogsQuery,
  useGetLogQuery,
  useGetJobsQuery,
  useGetJobQuery,
  useGetCacheEntriesQuery,
  useGetCacheEntryQuery,
  useGetMailEntriesQuery,
  useGetMailEntryQuery,
  useGetNotificationsQuery,
  useGetNotificationQuery,
  useGetDumpsQuery,
  useGetDumpQuery,
} = telescopeApi
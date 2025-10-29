import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { TelescopeEntry } from '@hono-telescope/types'

export type { TelescopeEntry }

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
  tagTypes: ['Entry', 'Stats', 'IncomingRequest', 'OutgoingRequest', 'Exception', 'Query', 'Log'],
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
      invalidatesTags: ['Entry', 'Stats', 'IncomingRequest', 'OutgoingRequest', 'Exception', 'Query', 'Log'],
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

    getIncomingRequest: builder.query<TelescopeEntry, string>({
      query: (id) => `incoming-requests/${id}`,
      transformResponse: (response: ApiResponse<TelescopeEntry>) => {
        if (response.data) {
          return response.data
        }
        return response as TelescopeEntry
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
} = telescopeApi
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  DashboardStats,
  IncomingRequestDetailResponse,
  IncomingRequestResponse,
  OutgoingRequestResponse,
  OutgoingRequestDetailResponse,
  ExceptionResponse,
  ExceptionDetailResponse,
  QueryResponse,
  QueryDetailResponse,
  LogResponse,
  LogDetailResponse,
} from '@/types';

export const telescopeApi = createApi({
  reducerPath: 'telescopeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/telescope/api/',
  }),
  tagTypes: ['Stats', 'IncomingRequests', 'OutgoingRequests', 'Exceptions', 'Queries', 'Logs'],

  // 🔧 Tüm queries için varsayılan davranışlar
  refetchOnFocus: true,
  refetchOnMountOrArgChange: true,
  refetchOnReconnect: true,

  endpoints: (builder) => ({
    getStats: builder.query<DashboardStats, void>({
      query: () => 'stats',
      providesTags: ['Stats'],
    }),

    getIncomingRequests: builder.query<IncomingRequestResponse[], void>({
      query: () => 'incoming-requests',
      providesTags: ['IncomingRequests'],
    }),

    getIncomingRequest: builder.query<IncomingRequestDetailResponse, string>({
      query: (id) => `incoming-requests/${id}`,
      providesTags: ['IncomingRequests'],
    }),

    getOutgoingRequests: builder.query<OutgoingRequestResponse[], void>({
      query: () => 'outgoing-requests',
      providesTags: ['OutgoingRequests'],
    }),

    getOutgoingRequest: builder.query<OutgoingRequestDetailResponse, string>({
      query: (id) => `outgoing-requests/${id}`,
      providesTags: ['OutgoingRequests'],
    }),

    getExceptions: builder.query<ExceptionResponse[], void>({
      query: () => 'exceptions',
      providesTags: ['Exceptions'],
    }),

    getException: builder.query<ExceptionDetailResponse, string>({
      query: (id) => `exceptions/${id}`,
      providesTags: ['Exceptions'],
    }),

    getQueries: builder.query<QueryResponse[], void>({
      query: () => 'queries',
      providesTags: ['Queries'],
    }),

    getQuery: builder.query<QueryDetailResponse, string>({
      query: (id) => `queries/${id}`,
      providesTags: ['Queries'],
    }),

    getLogs: builder.query<LogResponse[], void>({
      query: () => 'logs',
      providesTags: ['Logs'],
    }),

    getLog: builder.query<LogDetailResponse, string>({
      query: (id) => `logs/${id}`,
      providesTags: ['Logs'],
    }),

    clearData: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: 'clear',
        method: 'POST',
      }),
      invalidatesTags: [
        'Stats',
        'IncomingRequests',
        'OutgoingRequests',
        'Exceptions',
        'Queries',
        'Logs',
      ],
    }),
  }),
});

export const {
  useGetStatsQuery,
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
  useClearDataMutation,
} = telescopeApi;

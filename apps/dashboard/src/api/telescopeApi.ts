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
} from '@hono-telescope/types';

export const telescopeApi = createApi({
  reducerPath: 'telescopeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/telescope/api/',
  }),

  // 🔧 Tüm queries için varsayılan davranışlar
  refetchOnFocus: true,
  refetchOnMountOrArgChange: true,
  refetchOnReconnect: true,

  endpoints: (builder) => ({
    getStats: builder.query<DashboardStats, void>({
      query: () => 'stats',
    }),

    getIncomingRequests: builder.query<IncomingRequestResponse[], void>({
      query: () => 'incoming-requests',
    }),

    getIncomingRequest: builder.query<IncomingRequestDetailResponse, string>({
      query: (id) => `incoming-requests/${id}`,
    }),

    getOutgoingRequests: builder.query<OutgoingRequestResponse[], void>({
      query: () => 'outgoing-requests',
    }),

    getOutgoingRequest: builder.query<OutgoingRequestDetailResponse, string>({
      query: (id) => `outgoing-requests/${id}`,
    }),

    getExceptions: builder.query<ExceptionResponse[], void>({
      query: () => 'exceptions',
    }),

    getException: builder.query<ExceptionDetailResponse, string>({
      query: (id) => `exceptions/${id}`,
    }),

    getQueries: builder.query<QueryResponse[], void>({
      query: () => 'queries',
    }),

    getQuery: builder.query<QueryDetailResponse, string>({
      query: (id) => `queries/${id}`,
    }),

    getLogs: builder.query<LogResponse[], void>({
      query: () => 'logs',
    }),

    getLog: builder.query<LogDetailResponse, string>({
      query: (id) => `logs/${id}`,
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
} = telescopeApi;

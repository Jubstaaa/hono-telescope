import React from 'react'
import { RouteObject, createBrowserRouter } from 'react-router-dom'
import { Dashboard } from './views/Dashboard/Dashboard'
import { IncomingRequestList } from './views/IncomingRequests/List'
import { OutgoingRequestList } from './views/OutgoingRequests/List'
import { QueryList } from './views/Queries/List'
import { ExceptionList } from './views/Exceptions/List'
import { LogList } from './views/Logs/List'
import { IncomingRequestDetail } from './views/IncomingRequests/Detail'
import { OutgoingRequestDetail } from './views/OutgoingRequests/Detail'
import { QueryDetail } from './views/Queries/Detail'
import { ExceptionDetail } from './views/Exceptions/Detail'
import { LogDetail } from './views/Logs/Detail'
import { MainLayout } from './layouts/MainLayout'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'incoming-requests',
        element: <IncomingRequestList />
      },
      {
        path: 'incoming-requests/:id',
        element: <IncomingRequestDetail />
      },
      {
        path: 'outgoing-requests',
        element: <OutgoingRequestList />
      },
      {
        path: 'outgoing-requests/:id',
        element: <OutgoingRequestDetail />
      },
      {
        path: 'queries',
        element: <QueryList />
      },
      {
        path: 'queries/:id',
        element: <QueryDetail />
      },
      {
        path: 'exceptions',
        element: <ExceptionList />
      },
      {
        path: 'exceptions/:id',
        element: <ExceptionDetail />
      },
      {
        path: 'logs',
        element: <LogList />
      },
      {
        path: 'logs/:id',
        element: <LogDetail />
      }
    ]
  }
]

export const router = createBrowserRouter(routes, {
  basename: '/telescope'
})

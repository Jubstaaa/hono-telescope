import type { RouteObject } from 'react-router';
import { createBrowserRouter } from 'react-router';

import { DASHBOARD_BASE } from './config';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './views/Dashboard/Dashboard';
import { ExceptionDetail } from './views/Exceptions/Detail';
import { ExceptionList } from './views/Exceptions/List';
import { IncomingRequestDetail } from './views/IncomingRequests/Detail';
import { IncomingRequestList } from './views/IncomingRequests/List';
import { LogDetail } from './views/Logs/Detail';
import { LogList } from './views/Logs/List';
import { OutgoingRequestDetail } from './views/OutgoingRequests/Detail';
import { OutgoingRequestList } from './views/OutgoingRequests/List';
import { QueryDetail } from './views/Queries/Detail';
import { QueryList } from './views/Queries/List';

const routes: RouteObject[] = [
  {
    children: [
      {
        element: <Dashboard />,
        index: true,
      },
      {
        element: <IncomingRequestList />,
        path: 'incoming-requests',
      },
      {
        element: <IncomingRequestDetail />,
        path: 'incoming-requests/:id',
      },
      {
        element: <OutgoingRequestList />,
        path: 'outgoing-requests',
      },
      {
        element: <OutgoingRequestDetail />,
        path: 'outgoing-requests/:id',
      },
      {
        element: <QueryList />,
        path: 'queries',
      },
      {
        element: <QueryDetail />,
        path: 'queries/:id',
      },
      {
        element: <ExceptionList />,
        path: 'exceptions',
      },
      {
        element: <ExceptionDetail />,
        path: 'exceptions/:id',
      },
      {
        element: <LogList />,
        path: 'logs',
      },
      {
        element: <LogDetail />,
        path: 'logs/:id',
      },
    ],
    element: <MainLayout />,
    path: '/',
  },
];

export const router = createBrowserRouter(routes, {
  basename: DASHBOARD_BASE(),
});

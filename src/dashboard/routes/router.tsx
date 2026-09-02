import type { RouteObject } from 'react-router';
import { createBrowserRouter } from 'react-router';

import { DASHBOARD_BASE } from '../constants/dashboard';
import { MainLayout } from '../layout/layout';
import { Dashboard } from '../views/dashboard/dashboard';
import { ExceptionDetail } from '../views/exceptions/exception-detail';
import { ExceptionList } from '../views/exceptions/exceptions';
import { IncomingRequestDetail } from '../views/incoming-requests/incoming-request-detail';
import { IncomingRequestList } from '../views/incoming-requests/incoming-requests';
import { LogDetail } from '../views/logs/log-detail';
import { LogList } from '../views/logs/logs';
import { OutgoingRequestDetail } from '../views/outgoing-requests/outgoing-request-detail';
import { OutgoingRequestList } from '../views/outgoing-requests/outgoing-requests';
import { QueryList } from '../views/queries/queries';
import { QueryDetail } from '../views/queries/query-detail';

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

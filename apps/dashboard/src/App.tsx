import { BrowserRouter as Router, Routes, Route   } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { MainLayout } from './layouts/MainLayout'
import { DashboardView } from './views/dashboard/DashboardView'
import { IncomingRequestListView } from './views/incoming-requests/IncomingRequestListView'
import { OutgoingRequestListView } from './views/outgoing-requests/OutgoingRequestListView'

import { QueryListView } from './views/queries/QueryListView'
import { ExceptionListView } from './views/exceptions/ExceptionListView'
import { LogListView } from './views/logs/LogListView'
import { IncomingRequestDetailView } from './views/incoming-requests/IncomingRequestDetailView'
import { OutgoingRequestDetailView } from './views/outgoing-requests/OutgoingRequestDetailView'
import { QueryDetailView } from './views/queries/QueryDetailView'
import { ExceptionDetailView } from './views/exceptions/ExceptionDetailView'
import { LogDetailView } from './views/logs/LogDetailView'

function App() {
  return (
    <ThemeProvider>
      <Router basename="/telescope">
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardView />} />
              <Route path="incoming-requests" element={<IncomingRequestListView />} />
              <Route path="incoming-requests/:id" element={<IncomingRequestDetailView />} />
            <Route path="outgoing-requests" element={<OutgoingRequestListView />} />
            <Route path="outgoing-requests/:id" element={<OutgoingRequestDetailView />} />
            <Route path="queries" element={<QueryListView />} />
              <Route path="queries/:id" element={<QueryDetailView />} />
            <Route path="exceptions" element={<ExceptionListView />} />
              <Route path="exceptions/:id" element={<ExceptionDetailView />} />
            <Route path="logs" element={<LogListView />} />
              <Route path="logs/:id" element={<LogDetailView />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
import { StrictMode } from 'react';

import { RouterProvider } from 'react-router';

import { router } from './routes/router';
import { ThemeProvider } from './theme-context';

function App() {
  return (
    <StrictMode>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>
  );
}

export default App;

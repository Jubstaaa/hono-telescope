import { StrictMode } from 'react';

import { RouterProvider } from 'react-router';

import { ThemeProvider } from './context/theme.context';
import { router } from './routes/router';

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

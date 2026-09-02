import { StrictMode } from 'react';

import { RouterProvider } from 'react-router';

import { ThemeProvider } from './contexts/ThemeContext';
import { router } from './router';

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

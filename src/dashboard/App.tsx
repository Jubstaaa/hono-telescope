import { StrictMode } from 'react';
import { RouterProvider } from 'react-router';
import { Provider } from 'react-redux';
import { ThemeProvider } from './contexts/ThemeContext';
import { router } from './router';
import { store } from './store';

function App() {
  return (
    <StrictMode>
      <Provider store={store}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </Provider>
    </StrictMode>
  );
}

export default App;

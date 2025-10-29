import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { router } from './router'
import { store } from './store'
import { Provider } from 'react-redux'
import { StrictMode } from 'react'

function App() {
  return (
    <StrictMode>
    <Provider store={store}>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
    </Provider>
    </StrictMode>
  )
}

export default App
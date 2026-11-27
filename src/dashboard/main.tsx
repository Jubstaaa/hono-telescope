import { createRoot } from 'react-dom/client'

import './index.css'
import App from './app'

const root = document.getElementById('root')
if (!root) throw new Error('No #root element')

createRoot(root).render(<App />)

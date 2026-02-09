import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </AppProvider>

)

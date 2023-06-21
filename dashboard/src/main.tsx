import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { FrappeProvider } from 'frappe-react-sdk'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import Index from './pages/Index.tsx'
import Auth from './pages/Auth.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "lobby",
        element: <Index />,
      },
    ],
  },
  {
    path: "/login",
    element: <Auth />,
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <FrappeProvider>
      <RouterProvider router={router} />
    </FrappeProvider>
  </React.StrictMode>,
)

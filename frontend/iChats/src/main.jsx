import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import Forgot from './components/Forgot.jsx'
import TwoFAVerificationPage from './components/TwoFAVerificationPage.jsx'


const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />
  },

  {
    path: "/Register",
    element: <Register />
  },

  {
    path: "/Forgot",
    element: <Forgot />
  },
  {
    path:"/Home",
    element:<App />
  },
  {
    path:"/2fa-verify",
    element:<TwoFAVerificationPage />
  }
])

createRoot(document.getElementById('root')).render(
<StrictMode>
    <RouterProvider router={router} />
</StrictMode>,
)

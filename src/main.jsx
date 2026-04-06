import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './lib/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="bottom-right" toastOptions={{
          style: { borderRadius: '12px', fontFamily: 'Inter', fontSize: '14px' },
          success: { iconTheme: { primary: '#0D5C4A', secondary: '#fff' } },
        }}/>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './themes/ThemeContext'
import { EffectsProvider } from './components/EffectsContext'
import './style.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <EffectsProvider>
        <App />
      </EffectsProvider>
    </ThemeProvider>
  </React.StrictMode>
)
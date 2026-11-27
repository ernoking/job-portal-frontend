import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import App from './App.jsx'
import { captureRecovery } from './auth/passwordRecovery.js'
import { startApiTraffic } from './monitoring/browserTraffic.js'

const recovery = captureRecovery(window.location, window.history);
startApiTraffic();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App recovery={recovery} />
    </BrowserRouter>
  </StrictMode>,
)

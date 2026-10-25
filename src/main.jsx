import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

// Self-hosted fonts: bundled with the app, so no third-party font requests.
import '@fontsource-variable/fraunces'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/dm-sans'

import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/layout.css'
import App from './App.jsx'
import { PersonalProvider } from './context/PersonalProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PersonalProvider>
        <App />
      </PersonalProvider>
    </BrowserRouter>
  </StrictMode>,
)

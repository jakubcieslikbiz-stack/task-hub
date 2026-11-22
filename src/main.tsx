import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { PrivacyProvider } from './context/PrivacyContext.tsx'
import { PomodoroProvider } from './context/PomodoroContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackMessage="Wystąpił nieoczekiwany błąd w aplikacji">
      <PrivacyProvider>
        <PomodoroProvider>
          <App />
        </PomodoroProvider>
      </PrivacyProvider>
    </ErrorBoundary>
  </StrictMode>,
)

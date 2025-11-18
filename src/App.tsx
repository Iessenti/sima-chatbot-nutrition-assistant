import { ChatInterface } from './components/ChatInterface'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastContainer, useToast } from './components/Toast'
import './App.css'

function AppContent() {
  const { toasts, removeToast } = useToast()

  return (
    <>
      <ChatInterface />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App

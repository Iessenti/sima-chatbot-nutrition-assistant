import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { hasApiKey } from './lib/env'

if (!hasApiKey()) {
  console.warn(
    '%c⚠️ API ключ не настроен!',
    'color: orange; font-size: 16px; font-weight: bold;'
  )
  console.info(
    'Для работы приложения необходимо:\n' +
    '1. Создать файл .env в корне проекта\n' +
    '2. Добавить строку: VITE_OPENROUTER_API_KEY=your_api_key_here\n' +
    '3. Перезапустить dev сервер (npm run dev)'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

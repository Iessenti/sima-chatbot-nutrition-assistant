# КБЖУ Калькулятор

Приложение для отслеживания калорий, белков, жиров и углеводов с использованием LLM для автоматического извлечения данных из естественного языка.

## Настройка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка API ключа OpenRouter

1. Создайте файл `.env` в корне проекта:
```bash
touch .env
```

2. Добавьте в файл `.env` ваш API ключ:
```
VITE_OPENROUTER_API_KEY=your_api_key_here
```

3. Получить API ключ можно на [OpenRouter.ai](https://openrouter.ai/)

4. **Важно**: После создания/изменения `.env` файла необходимо перезапустить dev сервер:
```bash
npm run dev
```

### 3. Запуск приложения

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

## Проверка настройки

После запуска приложения:
- Откройте консоль браузера (F12)
- Если ключ не настроен, вы увидите предупреждение с инструкциями
- Если ключ настроен правильно, предупреждений не будет

## Структура проекта

- `src/hooks/` - React хуки
- `src/components/` - UI компоненты
- `src/lib/` - Утилиты и бизнес-логика
- `src/services/` - Сервисы для обработки сообщений
- `src/store/` - Zustand stores для управления состоянием

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

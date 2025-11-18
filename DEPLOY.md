# Инструкция по деплою через GitHub Actions

## Настройка GitHub Pages

1. **Включите GitHub Pages в настройках репозитория:**
   - Перейдите в Settings → Pages
   - В разделе "Source" выберите "GitHub Actions"
   - Сохраните изменения

2. **Добавьте секреты:**
   - Перейдите в Settings → Secrets and variables → Actions
   - Нажмите "New repository secret"
   - Добавьте секрет с именем `VITE_OPENROUTER_API_KEY` и вашим API ключом OpenRouter

3. **Проверьте название ветки:**
   - В файле `.github/workflows/deploy.yml` проверьте, что указана правильная ветка (master или main)
   - По умолчанию настроены обе ветки

4. **Настройте base path (если нужно):**
   - Если репозиторий называется `username/LLM-lab-UI`, приложение будет доступно по адресу: `https://username.github.io/LLM-lab-UI/`
   - Если нужно использовать корневой домен, отредактируйте `vite.config.ts` и измените `base: '/'`

## Альтернативные варианты деплоя

### Vercel (рекомендуется для продакшена)

1. Установите Vercel CLI: `npm i -g vercel`
2. Запустите: `vercel`
3. Или подключите репозиторий на [vercel.com](https://vercel.com)

### Netlify

1. Установите Netlify CLI: `npm i -g netlify-cli`
2. Запустите: `netlify deploy --prod`
3. Или подключите репозиторий на [netlify.com](https://netlify.com)

## После деплоя

После успешного деплоя приложение будет доступно по адресу:
- GitHub Pages: `https://<username>.github.io/<repository-name>/`
- Vercel/Netlify: автоматически сгенерированный URL


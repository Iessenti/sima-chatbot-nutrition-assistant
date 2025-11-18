export function getApiKey(): string {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  
  if (!key || key.trim() === '') {
    console.warn(
      '⚠️ VITE_OPENROUTER_API_KEY не установлен!\n' +
      'Создайте файл .env в корне проекта и добавьте:\n' +
      'VITE_OPENROUTER_API_KEY=your_api_key_here\n\n' +
      'После этого перезапустите dev сервер (npm run dev)'
    );
    return '';
  }
  
  return key;
}

export function hasApiKey(): boolean {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  return !!key && key.trim() !== '';
}


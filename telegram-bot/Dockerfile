# Dockerfile для деплоя на различных платформах
# Подходит для Fly.io, Koyeb, и других Docker-based платформ

FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая devDependencies для сборки)
RUN npm install

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build

# Удаляем devDependencies после сборки (опционально, для уменьшения размера)
RUN npm prune --production

# Открываем порт (если нужен для health checks)
EXPOSE 3000

# Запускаем бота
CMD ["npm", "start"]


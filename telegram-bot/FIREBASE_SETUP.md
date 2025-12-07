# Инструкция по получению учетных данных Firebase

## Шаг 1: Откройте Firebase Console

Перейдите на https://console.firebase.google.com/ и выберите ваш проект `fedorishina-e2550`

## Шаг 2: Откройте настройки проекта

1. Нажмите на иконку ⚙️ (шестеренка) рядом с "Project Overview"
2. Выберите "Project settings"

## Шаг 3: Перейдите в Service Accounts

1. В открывшемся окне перейдите на вкладку "Service accounts"
2. Вы увидите раздел "Firebase Admin SDK"

## Шаг 4: Сгенерируйте приватный ключ

1. Нажмите кнопку "Generate new private key"
2. В появившемся диалоге нажмите "Generate key"
3. JSON файл автоматически скачается на ваш компьютер

## Шаг 5: Извлеките данные из JSON

Откройте скачанный JSON файл. Он будет выглядеть примерно так:

```json
{
  "type": "service_account",
  "project_id": "fedorishina-e2550",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@fedorishina-e2550.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## Шаг 6: Заполните .env файл

Создайте файл `.env` в папке `telegram-bot/` (НЕ редактируйте `env.example`!) и заполните:

```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота

FIREBASE_PROJECT_ID=fedorishina-e2550
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...полный ключ из JSON...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@fedorishina-e2550.iam.gserviceaccount.com
```

### Важные моменты:

1. **FIREBASE_PRIVATE_KEY** - скопируйте значение `private_key` из JSON полностью, включая `-----BEGIN PRIVATE KEY-----` и `-----END PRIVATE KEY-----`
2. Обязательно оберните значение в кавычки `"..."` 
3. Сохраните все переносы строк `\n` как есть
4. **FIREBASE_CLIENT_EMAIL** - это значение `client_email` из JSON файла

### Пример правильного формата:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## Безопасность

⚠️ **НИКОГДА не коммитьте файл `.env` в git!** Он уже добавлен в `.gitignore`.

⚠️ **НЕ добавляйте реальные данные в `env.example`** - это шаблон для других разработчиков.


# Firebase Cloud Functions

Эта папка содержит Cloud Functions для удаления пользователей из Firebase Authentication.

## Установка

1. Перейдите в папку functions:
```bash
cd functions
```

2. Установите зависимости:
```bash
npm install
```

## Развертывание

Для развертывания Cloud Function выполните:

```bash
firebase deploy --only functions
```

Или из корневой папки проекта:

```bash
npm run deploy --prefix functions
```

## Функции

### deleteUser

Удаляет пользователя из Firebase Authentication. Доступна только для администраторов.

**Параметры:**
- `uid` (string) - UID пользователя для удаления

**Требования:**
- Пользователь должен быть аутентифицирован
- Пользователь должен иметь роль "admin" в Firestore



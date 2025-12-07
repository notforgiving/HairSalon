/**
 * Скрипт для сброса авторизации пользователя
 * 
 * Использование:
 * ts-node src/scripts/resetUser.ts +79211816360
 * или
 * npm run reset-user -- +79211816360
 */

import * as dotenv from "dotenv";
import { clearUserSessionByPhone } from "../handlers/utils";
import "../services/firebase"; // Инициализация Firebase

dotenv.config();

async function resetUser(phone: string) {
  try {
    console.log(`🔄 Сброс авторизации для пользователя: ${phone}`);
    
    const cleared = await clearUserSessionByPhone(phone);
    
    if (cleared) {
      console.log(`✅ Сессия пользователя ${phone} успешно очищена!`);
      console.log(`Пользователь сможет войти заново при следующем использовании бота.`);
    } else {
      console.log(`❌ Пользователь с номером ${phone} не найден в базе данных или сессия уже была очищена.`);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Ошибка при сбросе сессии:", error.message);
    process.exit(1);
  }
}

// Получаем номер телефона из аргументов командной строки
const phone = process.argv[2];

if (!phone) {
  console.error("❌ Укажите номер телефона в качестве аргумента");
  console.error("Пример: ts-node src/scripts/resetUser.ts +79211816360");
  process.exit(1);
}

resetUser(phone);


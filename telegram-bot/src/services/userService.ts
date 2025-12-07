import { db } from "./firebase";
import { UserProfile } from "../types";

/**
 * Нормализует номер телефона к формату базы данных (8XXXXXXXXXX)
 */
export function normalizePhone(phone: string): string {
  // Удаляем все нецифровые символы
  let digits = phone.replace(/\D/g, "");
  
  // Заменяем +7 или 7 в начале на 8
  if (digits.startsWith("7")) {
    digits = "8" + digits.slice(1);
  } else if (digits.startsWith("+7")) {
    digits = "8" + digits.slice(2);
  }
  
  // Если номер начинается не с 8, добавляем 8
  if (!digits.startsWith("8") && digits.length === 10) {
    digits = "8" + digits;
  }
  
  return digits.slice(0, 11); // Ограничиваем до 11 цифр
}

/**
 * Находит пользователя по номеру телефона
 */
export async function findUserByPhone(phone: string): Promise<UserProfile | null> {
  const normalizedPhone = normalizePhone(phone);
  
  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("phone", "==", normalizedPhone).limit(1).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    uid: doc.id,
    ...doc.data(),
  } as UserProfile;
}


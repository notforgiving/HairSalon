import { Context } from "telegraf";
import { Appointment } from "../types";

/**
 * Форматирует дату и время для отображения
 */
export function formatDateTime(date: string, time: string): string {
  const dt = new Date(`${date}T${time}`);
  if (isNaN(dt.getTime())) {
    return `${date} ${time}`;
  }
  
  const formattedDate = dt.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  
  const formattedTime = dt.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  return `${formattedDate} ${formattedTime}`;
}

/**
 * Получает день недели на русском
 */
export function getDayOfWeek(date: string): string {
  const dt = new Date(date);
  if (isNaN(dt.getTime())) {
    return "";
  }
  
  const days = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  return days[dt.getDay()];
}

/**
 * Форматирует запись для отображения
 */
export function formatAppointment(appointment: Appointment): string {
  const dateTime = formatDateTime(appointment.date, appointment.time);
  const dayOfWeek = getDayOfWeek(appointment.date);
  
  let text = `📅 ${dateTime}`;
  if (dayOfWeek) {
    text += ` (${dayOfWeek})`;
  }
  text += `\n👤 ${appointment.hairdresserName}`;
  if (appointment.hairdresserAddress) {
    text += `\n📍 ${appointment.hairdresserAddress}`;
  }
  
  return text;
}

/**
 * Форматирует дату для отображения
 */
export function formatDate(date: string): string {
  const dt = new Date(date);
  if (isNaN(dt.getTime())) {
    return date;
  }
  return dt.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
}

// Простая сессия в памяти для хранения данных пользователей
interface UserSessionData {
  userId?: string;
  userName?: string;
  selectedHairdresser?: any;
  contactSent?: boolean;
}

const userSession = new Map<number, UserSessionData>();

/**
 * Сохраняет данные пользователя в сессии
 */
export function setUserData(ctx: Context, userId: string, userName?: string): void {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    const existing = userSession.get(telegramId) || {};
    userSession.set(telegramId, { ...existing, userId, userName, contactSent: true });
  }
  // Также сохраняем в контексте для обратной совместимости
  (ctx as any).userData = { userId, userName };
}

/**
 * Получает данные пользователя из сессии или контекста
 */
export function getUserData(ctx: Context): { userId: string; userName?: string } | null {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    const sessionData = userSession.get(telegramId);
    if (sessionData && sessionData.userId) {
      return { userId: sessionData.userId, userName: sessionData.userName };
    }
  }
  // Fallback на контекст для обратной совместимости
  return (ctx as any).userData || null;
}

/**
 * Сохраняет выбранного специалиста в сессии
 */
export function setSelectedHairdresser(ctx: Context, hairdresser: any): void {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    const existing = userSession.get(telegramId);
    if (existing) {
      existing.selectedHairdresser = hairdresser;
      userSession.set(telegramId, existing);
    } else {
      // Если сессии нет, создаем минимальную
      userSession.set(telegramId, { userId: "", selectedHairdresser: hairdresser });
    }
  }
  // Также сохраняем в контексте для обратной совместимости
  (ctx as any).selectedHairdresser = hairdresser;
}

/**
 * Получает выбранного специалиста из сессии
 */
export function getSelectedHairdresser(ctx: Context): any | null {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    const sessionData = userSession.get(telegramId);
    if (sessionData?.selectedHairdresser) {
      return sessionData.selectedHairdresser;
    }
  }
  // Fallback на контекст для обратной совместимости
  return (ctx as any).selectedHairdresser || null;
}

/**
 * Проверяет, был ли отправлен контакт
 */
export function isContactSent(ctx: Context): boolean {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    const sessionData = userSession.get(telegramId);
    return sessionData?.contactSent || false;
  }
  return false;
}

/**
 * Очищает выбранного специалиста
 */
export function clearSelectedHairdresser(ctx: Context): void {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    const existing = userSession.get(telegramId);
    if (existing) {
      delete existing.selectedHairdresser;
      userSession.set(telegramId, existing);
    }
  }
  delete (ctx as any).selectedHairdresser;
}

/**
 * Очищает сессию пользователя по userId
 */
export function clearUserSessionByUserId(userId: string): boolean {
  let cleared = false;
  for (const [telegramId, sessionData] of userSession.entries()) {
    if (sessionData.userId === userId) {
      userSession.delete(telegramId);
      cleared = true;
    }
  }
  return cleared;
}

/**
 * Очищает сессию пользователя по номеру телефона
 */
export async function clearUserSessionByPhone(phone: string): Promise<boolean> {
  const { findUserByPhone } = await import("../services/userService");
  const user = await findUserByPhone(phone);
  
  if (!user) {
    return false;
  }
  
  return clearUserSessionByUserId(user.uid);
}

/**
 * Очищает все сессии (для отладки)
 */
export function clearAllSessions(): void {
  userSession.clear();
}

/**
 * Получает все активные сессии (для отладки)
 */
export function getAllSessions(): Array<{ telegramId: number; userId?: string; userName?: string }> {
  const sessions: Array<{ telegramId: number; userId?: string; userName?: string }> = [];
  for (const [telegramId, sessionData] of userSession.entries()) {
    sessions.push({
      telegramId,
      userId: sessionData.userId,
      userName: sessionData.userName,
    });
  }
  return sessions;
}


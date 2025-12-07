import { Context, Markup } from "telegraf";
import { findUserByPhone } from "../services/userService";
import { setUserData, isContactSent } from "./utils";
import { showMainMenu } from "./menu";

const REGISTRATION_URL = "https://hair-salon-lemon.vercel.app/register";

/**
 * Обработчик команды /start
 */
export async function handleStart(ctx: Context): Promise<void> {
  const contactSent = isContactSent(ctx);
  
  if (contactSent) {
    // Если контакт уже отправлен, показываем главное меню
    const userData = await getUserDataFromSession(ctx);
    if (userData) {
      await showMainMenu(ctx);
      return;
    }
  }
  
  await ctx.reply(
    "👋 Привет! Я бот для записи к парикмахеру.\n\n" +
    "Для начала работы мне нужен ваш номер телефона. Пожалуйста, отправьте контакт.",
    Markup.keyboard([
      [Markup.button.contactRequest("📱 Отправить контакт")],
      [Markup.button.text("▶️ Начать")],
    ]).resize()
  );
}

/**
 * Получает данные пользователя из сессии (вспомогательная функция)
 */
async function getUserDataFromSession(ctx: Context): Promise<{ userId: string; userName?: string } | null> {
  const { getUserData } = await import("./utils");
  return getUserData(ctx);
}

/**
 * Обработчик получения контакта
 */
export async function handleContact(ctx: Context): Promise<void> {
  const contact = (ctx.message as any)?.contact;
  
  if (!contact?.phone_number) {
    await ctx.reply("❌ Не удалось получить номер телефона. Попробуйте еще раз.");
    return;
  }
  
  try {
    const user = await findUserByPhone(contact.phone_number);
    
    if (!user) {
      await ctx.reply(
        "❌ Ваш номер телефона не найден в базе данных.\n\n" +
        "Пожалуйста, зарегистрируйтесь на сайте:\n" +
        `${REGISTRATION_URL}\n\n` +
        "После регистрации на сайте вы сможете воспользоваться ботом.",
        Markup.removeKeyboard()
      );
      return;
    }
    
    // Сохраняем данные пользователя в сессии
    setUserData(ctx, user.uid, user.name);
    
    // Убираем клавиатуру с кнопкой контакта
    await ctx.reply(
      "✅ Отлично! Вы успешно авторизованы.",
      Markup.removeKeyboard()
    );
    
    // Показываем главное меню
    await showMainMenu(ctx);
  } catch (error: any) {
    console.error("Error handling contact:", error);
    await ctx.reply("❌ Произошла ошибка при обработке контакта. Попробуйте позже.");
  }
}


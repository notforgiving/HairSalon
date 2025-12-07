import { Telegraf, Context } from "telegraf";
import * as dotenv from "dotenv";
import { handleStart, handleContact } from "./handlers/start";
import { handleMenu } from "./handlers/menu";
import {
  handleHairdresserSelection,
  handleDateSelection,
  handleSlotSelection,
  handleBookingConfirm,
} from "./handlers/booking";
import {
  handleAppointmentsView,
  handleAppointmentsNavigation,
  handleCancelAppointment,
} from "./handlers/appointments";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "");

// Обработка команды /start
bot.command("start", handleStart);

// Обработка команды /reset (для сброса сессии)
bot.command("reset", async (ctx) => {
  const { clearUserSessionByPhone } = await import("./handlers/utils");
  const phone = ctx.message?.text?.split(" ")[1];
  
  if (!phone) {
    await ctx.reply("❌ Укажите номер телефона после команды /reset\n\nПример: /reset +79211816360");
    return;
  }
  
  try {
    const cleared = await clearUserSessionByPhone(phone);
    if (cleared) {
      await ctx.reply(`✅ Сессия пользователя ${phone} успешно очищена!\n\nПользователь сможет войти заново при следующем использовании бота.`);
    } else {
      await ctx.reply(`❌ Пользователь с номером ${phone} не найден в базе данных или сессия уже была очищена.`);
    }
  } catch (error: any) {
    console.error("Error resetting user session:", error);
    await ctx.reply("❌ Произошла ошибка при сбросе сессии.");
  }
});

// Обработка кнопки "Начать"
bot.hears("▶️ Начать", handleStart);

// Обработка контакта
bot.on("contact", handleContact);

// Обработка callback-запросов
bot.action(/^menu:(.+)$/, async (ctx) => {
  const match = (ctx as any).match as RegExpMatchArray;
  const action = match[1];
  await handleMenu(ctx, action);
});

// Обработка выбора специалиста
bot.action(/^book:hairdresser:(.+)$/, async (ctx) => {
  const match = (ctx as any).match as RegExpMatchArray;
  const hairdresserId = match[1];
  await handleHairdresserSelection(ctx, hairdresserId);
  await ctx.answerCbQuery();
});

// Обработка выбора даты
bot.action(/^book:date:(.+):(.+)$/, async (ctx) => {
  const match = (ctx as any).match as RegExpMatchArray;
  const hairdresserId = match[1];
  const date = match[2];
  await handleDateSelection(ctx, hairdresserId, date);
  await ctx.answerCbQuery();
});

// Обработка выбора слота
bot.action(/^book:slot:(.+)$/, async (ctx) => {
  const match = (ctx as any).match as RegExpMatchArray;
  const slotId = match[1];
  await handleSlotSelection(ctx, slotId);
  await ctx.answerCbQuery();
});

// Обработка подтверждения записи
bot.action(/^book:confirm:(.+)$/, async (ctx) => {
  const match = (ctx as any).match as RegExpMatchArray;
  const slotId = match[1];
  await handleBookingConfirm(ctx, slotId);
  await ctx.answerCbQuery();
});

// Обработка просмотра записей
bot.action(/^appointments:(upcoming|past)$/, async (ctx) => {
  const match = (ctx as any).match as RegExpMatchArray;
  const type = match[1] as "upcoming" | "past";
  await handleAppointmentsView(ctx, type);
  await ctx.answerCbQuery();
});

// Обработка навигации по записям
bot.action(/^appointments:(upcoming|past):(\d+)$/, async (ctx) => {
  const match = (ctx as any).match as RegExpMatchArray;
  const type = match[1] as "upcoming" | "past";
  const index = parseInt(match[2], 10);
  await handleAppointmentsNavigation(ctx, type, index);
});

// Обработка отмены записи
bot.action(/^appointments:cancel:(.+):(\d+)$/, async (ctx) => {
  const match = (ctx as any).match as RegExpMatchArray;
  const appointmentId = match[1];
  const currentIndex = parseInt(match[2], 10);
  await handleCancelAppointment(ctx, appointmentId, currentIndex);
});

// Обработка неизвестных callback-запросов
bot.action(/^appointments:none$/, async (ctx) => {
  await ctx.answerCbQuery();
});

// Обработка ошибок
bot.catch((err: unknown, ctx: Context) => {
  console.error("Error in bot:", err);
  ctx.reply("❌ Произошла ошибка. Попробуйте позже или начните заново через /start");
});

export default bot;


import { Context, Markup } from "telegraf";
import { getUserData } from "./utils";

/**
 * Обработчик главного меню
 */
export async function handleMenu(ctx: Context, action: string): Promise<void> {
  const userData = getUserData(ctx);
  
  if (!userData) {
    await ctx.reply("❌ Пожалуйста, сначала отправьте контакт через /start");
    return;
  }
  
  switch (action) {
    case "book":
      await handleBookMenu(ctx);
      break;
    case "appointments":
      await handleAppointmentsMenu(ctx);
      break;
    case "back":
      await showMainMenu(ctx);
      break;
    default:
      await ctx.reply("❌ Неизвестное действие");
  }
}

/**
 * Показывает меню записи на прием
 */
async function handleBookMenu(ctx: Context): Promise<void> {
  // Загружаем специалистов
  const { getAvailableHairdressers } = await import("../services/hairdresserService");
  const hairdressers = await getAvailableHairdressers();
  
  if (hairdressers.length === 0) {
    try {
      await ctx.editMessageText("❌ Нет доступных специалистов", {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback("⬅️ Назад", "menu:back")],
          ],
        },
      });
    } catch {
      await ctx.reply("❌ Нет доступных специалистов", {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback("⬅️ Назад", "menu:back")],
          ],
        },
      });
    }
    return;
  }
  
  const buttons = hairdressers.map((h) => [
    Markup.button.callback(
      `👤 ${h.name}${h.address ? ` (${h.address})` : ""}`,
      `book:hairdresser:${h.id}`
    ),
  ]);
  
  buttons.push([Markup.button.callback("⬅️ Назад", "menu:back")]);
  
  try {
    await ctx.editMessageText("📝 Выберите специалиста:", {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  } catch {
    await ctx.reply("📝 Выберите специалиста:", {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }
}

/**
 * Показывает меню записей
 */
async function handleAppointmentsMenu(ctx: Context): Promise<void> {
  const userData = getUserData(ctx);
  
  if (!userData) {
    try {
      await ctx.editMessageText(
        "❌ Пожалуйста, сначала отправьте контакт через /start",
        Markup.inlineKeyboard([
          [Markup.button.callback("⬅️ Назад", "menu:back")],
        ])
      );
    } catch {
      await ctx.reply("❌ Пожалуйста, сначала отправьте контакт через /start");
    }
    return;
  }
  
  try {
    await ctx.editMessageText("📋 Мои записи", {
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback("📅 Будущие записи", "appointments:upcoming")],
          [Markup.button.callback("📜 Прошлые записи", "appointments:past")],
          [Markup.button.callback("⬅️ Назад", "menu:back")],
        ],
      },
    });
  } catch {
    await ctx.reply("📋 Мои записи", {
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback("📅 Будущие записи", "appointments:upcoming")],
          [Markup.button.callback("📜 Прошлые записи", "appointments:past")],
          [Markup.button.callback("⬅️ Назад", "menu:back")],
        ],
      },
    });
  }
}

/**
 * Показывает главное меню (экспортируем для использования в других модулях)
 */
export async function showMainMenu(ctx: Context): Promise<void> {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("📝 Записаться на прием", "menu:book")],
    [Markup.button.callback("📋 Мои записи", "menu:appointments")],
  ]);
  
  // Пытаемся отредактировать сообщение, если это callback, иначе отправляем новое
  try {
    await ctx.editMessageText("✨ Главное меню", keyboard);
  } catch {
    await ctx.reply("✨ Главное меню", keyboard);
  }
}


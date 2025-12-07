import { Context, Markup } from "telegraf";
import { getUserData } from "./utils";
import { getUpcomingAppointments, getPastAppointments, cancelAppointment } from "../services/appointmentService";
import { formatAppointment } from "./utils";

/**
 * Обработчик просмотра записей
 */
export async function handleAppointmentsView(ctx: Context, type: "upcoming" | "past"): Promise<void> {
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
    const appointments = type === "upcoming"
      ? await getUpcomingAppointments(userData.userId)
      : await getPastAppointments(userData.userId);
    
    if (appointments.length === 0) {
      // Проверяем, есть ли вообще какие-то записи у пользователя
      const { getUserAppointments } = await import("../services/appointmentService");
      const allAppointments = await getUserAppointments(userData.userId);
      
      let message: string;
      if (allAppointments.length === 0) {
        // Пользователь еще ни разу не записывался
        message = "📋 Вы еще ни разу не записывались.\n\n" +
          "Используйте кнопку \"Записаться на прием\", чтобы создать первую запись!";
      } else {
        // Есть записи, но не в этой категории
        message = type === "upcoming"
          ? "📅 У вас нет будущих записей"
          : "📜 У вас нет прошлых записей";
      }
      
      try {
        await ctx.editMessageText(
          message,
          Markup.inlineKeyboard([
            [Markup.button.callback("⬅️ Назад", "menu:appointments")],
          ])
        );
      } catch {
        await ctx.reply(message, Markup.inlineKeyboard([
          [Markup.button.callback("⬅️ Назад", "menu:appointments")],
        ]));
      }
      return;
    }
    
    // Показываем первую запись с навигацией
    await showAppointment(ctx, appointments, 0, type);
  } catch (error: any) {
    console.error("Error viewing appointments:", error);
    try {
      await ctx.editMessageText("❌ Произошла ошибка при загрузке записей. Попробуйте позже.");
    } catch {
      await ctx.reply("❌ Произошла ошибка при загрузке записей. Попробуйте позже.");
    }
  }
}

/**
 * Показывает запись с навигацией
 */
async function showAppointment(
  ctx: Context,
  appointments: any[],
  index: number,
  type: "upcoming" | "past"
): Promise<void> {
  const appointment = appointments[index];
  const formatted = formatAppointment(appointment);
  
  const buttons: any[] = [];
  
  // Кнопки навигации, если записей больше одной
  if (appointments.length > 1) {
    const navButtons: any[] = [];
    if (index > 0) {
      navButtons.push(
        Markup.button.callback("◀️", `appointments:${type}:${index - 1}`)
      );
    }
    navButtons.push(
      Markup.button.callback(`${index + 1}/${appointments.length}`, "appointments:none")
    );
    if (index < appointments.length - 1) {
      navButtons.push(
        Markup.button.callback("▶️", `appointments:${type}:${index + 1}`)
      );
    }
    buttons.push(navButtons);
  }
  
  // Кнопка отмены для будущих записей
  if (type === "upcoming") {
    buttons.push([
      Markup.button.callback("❌ Отменить запись", `appointments:cancel:${appointment.id}:${index}`),
    ]);
  }
  
  buttons.push([Markup.button.callback("⬅️ Назад", "menu:appointments")]);
  
  await ctx.editMessageText(formatted, {
    reply_markup: {
      inline_keyboard: buttons,
    },
  });
}

/**
 * Обработчик навигации по записям
 */
export async function handleAppointmentsNavigation(
  ctx: Context,
  type: "upcoming" | "past",
  index: number
): Promise<void> {
  const userData = getUserData(ctx);
  
  if (!userData) {
    await ctx.reply("❌ Пожалуйста, сначала отправьте контакт через /start");
    return;
  }
  
  try {
    const appointments = type === "upcoming"
      ? await getUpcomingAppointments(userData.userId)
      : await getPastAppointments(userData.userId);
    
    if (index < 0 || index >= appointments.length) {
      await ctx.answerCbQuery("❌ Неверный индекс");
      return;
    }
    
    await showAppointment(ctx, appointments, index, type);
    await ctx.answerCbQuery();
  } catch (error: any) {
    console.error("Error navigating appointments:", error);
    await ctx.answerCbQuery("❌ Ошибка навигации");
  }
}

/**
 * Обработчик отмены записи
 */
export async function handleCancelAppointment(
  ctx: Context,
  appointmentId: string,
  currentIndex: number
): Promise<void> {
  const userData = getUserData(ctx);
  
  if (!userData) {
    await ctx.reply("❌ Пожалуйста, сначала отправьте контакт через /start");
    return;
  }
  
  try {
    const success = await cancelAppointment(appointmentId);
    
    if (!success) {
      await ctx.answerCbQuery("❌ Запись не найдена");
      return;
    }
    
    await ctx.answerCbQuery("✅ Запись отменена");
    
    // Обновляем список записей
    const appointments = await getUpcomingAppointments(userData.userId);
    
    if (appointments.length === 0) {
      await ctx.editMessageText(
        "📅 У вас нет будущих записей",
        Markup.inlineKeyboard([
          [Markup.button.callback("⬅️ Назад", "menu:appointments")],
        ])
      );
      return;
    }
    
    // Показываем следующую запись или предыдущую, если была последняя
    const newIndex = currentIndex >= appointments.length ? appointments.length - 1 : currentIndex;
    await showAppointment(ctx, appointments, newIndex, "upcoming");
  } catch (error: any) {
    console.error("Error canceling appointment:", error);
    await ctx.answerCbQuery("❌ Ошибка при отмене записи");
  }
}


import { Context, Markup } from "telegraf";
import { getUserData, setSelectedHairdresser, getSelectedHairdresser, clearSelectedHairdresser } from "./utils";
import { getHairdresserById } from "../services/hairdresserService";
import { getAvailableSlots, bookSlot } from "../services/slotService";
import { createAppointment } from "../services/appointmentService";
import { formatDateTime, getDayOfWeek, formatDate } from "./utils";

/**
 * Обработчик выбора специалиста для записи
 */
export async function handleHairdresserSelection(ctx: Context, hairdresserId: string): Promise<void> {
  const userData = getUserData(ctx);
  
  if (!userData) {
    await ctx.reply("❌ Пожалуйста, сначала отправьте контакт через /start");
    return;
  }
  
  try {
    const hairdresser = await getHairdresserById(hairdresserId);
    
    if (!hairdresser) {
      try {
        await ctx.editMessageText("❌ Специалист не найден");
      } catch {
        await ctx.reply("❌ Специалист не найден");
      }
      return;
    }
    
    // Сохраняем выбранного специалиста в сессии
    setSelectedHairdresser(ctx, hairdresser);
    
    // Загружаем доступные слоты
    const slots = await getAvailableSlots(hairdresserId);
    
    if (slots.length === 0) {
      const message = `❌ У ${hairdresser.name} нет доступных слотов.\n\n` +
        "Попробуйте выбрать другого специалиста.";
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("⬅️ Назад к выбору специалиста", "menu:book")],
      ]);
      
      try {
        await ctx.editMessageText(message, keyboard);
      } catch {
        await ctx.reply(message, keyboard);
      }
      return;
    }
    
    // Получаем уникальные даты из слотов
    const uniqueDates = Array.from(new Set(slots.map(slot => slot.date)))
      .sort((a, b) => a.localeCompare(b));
    
    // Формируем сообщение и кнопки с датами
    const message = `📅 Выберите дату для записи к ${hairdresser.name}:`;
    const buttons: any[] = [];
    
    // Группируем даты по 2 в ряд
    for (let i = 0; i < uniqueDates.length; i += 2) {
      const dateButtons: any[] = [];
      dateButtons.push(
        Markup.button.callback(
          formatDateWithDay(uniqueDates[i]),
          `book:date:${hairdresserId}:${uniqueDates[i]}`
        )
      );
      
      if (i + 1 < uniqueDates.length) {
        dateButtons.push(
          Markup.button.callback(
            formatDateWithDay(uniqueDates[i + 1]),
            `book:date:${hairdresserId}:${uniqueDates[i + 1]}`
          )
        );
      }
      
      buttons.push(dateButtons);
    }
    
    buttons.push([Markup.button.callback("⬅️ Назад к выбору специалиста", "menu:book")]);
    
    try {
      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    } catch {
      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    }
  } catch (error: any) {
    console.error("Error handling hairdresser selection:", error);
    await ctx.reply("❌ Произошла ошибка. Попробуйте позже.");
  }
}

/**
 * Обработчик выбора даты
 */
export async function handleDateSelection(ctx: Context, hairdresserId: string, date: string): Promise<void> {
  const userData = getUserData(ctx);
  
  if (!userData) {
    try {
      await ctx.editMessageText("❌ Пожалуйста, сначала отправьте контакт через /start");
    } catch {
      await ctx.reply("❌ Пожалуйста, сначала отправьте контакт через /start");
    }
    return;
  }
  
  try {
    const hairdresser = await getHairdresserById(hairdresserId);
    
    if (!hairdresser) {
      try {
        await ctx.editMessageText("❌ Специалист не найден");
      } catch {
        await ctx.reply("❌ Специалист не найден");
      }
      return;
    }
    
    // Сохраняем выбранного специалиста в сессии
    setSelectedHairdresser(ctx, hairdresser);
    
    // Загружаем доступные слоты для выбранной даты
    const allSlots = await getAvailableSlots(hairdresserId);
    const dateSlots = allSlots.filter(slot => slot.date === date);
    
    if (dateSlots.length === 0) {
      const message = `❌ На выбранную дату нет доступных слотов.\n\n` +
        "Попробуйте выбрать другую дату.";
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("⬅️ Назад к выбору даты", `book:hairdresser:${hairdresserId}`)],
      ]);
      
      try {
        await ctx.editMessageText(message, keyboard);
      } catch {
        await ctx.reply(message, keyboard);
      }
      return;
    }
    
    // Сортируем слоты по времени
    dateSlots.sort((a, b) => a.time.localeCompare(b.time));
    
    // Формируем сообщение и кнопки с временными слотами
    const dayOfWeek = getDayOfWeek(date);
    const formattedDate = formatDate(date);
    const message = `🕐 Выберите время для записи:\n\n` +
      `📅 ${formattedDate} (${dayOfWeek})\n` +
      `👤 ${hairdresser.name}`;
    
    const buttons: any[] = [];
    
    // Группируем временные слоты по 3 в ряд
    for (let i = 0; i < dateSlots.length; i += 3) {
      const timeButtons: any[] = [];
      for (let j = 0; j < 3 && i + j < dateSlots.length; j++) {
        timeButtons.push(
          Markup.button.callback(
            dateSlots[i + j].time,
            `book:slot:${dateSlots[i + j].id}`
          )
        );
      }
      buttons.push(timeButtons);
    }
    
    buttons.push([Markup.button.callback("⬅️ Назад к выбору даты", `book:hairdresser:${hairdresserId}`)]);
    
    try {
      await ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    } catch {
      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    }
  } catch (error: any) {
    console.error("Error handling date selection:", error);
    await ctx.reply("❌ Произошла ошибка. Попробуйте позже.");
  }
}

/**
 * Обработчик выбора слота для записи
 */
export async function handleSlotSelection(ctx: Context, slotId: string): Promise<void> {
  const userData = getUserData(ctx);
  const hairdresser = getSelectedHairdresser(ctx);
  
  if (!userData || !hairdresser) {
    try {
      await ctx.editMessageText("❌ Пожалуйста, начните процесс записи заново через /start");
    } catch {
      await ctx.reply("❌ Пожалуйста, начните процесс записи заново через /start");
    }
    return;
  }
  
  try {
    const slots = await getAvailableSlots(hairdresser.id);
    const selectedSlot = slots.find((s) => s.id === slotId);
    
    if (!selectedSlot) {
      try {
        await ctx.editMessageText("❌ Этот слот больше не доступен. Выберите другой.");
      } catch {
        await ctx.reply("❌ Этот слот больше не доступен. Выберите другой.");
      }
      return;
    }
    
    // Форматируем дату и время отдельно
    const formattedDate = formatDate(selectedSlot.date);
    const dayOfWeek = getDayOfWeek(selectedSlot.date);
    const formattedTime = selectedSlot.time;
    
    // Показываем подтверждение с деталями
    const confirmationMessage = 
      `✅ Подтвердите запись:\n\n` +
      `👤 Специалист: ${hairdresser.name}\n` +
      `📅 Дата: ${formattedDate} (${dayOfWeek})\n` +
      `🕐 Время: ${formattedTime}\n` +
      `${hairdresser.address ? `📍 Адрес: ${hairdresser.address}\n` : ""}\n` +
      `Вы уверены, что хотите записаться?`;
    
    try {
      await ctx.editMessageText(
        confirmationMessage,
        Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ Подтвердить", `book:confirm:${slotId}`),
            Markup.button.callback("❌ Отмена", `book:hairdresser:${hairdresser.id}`),
          ],
        ])
      );
    } catch {
      await ctx.reply(
        confirmationMessage,
        Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ Подтвердить", `book:confirm:${slotId}`),
            Markup.button.callback("❌ Отмена", `book:hairdresser:${hairdresser.id}`),
          ],
        ])
      );
    }
  } catch (error: any) {
    console.error("Error handling slot selection:", error);
    await ctx.reply("❌ Произошла ошибка. Попробуйте позже.");
  }
}

/**
 * Обработчик подтверждения записи
 */
export async function handleBookingConfirm(ctx: Context, slotId: string): Promise<void> {
  const userData = getUserData(ctx);
  const hairdresser = getSelectedHairdresser(ctx);
  
  if (!userData || !hairdresser) {
    try {
      await ctx.editMessageText("❌ Пожалуйста, начните процесс записи заново через /start");
    } catch {
      await ctx.reply("❌ Пожалуйста, начните процесс записи заново через /start");
    }
    return;
  }
  
  try {
    // Проверяем, что слот еще доступен
    const slots = await getAvailableSlots(hairdresser.id);
    const selectedSlot = slots.find((s) => s.id === slotId);
    
    if (!selectedSlot) {
      // Получаем дату из выбранного слота для возврата к выбору времени
      const slotDate = slots.find(s => s.id === slotId)?.date;
      
      const backButton = slotDate 
        ? Markup.button.callback("⬅️ Назад к выбору времени", `book:date:${hairdresser.id}:${slotDate}`)
        : Markup.button.callback("⬅️ Назад к выбору даты", `book:hairdresser:${hairdresser.id}`);
      
      try {
        await ctx.editMessageText(
          "❌ Этот слот больше не доступен. Выберите другой.",
          Markup.inlineKeyboard([[backButton]])
        );
      } catch {
        await ctx.reply(
          "❌ Этот слот больше не доступен. Выберите другой.",
          Markup.inlineKeyboard([[backButton]])
        );
      }
      return;
    }
    
    // Создаем запись
    await createAppointment({
      userId: userData.userId,
      userName: userData.userName,
      userEmail: "",
      userPhone: "",
      specialistId: hairdresser.id,
      hairdresserName: hairdresser.name,
      hairdresserAddress: hairdresser.address || "",
      date: selectedSlot.date,
      time: selectedSlot.time,
      slotId: selectedSlot.id,
    });
    
    // Бронируем слот
    await bookSlot(selectedSlot.id, userData.userId);
    
    // Форматируем дату и время отдельно
    const formattedDate = formatDate(selectedSlot.date);
    const dayOfWeek = getDayOfWeek(selectedSlot.date);
    const formattedTime = selectedSlot.time;
    
    const successMessage = 
      `✅ Ваша запись подтверждена!\n\n` +
      `👤 Специалист: ${hairdresser.name}\n` +
      `📅 Дата: ${formattedDate} (${dayOfWeek})\n` +
      `🕐 Время: ${formattedTime}\n` +
      `${hairdresser.address ? `📍 Адрес: ${hairdresser.address}\n` : ""}\n` +
      `Ожидаем вас в назначенное время!`;
    
    try {
      await ctx.editMessageText(
        successMessage,
        Markup.inlineKeyboard([
          [Markup.button.callback("📋 Мои записи", "menu:appointments")],
          [Markup.button.callback("🏠 Главное меню", "menu:back")],
        ])
      );
    } catch {
      await ctx.reply(
        successMessage,
        Markup.inlineKeyboard([
          [Markup.button.callback("📋 Мои записи", "menu:appointments")],
          [Markup.button.callback("🏠 Главное меню", "menu:back")],
        ])
      );
    }
    
    // Очищаем выбранного специалиста
    clearSelectedHairdresser(ctx);
  } catch (error: any) {
    console.error("Error confirming booking:", error);
    await ctx.reply("❌ Произошла ошибка при создании записи. Попробуйте позже.");
  }
}

/**
 * Группирует слоты по датам
 */
function groupSlotsByDate(slots: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  
  for (const slot of slots) {
    if (!grouped[slot.date]) {
      grouped[slot.date] = [];
    }
    grouped[slot.date].push(slot);
  }
  
  // Сортируем слоты внутри каждой даты по времени
  for (const date in grouped) {
    grouped[date].sort((a, b) => a.time.localeCompare(b.time));
  }
  
  return grouped;
}


/**
 * Форматирует дату с днем недели для кнопок
 */
function formatDateWithDay(date: string): string {
  const dt = new Date(date);
  if (isNaN(dt.getTime())) {
    return date;
  }
  const formattedDate = dt.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  });
  const dayOfWeek = getDayOfWeek(date);
  const shortDay = dayOfWeek ? dayOfWeek.slice(0, 2) : "";
  return `${formattedDate} ${shortDay}`;
}


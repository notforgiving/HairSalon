import * as admin from "firebase-admin";
import { db } from "./firebase";
import { Slot } from "../types";

/**
 * Получает доступные слоты для специалиста (не забронированные, будущие даты)
 */
export async function getAvailableSlots(specialistId: string): Promise<Slot[]> {
  const slotsRef = db.collection("slots");
  const snapshot = await slotsRef
    .where("specialistId", "==", specialistId)
    .where("booked", "==", false)
    .get();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const slots: Slot[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    const slotDate = new Date(data.date);
    slotDate.setHours(0, 0, 0, 0);
    
    // Показываем только будущие слоты
    if (slotDate >= today) {
      slots.push({
        id: doc.id,
        date: data.date,
        time: data.time,
        booked: data.booked || false,
        userId: data.userId,
        specialistId: data.specialistId,
      });
    }
  });
  
  // Сортируем по дате и времени
  slots.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`).getTime();
    const dateB = new Date(`${b.date}T${b.time}`).getTime();
    return dateA - dateB;
  });
  
  return slots;
}

/**
 * Бронирует слот
 */
export async function bookSlot(slotId: string, userId: string): Promise<void> {
  await db.collection("slots").doc(slotId).update({
    booked: true,
    userId: userId,
  });
}

/**
 * Освобождает слот
 */
export async function releaseSlot(slotId: string): Promise<void> {
  await db.collection("slots").doc(slotId).update({
    booked: false,
    userId: admin.firestore.FieldValue.delete(),
  });
}


import * as admin from "firebase-admin";
import { db } from "./firebase";
import { Appointment } from "../types";
import { releaseSlot } from "./slotService";

/**
 * Создает новую запись
 */
export async function createAppointment(appointment: Omit<Appointment, "id">): Promise<string> {
  const docRef = await db.collection("appointments").add({
    ...appointment,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Получает все записи пользователя
 */
export async function getUserAppointments(userId: string): Promise<Appointment[]> {
  const appointmentsRef = db.collection("appointments");
  const snapshot = await appointmentsRef.where("userId", "==", userId).get();
  
  const appointments: Appointment[] = [];
  snapshot.forEach((doc) => {
    appointments.push({
      id: doc.id,
      ...doc.data(),
    } as Appointment);
  });
  
  return appointments;
}

/**
 * Получает будущие записи пользователя
 */
export async function getUpcomingAppointments(userId: string): Promise<Appointment[]> {
  const appointments = await getUserAppointments(userId);
  const now = new Date();
  
  return appointments
    .filter((apt) => {
      const aptDate = new Date(`${apt.date}T${apt.time}`);
      return aptDate >= now;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateA - dateB;
    });
}

/**
 * Получает прошлые записи пользователя
 */
export async function getPastAppointments(userId: string): Promise<Appointment[]> {
  const appointments = await getUserAppointments(userId);
  const now = new Date();
  
  return appointments
    .filter((apt) => {
      const aptDate = new Date(`${apt.date}T${apt.time}`);
      return aptDate < now;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateB - dateA; // По убыванию
    });
}

/**
 * Удаляет запись и освобождает слот
 */
export async function cancelAppointment(appointmentId: string): Promise<boolean> {
  const appointmentDoc = await db.collection("appointments").doc(appointmentId).get();
  
  if (!appointmentDoc.exists) {
    return false;
  }
  
  const appointment = appointmentDoc.data() as Appointment;
  
  // Удаляем запись
  await db.collection("appointments").doc(appointmentId).delete();
  
  // Освобождаем слот, если есть slotId
  if (appointment.slotId) {
    await releaseSlot(appointment.slotId);
  }
  
  return true;
}

/**
 * Получает запись по ID
 */
export async function getAppointmentById(appointmentId: string): Promise<Appointment | null> {
  const doc = await db.collection("appointments").doc(appointmentId).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return {
    id: doc.id,
    ...doc.data(),
  } as Appointment;
}

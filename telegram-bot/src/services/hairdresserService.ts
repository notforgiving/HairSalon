import { db } from "./firebase";
import { Hairdresser } from "../types";

/**
 * Получает всех специалистов, исключая тех, кто в отпуске
 */
export async function getAvailableHairdressers(): Promise<Hairdresser[]> {
  const hairdressersRef = db.collection("hairdressers");
  const snapshot = await hairdressersRef.get();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const hairdressers: Hairdresser[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    const hairdresser: Hairdresser = {
      id: doc.id,
      name: data.name || "",
      address: data.address,
      photoUrl: data.photoUrl,
      vacation: data.vacation || null,
    };
    
    // Проверяем, не в отпуске ли специалист
    if (hairdresser.vacation?.from && hairdresser.vacation?.to) {
      const vacationStart = new Date(hairdresser.vacation.from);
      const vacationEnd = new Date(hairdresser.vacation.to);
      vacationEnd.setHours(23, 59, 59, 999);
      
      if (today >= vacationStart && today <= vacationEnd) {
        // Специалист в отпуске, пропускаем
        return;
      }
    }
    
    hairdressers.push(hairdresser);
  });
  
  return hairdressers;
}

/**
 * Получает специалиста по ID
 */
export async function getHairdresserById(id: string): Promise<Hairdresser | null> {
  const doc = await db.collection("hairdressers").doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name || "",
    address: data.address,
    photoUrl: data.photoUrl,
    vacation: data.vacation || null,
  };
}


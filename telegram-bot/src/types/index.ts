import { Timestamp } from "firebase-admin/firestore";

export interface VacationPeriod {
  from?: string;
  to?: string;
}

export interface Hairdresser {
  id: string;
  name: string;
  address?: string;
  photoUrl?: string;
  vacation?: VacationPeriod | null;
}

export interface Slot {
  id: string;
  date: string;
  time: string;
  booked: boolean;
  userId?: string;
  specialistId?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  specialistId: string;
  hairdresserName: string;
  hairdresserAddress?: string;
  date: string;
  time: string;
  slotId?: string;
  createdAt?: Timestamp | Date;
}

export interface UserProfile {
  uid: string;
  name?: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
}


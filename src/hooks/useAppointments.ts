import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { Appointment } from "../types";

interface UseAppointmentsResult {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;
}

export const useAppointments = (): UseAppointmentsResult => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, "appointments"));
      const data: Appointment[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Appointment, "id">)
      }));
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить записи");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeAppointment = useCallback(
    async (id: string) => {
      await deleteDoc(doc(db, "appointments", id));
      setAppointments(prev => prev.filter(item => item.id !== id));
    },
    []
  );

  return useMemo(
    () => ({ appointments, loading, error, refresh, removeAppointment }),
    [appointments, loading, error, refresh, removeAppointment]
  );
};

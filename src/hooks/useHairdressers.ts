import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc
} from "firebase/firestore";
import { db } from "../services/firebase";
import { Hairdresser, VacationPeriod } from "../types";

interface UseHairdressersResult {
  hairdressers: Hairdresser[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addHairdresser: (payload: Omit<Hairdresser, "id">) => Promise<void>;
  updateHairdresser: (id: string, payload: Partial<Omit<Hairdresser, "id">>) => Promise<void>;
  removeHairdresser: (id: string) => Promise<void>;
  setVacation: (id: string, vacation: VacationPeriod) => Promise<void>;
  clearVacation: (id: string) => Promise<void>;
  findById: (id?: string) => Hairdresser | undefined;
}

export const useHairdressers = (): UseHairdressersResult => {
  const [hairdressers, setHairdressers] = useState<Hairdresser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, "hairdressers"));
      const data: Hairdresser[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Hairdresser, "id">)
      }));
      setHairdressers(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить специалистов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addHairdresser = useCallback(
    async (payload: Omit<Hairdresser, "id">) => {
      await addDoc(collection(db, "hairdressers"), payload);
      await refresh();
    },
    [refresh]
  );

  const updateHairdresser = useCallback(
    async (id: string, payload: Partial<Omit<Hairdresser, "id">>) => {
      await updateDoc(doc(db, "hairdressers", id), payload);
      await refresh();
    },
    [refresh]
  );

  const removeHairdresser = useCallback(
    async (id: string) => {
      await deleteDoc(doc(db, "hairdressers", id));
      await refresh();
    },
    [refresh]
  );

  const setVacation = useCallback(
    async (id: string, vacation: VacationPeriod) => {
      await updateDoc(doc(db, "hairdressers", id), { vacation });
      await refresh();
    },
    [refresh]
  );

  const clearVacation = useCallback(
    async (id: string) => {
      await updateDoc(doc(db, "hairdressers", id), { vacation: null });
      await refresh();
    },
    [refresh]
  );

  const findById = useCallback(
    (id?: string) => hairdressers.find(h => h.id === id),
    [hairdressers]
  );

  return useMemo(
    () => ({
      hairdressers,
      loading,
      error,
      refresh,
      addHairdresser,
      updateHairdresser,
      removeHairdresser,
      setVacation,
      clearVacation,
      findById
    }),
    [hairdressers, loading, error, refresh, addHairdresser, updateHairdresser, removeHairdresser, setVacation, clearVacation, findById]
  );
};

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { Slot } from "../types";

interface UseHairdresserSlotsOptions {
  hairdresserId?: string;
}

interface UseHairdresserSlotsResult {
  slots: Slot[];
  loading: boolean;
  refresh: (hairdresserId?: string) => Promise<void>;
  removeSlot: (slotId: string) => Promise<void>;
  removeSlots: (slotIds: string[]) => Promise<void>;
}

export const useHairdresserSlots = (
  options: UseHairdresserSlotsOptions = {}
): UseHairdresserSlotsResult => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { hairdresserId } = options;

  const refresh = useCallback(
    async (id?: string) => {
      const targetId = id ?? hairdresserId;
      if (!targetId) {
        setSlots([]);
        return;
      }
      setLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, "slots"), where("specialistId", "==", targetId))
        );
        const data: Slot[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Slot, "id">)
        }));
        setSlots(data);
      } finally {
        setLoading(false);
      }
    },
    [hairdresserId]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeSlot = useCallback(
    async (slotId: string) => {
      await deleteDoc(doc(db, "slots", slotId));
      setSlots(prev => prev.filter(slot => slot.id !== slotId));
    },
    []
  );

  const removeSlots = useCallback(
    async (slotIds: string[]) => {
      await Promise.all(slotIds.map(id => deleteDoc(doc(db, "slots", id))));
      setSlots(prev => prev.filter(slot => !slotIds.includes(slot.id)));
    },
    []
  );

  return useMemo(
    () => ({ slots, loading, refresh, removeSlot, removeSlots }),
    [slots, loading, refresh, removeSlot, removeSlots]
  );
};

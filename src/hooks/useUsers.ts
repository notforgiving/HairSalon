import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { UserProfile } from "../types";

interface UseUsersResult {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateUserProfile: (uid: string, payload: Partial<UserProfile>) => Promise<void>;
  updateUserRole: (uid: string, role: string) => Promise<void>;
}

export const useUsers = (): UseUsersResult => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const data: UserProfile[] = snapshot.docs.map(docSnap => ({
        uid: docSnap.id,
        ...(docSnap.data() as Omit<UserProfile, "uid">)
      }));
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateUserProfile = useCallback(
    async (uid: string, payload: Partial<UserProfile>) => {
      await updateDoc(doc(db, "users", uid), payload);
      await refresh();
    },
    [refresh]
  );

  const updateUserRole = useCallback(
    async (uid: string, role: string) => {
      await updateDoc(doc(db, "users", uid), { role });
      await refresh();
    },
    [refresh]
  );

  return useMemo(
    () => ({ users, loading, error, refresh, updateUserProfile, updateUserRole }),
    [users, loading, error, refresh, updateUserProfile, updateUserRole]
  );
};

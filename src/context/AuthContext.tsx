import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const MIN_LOADING_DURATION = 1200;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingStartRef = useRef<number>(Date.now());

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      loadingStartRef.current = Date.now();
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setRole(docSnap.data().role);
          else setRole("user"); // по умолчанию
        } catch (e) {
          // Недостаточно прав/правила Firestore — безопасно по умолчанию
          setRole("user");
          // опционально: можно залогировать e в консоль
        }
      } else setRole(null);

      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = Math.max(0, MIN_LOADING_DURATION - elapsed);

      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (isMounted) setLoading(false);
      }, remaining);
    });
    return () => {
      isMounted = false;
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

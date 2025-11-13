import React, { useState } from "react";
import { auth, provider, db } from "../services/firebase";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const ensureUserDocument = async (firebaseUser: any) => {
    if (!firebaseUser) return;
    const userDoc = doc(db, "users", firebaseUser.uid);
    const snapshot = await getDoc(userDoc);
    if (!snapshot.exists()) {
      await setDoc(userDoc, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        role: "user",
        phone: "",
        address: "",
        createdAt: new Date()
      });
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDocument(result.user);
      navigate("/");
    } catch (err: any) {
      switch (err.code) {
        case "auth/invalid-email":
          setError("Некорректный email");
          break;
        case "auth/user-disabled":
          setError("Пользователь заблокирован");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Неверный email или пароль");
          break;
        case "auth/too-many-requests":
          setError("Слишком много попыток. Попробуйте позже.");
          break;
        default:
          setError("Не удалось выполнить вход. Попробуйте еще раз.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      await ensureUserDocument(result.user);
      navigate("/");
    } catch (err: any) {
      setError("Не удалось войти через Google. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return setError("Введите email для восстановления пароля");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Проверьте почту для восстановления пароля");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-500">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8 w-96 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-center">Войти</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleLogin();
            }
          }}
        />
        <input
          type="password"
          placeholder="Пароль"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleLogin();
            }
          }}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-primary text-white p-2 rounded hover:bg-purple-700 transition"
        >
          {loading ? "Загрузка..." : "Войти"}
        </button>
        <button
          onClick={handleGoogleLogin}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
        >
          Войти через Google
        </button>
        <button
          onClick={handleResetPassword}
          className="text-sm text-blue-500 underline hover:text-blue-700"
        >
          Забыли пароль?
        </button>
        <p className="text-center text-sm">
          Нет аккаунта? <Link to="/register" className="text-blue-500 underline">Зарегистрироваться</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

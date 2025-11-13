import React, { useState } from "react";
import { auth, provider } from "../services/firebase";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
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

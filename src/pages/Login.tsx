import React, { useEffect, useMemo, useState } from "react";
import { auth, provider, db } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signInWithRedirect,
  getRedirectResult,
  AuthError
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const navigate = useNavigate();

  const isCoarsePointer = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  }, []);

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

  useEffect(() => {
    let isMounted = true;

    const resolveRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await ensureUserDocument(result.user);
          navigate("/profile");
        }
      } catch (err: any) {
        if (!isMounted) return;
        handleAuthError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    resolveRedirectResult();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthError = (err: AuthError | Error) => {
    console.error(err);
    const authError = err as AuthError;
    switch (authError.code) {
      case "auth/invalid-email":
        setError("Некорректный email. Проверьте адрес и попробуйте снова.");
        break;
      case "auth/user-disabled":
        setError("Ваш аккаунт временно заблокирован. Обратитесь в поддержку.");
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
        setError("Неверный email или пароль. Попробуйте еще раз.");
        break;
      case "auth/popup-blocked":
      case "auth/cancelled-popup-request":
        setError("Браузер заблокировал всплывающее окно. Попробуйте еще раз или используйте другую вкладку.");
        break;
      case "auth/popup-closed-by-user":
        setError("Вход через Google был отменен. Попробуйте снова.");
        break;
      case "auth/network-request-failed":
        setError("Проблемы с сетью. Проверьте подключение к интернету.");
        break;
      default:
        setError("Не удалось выполнить вход. Попробуйте еще раз позже.");
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const result = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDocument(result.user);
      navigate("/profile");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const useRedirect = isCoarsePointer || window.innerWidth < 768;
      if (useRedirect) {
        await signInWithRedirect(auth, provider);
        return;
      }
      const result = await signInWithPopup(auth, provider);
      await ensureUserDocument(result.user);
      navigate("/profile");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("Введите email, чтобы получить письмо для восстановления пароля.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await sendPasswordResetEmail(auth, email);
      setMessage("Письмо с инструкциями отправлено. Проверьте почту и следуйте подсказкам.");
      setIsResetMode(false);
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 sm:p-10 flex flex-col gap-5"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">{isResetMode ? "Восстановление пароля" : "Войти"}</h2>
          <p className="text-sm text-gray-500">
            {isResetMode
              ? "Укажите email, на который отправим инструкцию для восстановления."
              : "Заполните данные, чтобы продолжить или войдите через Google."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  isResetMode ? handleResetPassword() : handleLogin();
                }
              }}
            />
          </div>

          {!isResetMode && (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-gray-700" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                placeholder="Введите пароль"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLogin();
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {isResetMode ? (
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Отправляем..." : "Отправить письмо"}
            </button>
          ) : (
            <>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Загрузка..." : "Войти"}
              </button>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 border border-gray-200"
              >
                {loading ? "Подождите..." : "Войти через Google"}
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => {
              setError("");
              setMessage("");
              setIsResetMode((prev) => !prev);
            }}
            className="text-purple-600 font-medium hover:text-purple-700 transition"
          >
            {isResetMode ? "Вернуться к входу" : "Забыли пароль?"}
          </button>
          {!isResetMode && (
            <p>
              Нет аккаунта?{" "}
              <Link to="/register" className="text-purple-600 font-medium hover:text-purple-700 transition">
                Зарегистрироваться
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

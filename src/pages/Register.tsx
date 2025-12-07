import React, { useCallback, useState } from "react";
import { auth, db } from "../services/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

const extractDigits = (value: string) => value.replace(/\D/g, "");

const normalizePhoneDigits = (raw: string) => {
  const digits = extractDigits(raw);
  if (!digits) return "";
  const withoutLeading = digits.replace(/^8/, "").replace(/^7/, "");
  return (`8${withoutLeading}`).slice(0, 11);
};

const formatPhoneMasked = (digits: string) => {
  if (!digits) return "";
  let formatted = digits[0];
  const part1 = digits.slice(1, 4);
  const part2 = digits.slice(4, 7);
  const part3 = digits.slice(7, 9);
  const part4 = digits.slice(9, 11);

  if (part1) {
    formatted += ` (${part1}`;
    formatted += part1.length === 3 ? ")" : "";
  }
  if (part2) {
    formatted += part1.length === 3 ? ` ${part2}` : part2;
  }
  if (part3) {
    formatted += `-${part3}`;
  }
  if (part4) {
    formatted += `-${part4}`;
  }

  return formatted;
};

const validatePhone = (digits: string) => {
  if (!digits) return "Введите номер телефона.";
  if (digits.length !== 11) return "Номер должен содержать 11 цифр (например, 8 9XX XXX-XX-XX).";
  if (!digits.startsWith("8")) return "Номер должен начинаться с 8.";
  if (digits[1] !== "9") return "Введите мобильный номер, начинающийся с 89.";
  return "";
};

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const getFriendlyError = useCallback((code: string) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "Такой email уже зарегистрирован. Попробуйте войти или используйте другой адрес.";
      case "auth/invalid-email":
        return "Некорректный формат email. Проверьте адрес и попробуйте снова.";
      case "auth/weak-password":
        return "Слишком простой пароль. Добавьте больше символов и попробуйте снова.";
      case "auth/network-request-failed":
        return "Не удалось выполнить запрос. Проверьте подключение к интернету.";
      default:
        return "Не получилось создать аккаунт. Попробуйте еще раз позже.";
    }
  }, []);

  const handlePhoneChange = (value: string) => {
    const normalized = normalizePhoneDigits(value);
    setPhoneDigits(normalized);
    setPhone(normalized ? formatPhoneMasked(normalized) : "");
    if (phoneError) setPhoneError("");
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");
      setPhoneError("");

      if (!name.trim()) {
        setError("Введите ваше имя, чтобы мы знали, как к вам обращаться.");
        setLoading(false);
        return;
      }

      const phoneValidationError = validatePhone(phoneDigits);
      if (phoneValidationError) {
        setPhoneError(phoneValidationError);
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      // Создаем запись в Firestore с ролью "user" и телефоном
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name,
        email,
        phone: phoneDigits,
        role: "user",
        createdAt: new Date(),
      });
      navigate("/profile");
    } catch (err: any) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 sm:p-10 flex flex-col gap-5"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Регистрация</h2>
          <p className="text-sm text-gray-500">
            Создайте аккаунт, чтобы записываться, управлять расписанием и получать напоминания.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700" htmlFor="name">
              Имя
            </label>
            <input
              id="name"
              type="text"
              placeholder="Как к вам обращаться?"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRegister();
                }
              }}
            />
          </div>

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
                  handleRegister();
                }
              }}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              placeholder="Минимум 6 символов"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRegister();
                }
              }}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700" htmlFor="phone">
              Телефон <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="8 (9XX) XXX-XX-XX"
              className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                phoneError
                  ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-200 focus:border-purple-500 focus:ring-purple-200"
              }`}
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRegister();
                }
              }}
            />
            {phoneError && (
              <span className="text-xs text-red-600">{phoneError}</span>
            )}
            <p className="text-xs text-gray-500">
              Номер телефона необходим для связи с вами и подтверждения записи
            </p>
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Загрузка..." : "Зарегистрироваться"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-purple-600 font-medium hover:text-purple-700 transition">
            Войти
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;

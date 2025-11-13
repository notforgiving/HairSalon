import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../services/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { updateProfile, updateEmail } from "firebase/auth";

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

interface Appointment {
  id: string;
  hairdresserName: string;
  hairdresserAddress?: string;
  service?: string;
  date: string;
  time: string;
}

const ProfileUser: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "archive">("upcoming");
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [phoneDigits, setPhoneDigits] = useState<string>("");
  const [phoneError, setPhoneError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [mustFillPhone, setMustFillPhone] = useState(false);

  const handlePhoneChange = (value: string) => {
    const normalized = normalizePhoneDigits(value);
    setPhoneDigits(normalized);
    setPhone(normalized ? formatPhoneMasked(normalized) : "");
    if (phoneError) setPhoneError("");
  };

  useEffect(() => {
    if (!user) return;
    const fetchAppointments = async () => {
      const q = query(collection(db, "appointments"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const data: Appointment[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data);
    };
    fetchAppointments();
    setDisplayName(user.displayName || "");
    setEmail(user.email || "");
    // load phone from Firestore
    (async () => {
      const uref = doc(db, "users", user.uid);
      const u = await getDoc(uref);
      const p = (u.exists() && (u.data() as any).phone) || "";
      const normalized = normalizePhoneDigits(p);
      setPhoneDigits(normalized);
      setPhone(formatPhoneMasked(normalized));
      setMustFillPhone(!normalized);
    })();
  }, [user]);

  const handleCancel = async (id: string) => {
    if (!window.confirm("Вы уверены, что хотите отменить запись?")) return;
    await deleteDoc(doc(db, "appointments", id));
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    const validationError = validatePhone(phoneDigits);
    if (validationError) {
      setPhoneError(validationError);
      setMustFillPhone(true);
      return;
    }
    setPhoneError("");
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      if (email && email !== user.email) {
        await updateEmail(user, email);
      }
      await updateDoc(doc(db, "users", user.uid), { phone: phoneDigits });
      setMustFillPhone(false);
      alert("Профиль обновлен");
    } catch (e: any) {
      alert(e.message || "Ошибка сохранения профиля");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPhoneSave = async () => {
    if (!user) return;
    const validationError = validatePhone(phoneDigits);
    if (validationError) {
      setPhoneError(validationError);
      return;
    }
    setPhoneError("");
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { phone: phoneDigits });
      setMustFillPhone(false);
    } catch (e: any) {
      alert(e.message || "Ошибка сохранения телефона");
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(dt.getTime())) return `${date} ${time}`;
    return `${dt.toLocaleDateString("ru-RU")} ${dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const toDate = (a: Appointment) => new Date(`${a.date}T${a.time}:00`);
  const now = new Date();
  const upcoming = appointments.filter(a => toDate(a) >= now).sort((a, b) => toDate(a).getTime() - toDate(b).getTime());
  const archive = appointments.filter(a => toDate(a) < now).sort((a, b) => toDate(b).getTime() - toDate(a).getTime());

  return (
    <>
      <Navbar />
      <div className="p-6 grid gap-8">
        <div className="bg-white rounded-xl shadow p-4 max-w-xl">
          <h2 className="text-xl font-bold mb-4">Мой профиль</h2>
          <div className="grid gap-3">
            <input
              type="text"
              className="border p-2 rounded"
              placeholder="Имя"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
            <input
              type="email"
              className="border p-2 rounded"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <div className="grid gap-1">
              <input
                type="tel"
                inputMode="tel"
                className={`border p-2 rounded ${phoneError ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}`}
                placeholder="Телефон (обязательно)"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
              />
              {phoneError && <span className="text-xs text-red-500">{phoneError}</span>}
            </div>
            <button
              disabled={saving}
              onClick={handleSaveProfile}
              className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition w-fit"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Мои записи</h2>
          <div className="ml-auto flex gap-2">
            <button
              className={`px-3 py-1 rounded ${activeTab === "upcoming" ? "bg-primary text-white" : "bg-white border"}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Будущие
            </button>
            <button
              className={`px-3 py-1 rounded ${activeTab === "archive" ? "bg-primary text-white" : "bg-white border"}`}
              onClick={() => setActiveTab("archive")}
            >
              Архив
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {(activeTab === "upcoming" ? upcoming : archive).map(a => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{a.hairdresserName}</p>
                {a.service && <p>{a.service}</p>}
                {a.hairdresserAddress && <p className="text-gray-600 text-sm max-w-md">{a.hairdresserAddress}</p>}
                <p>{formatDateTime(a.date, a.time)}</p>
              </div>
              {activeTab === "upcoming" ? (
                <button
                  onClick={() => handleCancel(a.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Отменить
                </button>
              ) : null}
            </motion.div>
          ))}
          {(activeTab === "upcoming" ? upcoming : archive).length === 0 && (
            <div className="text-gray-500">Нет записей</div>
          )}
        </div>
      </div>

      {mustFillPhone && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm grid gap-4">
            <h3 className="text-lg font-bold text-center">Укажите номер телефона</h3>
            <p className="text-sm text-gray-600 text-center">
              Чтобы продолжить пользоваться сервисом, нам нужен ваш контактный номер.
            </p>
            <div className="grid gap-1">
              <input
                type="tel"
                inputMode="tel"
                className={`border p-2 rounded ${phoneError ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}`}
                placeholder="Телефон"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
              />
              {phoneError && <span className="text-xs text-red-500">{phoneError}</span>}
            </div>
            <button
              onClick={handleQuickPhoneSave}
              disabled={saving}
              className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition"
            >
              {saving ? "Сохранение..." : "Сохранить телефон"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileUser;

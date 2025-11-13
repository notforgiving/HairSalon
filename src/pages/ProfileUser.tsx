import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../services/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { updateProfile, updateEmail } from "firebase/auth";

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
  const [saving, setSaving] = useState(false);
  const [mustFillPhone, setMustFillPhone] = useState(false);

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
      setPhone(p);
      setMustFillPhone(!p);
    })();
  }, [user]);

  const handleCancel = async (id: string) => {
    if (!window.confirm("Вы уверены, что хотите отменить запись?")) return;
    await deleteDoc(doc(db, "appointments", id));
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!phone.trim()) {
      alert("Пожалуйста, укажите номер телефона");
      setMustFillPhone(true);
      return;
    }
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      if (email && email !== user.email) {
        await updateEmail(user, email);
      }
      await updateDoc(doc(db, "users", user.uid), { phone });
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
    if (!phone.trim()) {
      alert("Введите номер телефона");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { phone });
      setMustFillPhone(false);
    } catch (e: any) {
      alert(e.message || "Ошибка сохранения телефона");
    } finally {
      setSaving(false);
    }
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
            <input
              type="tel"
              className="border p-2 rounded"
              placeholder="Телефон (обязательно)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
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
                <p>{new Date(`${a.date}T${a.time}:00`).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
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
            <input
              type="tel"
              className="border p-2 rounded"
              placeholder="Телефон"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
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

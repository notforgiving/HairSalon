import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, query, where, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import CardHairdresser from "../components/CardHairdresser";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

interface Hairdresser {
  id: string;
  name: string;
  photoUrl?: string;
  address?: string;
}

const Home: React.FC = () => {
  const { user, role } = useAuth();
  const [hairdressers, setHairdressers] = useState<Hairdresser[]>([]);
  const [selected, setSelected] = useState<Hairdresser | null>(null);
  const [slots, setSlots] = useState<{ id: string; date: string; time: string }[]>([]);
  const [days, setDays] = useState<{ label: string; iso: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingError, setBookingError] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<{ id: string; date: string; time: string } | null>(null);

  const loadSlotsForHairdresser = async (hairdresser: Hairdresser) => {
    setSelected(hairdresser);
    setSelectedSlot(null);
    setBookingError("");
    setLoadingSlots(true);
    try {
      const qSlots = query(
        collection(db, "slots"),
        where("specialistId", "==", hairdresser.id),
        where("booked", "==", false)
      );
      const snap = await getDocs(qSlots);
      const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setSlots(data);
    } catch (e: any) {
      setBookingError(e.message || "Не удалось загрузить слоты");
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    const fetchHairdressers = async () => {
      const snapshot = await getDocs(collection(db, "hairdressers"));
      const data: Hairdresser[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hairdresser));
      setHairdressers(data);
      if (data.length > 0) {
        loadSlotsForHairdresser(data[0]);
      } else {
        setSelected(null);
        setSlots([]);
      }
    };
    fetchHairdressers();

    const today = new Date();
    const list: { label: string; iso: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("ru-RU", { weekday: "short", day: "2-digit", month: "2-digit" });
      list.push({ iso, label });
    }
    setDays(list);
  }, []);

  const bookSelectedSlot = async () => {
    if (!user || role !== "user" || !selected || !selectedSlot) {
      setBookingError("Только авторизованные пользователи могут бронировать");
      return;
    }
    const slot = selectedSlot;
    const confirmText = `Записаться к ${selected.name} на ${slot.date} ${slot.time}?`;
    if (!window.confirm(confirmText)) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userPhone = userDoc.exists() ? (userDoc.data() as any).phone || "" : "";
      await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        userPhone,
        specialistId: selected.id,
        hairdresserName: selected.name,
        hairdresserAddress: selected.address || "",
        date: slot.date,
        time: slot.time,
        slotId: slot.id,
        createdAt: new Date()
      });
      await updateDoc(doc(db, "slots", slot.id), { booked: true, userId: user.uid });
      alert("Вы успешно записались!");
      setSelected(null);
      setSelectedSlot(null);
    } catch (e: any) {
      setBookingError(e.message || "Ошибка бронирования");
    }
  };

  return (
    <>
      <Navbar />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 grid gap-4">
            {hairdressers.map(h => (
              <button
                key={h.id}
                onClick={() => loadSlotsForHairdresser(h)}
                className="text-left"
              >
                <CardHairdresser name={h.name} photoUrl={h.photoUrl} isActive={selected?.id === h.id} />
              </button>
            ))}
            {hairdressers.length === 0 && <div className="text-gray-500">Специалисты пока не добавлены</div>}
          </div>

          <div className="lg:col-span-2">
            {!selected ? (
              <div className="text-gray-600">Выберите специалиста слева, чтобы увидеть доступные слоты</div>
            ) : (
              <div className="bg-white rounded-xl shadow p-4 space-y-4">
                <div>
                  <h3 className="text-xl font-bold">Доступные окошки — {selected.name}</h3>
                  {selected.address && (
                    <p className="text-sm text-gray-600 mt-1">Адрес: {selected.address}</p>
                  )}
                </div>
                {loadingSlots ? (
                  <p>Загрузка слотов...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {days.map(d => (
                      <div key={d.iso} className="border rounded-lg p-3">
                        <div className="text-sm text-gray-600 mb-2">{d.label}</div>
                        <div className="grid gap-2">
                          {slots.filter(s => s.date === d.iso).length === 0 ? (
                            <span className="text-xs text-gray-400">Нет слотов</span>
                          ) : (
                            slots
                              .filter(s => s.date === d.iso)
                              .sort((a, b) => a.time.localeCompare(b.time))
                              .map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => setSelectedSlot(s)}
                                  className={`text-sm border rounded px-2 py-1 transition ${
                                    selectedSlot?.id === s.id ? "bg-primary text-white border-primary" : "hover:bg-accent"
                                  }`}
                                >
                                  {s.time}
                                </button>
                              ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedSlot && (
                  <div className="mt-4">
                    <button
                      onClick={bookSelectedSlot}
                      className="w-full sm:w-auto bg-primary text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition"
                    >
                      Записаться на {selectedSlot.date} в {selectedSlot.time}
                    </button>
                  </div>
                )}
                {bookingError && <p className="text-red-500 mt-3">{bookingError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

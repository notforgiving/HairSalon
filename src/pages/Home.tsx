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
  vacation?: { from?: string; to?: string } | null;
}

const formatDateLabel = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
};

const formatDateTime = (date: string, time: string) => {
  const dt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(dt.getTime())) return `${date} ${time}`;
  return `${dt.toLocaleDateString("ru-RU")} ${dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
};

const getVacationStatus = (hairdresser?: Hairdresser | null) => {
  const empty = {
    active: false,
    upcoming: false,
    from: undefined as string | undefined,
    to: undefined as string | undefined,
    daysUntilStart: undefined as number | undefined,
    daysUntilEnd: undefined as number | undefined
  };
  if (!hairdresser?.vacation?.from || !hairdresser.vacation?.to) return empty;

  const startRaw = hairdresser.vacation.from;
  const endRaw = hairdresser.vacation.to;
  const start = new Date(startRaw);
  const end = new Date(endRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return empty;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  const msDay = 1000 * 60 * 60 * 24;

  if (todayStart >= startDay && todayStart <= endDay) {
    const daysUntilEnd = Math.max(0, Math.ceil((endDay.getTime() - todayStart.getTime()) / msDay));
    return {
      active: true,
      upcoming: false,
      from: startRaw,
      to: endRaw,
      daysUntilStart: 0,
      daysUntilEnd
    };
  }

  if (todayStart < startDay) {
    const diff = Math.ceil((startDay.getTime() - todayStart.getTime()) / msDay);
    if (diff <= 14) {
      return {
        active: false,
        upcoming: true,
        from: startRaw,
        to: endRaw,
        daysUntilStart: diff,
        daysUntilEnd: undefined
      };
    }
  }

  return {
    active: false,
    upcoming: false,
    from: startRaw,
    to: endRaw,
    daysUntilStart: undefined,
    daysUntilEnd: undefined
  };
};

const isDayInVacation = (hairdresser: Hairdresser | null, isoDate: string) => {
  if (!hairdresser?.vacation?.from || !hairdresser.vacation?.to) return false;
  const date = new Date(isoDate);
  const start = new Date(hairdresser.vacation.from);
  const end = new Date(hairdresser.vacation.to);
  if (Number.isNaN(date.getTime()) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  const vacationStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const vacationEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  return dayEnd >= vacationStart && dayStart <= vacationEnd;
};

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

    const vacationStatus = getVacationStatus(hairdresser);
    if (vacationStatus.active) {
      setSlots([]);
      setLoadingSlots(false);
      return;
    }

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

  useEffect(() => {
    if (!selected) return;
    const updated = hairdressers.find(h => h.id === selected.id);
    if (updated && updated !== selected) {
      loadSlotsForHairdresser(updated);
    }
  }, [hairdressers]);

  const bookSelectedSlot = async () => {
    if (!user || role !== "user" || !selected || !selectedSlot) {
      setBookingError("Только авторизованные пользователи могут бронировать");
      return;
    }
    const slot = selectedSlot;
    const confirmText = `Записаться к ${selected.name} на ${formatDateTime(slot.date, slot.time)}?`;
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
      setSelectedSlot(null);
      loadSlotsForHairdresser(selected);
    } catch (e: any) {
      setBookingError(e.message || "Ошибка бронирования");
    }
  };

  const handleSlotClick = (slot: { id: string; date: string; time: string }) => {
    setSelectedSlot(prev => (prev?.id === slot.id ? null : slot));
  };

  const vacationStatus = getVacationStatus(selected);

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
            ) : vacationStatus.active ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 text-white p-6"
              >
                <div className="absolute inset-0 bg-white/10 blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                  <span className="text-4xl">🌴</span>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold">{selected.name} сейчас в отпуске</h3>
                    <p className="text-sm text-white/85">
                      Мастер недоступен с {formatDateLabel(vacationStatus.from!)} по {formatDateLabel(vacationStatus.to!)}.
                      Выберите другого мастера или попробуйте записаться позже.
                    </p>
                    {typeof vacationStatus.daysUntilEnd === "number" && (
                      <p className="text-sm text-white/70">
                        Возвращается через {vacationStatus.daysUntilEnd} {vacationStatus.daysUntilEnd === 1 ? "день" : "дней"}.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-xl shadow p-4 space-y-4">
                <div className="flex flex-col gap-2">
                  <div>
                    <h3 className="text-xl font-bold">Доступные окошки — {selected.name}</h3>
                    {selected.address && (
                      <p className="text-sm text-gray-600 mt-1">Адрес: {selected.address}</p>
                    )}
                  </div>
                  {vacationStatus.upcoming && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 flex items-start gap-3">
                      <span className="text-2xl">🌞</span>
                      <div className="space-y-1">
                        <p className="font-medium">
                          Отпуск через {vacationStatus.daysUntilStart} {vacationStatus.daysUntilStart === 1 ? "день" : "дней"}
                        </p>
                        <p className="text-sm text-amber-600">
                          Мастер будет недоступен с {formatDateLabel(vacationStatus.from!)} по {formatDateLabel(vacationStatus.to!)}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {loadingSlots ? (
                  <p>Загрузка слотов...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {days.map(d => {
                      const isVacationDay = isDayInVacation(selected, d.iso);
                      const filteredSlots = slots
                        .filter(s => {
                          if (s.date !== d.iso) return false;
                          if (!selected || !selected.vacation?.from || !selected.vacation?.to) return true;
                          const slotDate = new Date(`${s.date}T${s.time}`);
                          const vacStart = new Date(selected.vacation.from);
                          const vacEnd = new Date(selected.vacation.to);
                          return slotDate < vacStart || slotDate > vacEnd;
                        })
                        .sort((a, b) => a.time.localeCompare(b.time));
                      return (
                        <div
                          key={d.iso}
                          className={`border rounded-lg p-3 ${isVacationDay ? "border-amber-300 bg-amber-50" : ""}`}
                        >
                          <div className={`text-sm mb-2 ${isVacationDay ? "text-amber-700 font-medium" : "text-gray-600"}`}>
                            {d.label}{isVacationDay ? " · отпуск" : ""}
                          </div>
                          <div className="grid gap-2">
                            {isVacationDay ? (
                              <span className="text-xs text-amber-600">Мастер в отпуске</span>
                            ) : filteredSlots.length === 0 ? (
                              <span className="text-xs text-gray-400">Нет слотов</span>
                            ) : (
                              filteredSlots.map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => handleSlotClick(s)}
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
                      );
                    })}
                  </div>
                )}
                {selectedSlot && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                    <button
                      onClick={bookSelectedSlot}
                      className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition"
                    >
                      Записаться на {formatDateTime(selectedSlot.date, selectedSlot.time)}
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

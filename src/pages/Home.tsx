import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import HairdresserList from "../components/home/HairdresserList";
import HairdresserListSkeleton from "../components/home/HairdresserListSkeleton";
import SlotsGrid from "../components/home/SlotsGrid";
import { ActiveVacationBanner, UpcomingVacationBanner } from "../components/home/VacationBanner";
import { db } from "../services/firebase";
import { useHairdressers } from "../hooks/useHairdressers";
import { useHairdresserSlots } from "../hooks/useHairdresserSlots";
import { useAuth } from "../context/AuthContext";
import { Hairdresser, Slot } from "../types";
import { formatDateTime } from "../utils/date";
import { getVacationStatus } from "../utils/vacation";

interface DayItem {
  iso: string;
  label: string;
}

const buildNextDays = (count = 14): DayItem[] => {
  const today = new Date();
  return Array.from({ length: count }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("ru-RU", { weekday: "short", day: "2-digit", month: "2-digit" });
    return { iso, label };
  });
};

const Home: React.FC = () => {
  const { user, role } = useAuth();
  const { hairdressers, loading: hairdressersLoading } = useHairdressers();
  const [selectedHairdresserId, setSelectedHairdresserId] = useState<string | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const days = useMemo(() => buildNextDays(), []);

  const selectedHairdresser = useMemo<Hairdresser | null>(() => {
    if (!selectedHairdresserId) return null;
    return hairdressers.find(h => h.id === selectedHairdresserId) ?? null;
  }, [hairdressers, selectedHairdresserId]);

  const { slots, loading: slotsLoading, refresh: refreshSlots } = useHairdresserSlots({
    hairdresserId: selectedHairdresser?.id
  });

  useEffect(() => {
    if (hairdressersLoading) return;

    if (hairdressers.length === 0) {
      setSelectedHairdresserId(undefined);
      setSelectedSlot(null);
      return;
    }
    if (!selectedHairdresserId || !hairdressers.some(h => h.id === selectedHairdresserId)) {
      setSelectedHairdresserId(hairdressers[0].id);
      setSelectedSlot(null);
    }
  }, [hairdressers, selectedHairdresserId, hairdressersLoading]);

  const vacationStatus = useMemo(() => getVacationStatus(selectedHairdresser), [selectedHairdresser]);

  const handleSelectHairdresser = (hairdresser: Hairdresser) => {
    setSelectedHairdresserId(hairdresser.id);
    setSelectedSlot(null);
  };

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(prev => (prev?.id === slot.id ? null : slot));
  };

  const handleBook = async () => {
    if (!user || role !== "user" || !selectedHairdresser || !selectedSlot) {
      alert("Только авторизованные пользователи могут бронировать");
      return;
    }

    const confirmation = window.confirm(
      `Записаться к ${selectedHairdresser.name} на ${formatDateTime(selectedSlot.date, selectedSlot.time)}?`
    );
    if (!confirmation) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userPhone = userDoc.exists() ? (userDoc.data() as any).phone || "" : "";

      await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        userPhone,
        specialistId: selectedHairdresser.id,
        hairdresserName: selectedHairdresser.name,
        hairdresserAddress: selectedHairdresser.address || "",
        date: selectedSlot.date,
        time: selectedSlot.time,
        slotId: selectedSlot.id,
        createdAt: new Date()
      });
      await updateDoc(doc(db, "slots", selectedSlot.id), { booked: true, userId: user.uid });

      alert("Вы успешно записались!");
      setSelectedSlot(null);
      await refreshSlots();
    } catch (error: any) {
      alert(error.message || "Ошибка бронирования");
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1">
            {hairdressersLoading ? (
              <HairdresserListSkeleton />
            ) : (
              <HairdresserList
                hairdressers={hairdressers}
                selectedId={selectedHairdresserId}
                onSelect={handleSelectHairdresser}
              />
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {hairdressersLoading && !selectedHairdresser ? (
              <div className="bg-white rounded-xl shadow p-6 animate-pulse space-y-4">
                <div className="h-5 bg-slate-200 rounded w-2/5" />
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-3">
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                      <div className="h-8 bg-slate-100 rounded" />
                      <div className="h-8 bg-slate-100 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ) : !selectedHairdresser ? (
              <div className="text-gray-600">Выберите специалиста слева, чтобы увидеть доступные слоты</div>
            ) : vacationStatus.active ? (
              <ActiveVacationBanner status={vacationStatus} />
            ) : (
              <div className="bg-white rounded-xl shadow p-4 space-y-4">
                <div className="flex flex-col gap-2">
                  <div>
                    <h3 className="text-xl font-bold">Доступные окошки — {selectedHairdresser.name}</h3>
                    {selectedHairdresser.address && (
                      <p className="text-sm text-gray-600 mt-1">Адрес: {selectedHairdresser.address}</p>
                    )}
                  </div>
                  <UpcomingVacationBanner status={vacationStatus} />
                </div>

                {slotsLoading ? (
                  <p>Загрузка слотов...</p>
                ) : (
                  <SlotsGrid
                    days={days}
                    slots={slots}
                    selectedHairdresser={selectedHairdresser}
                    selectedSlotId={selectedSlot?.id}
                    onSelectSlot={handleSlotClick}
                  />
                )}

                {selectedSlot && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                    <button
                      onClick={handleBook}
                      className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition"
                    >
                      Записаться на {formatDateTime(selectedSlot.date, selectedSlot.time)}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;

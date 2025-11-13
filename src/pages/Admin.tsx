import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import Navbar from "../components/Navbar";
import AppointmentsTab from "../components/admin/AppointmentsTab";
import { db } from "../services/firebase";
import { Appointment, Hairdresser, Slot, UserProfile } from "../types";
import { downloadAppointmentsCsv } from "../utils/csv";
import { formatDate, formatDateTime } from "../utils/date";

const roles = ["user", "admin"] as const;

type AdminTab = "appointments" | "schedule" | "people";

const Admin: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [hairdressers, setHairdressers] = useState<Hairdresser[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [hName, setHName] = useState("");
  const [hAddress, setHAddress] = useState("");
  const [hPhotoUrl, setHPhotoUrl] = useState<string>("");
  const [savingHairdresser, setSavingHairdresser] = useState(false);

  const [selectedHairdresserId, setSelectedHairdresserId] = useState<string>("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [stepMinutes, setStepMinutes] = useState(30);
  const [weekdays, setWeekdays] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [generatingSlots, setGeneratingSlots] = useState(false);

  const [vacationFrom, setVacationFrom] = useState("");
  const [vacationTo, setVacationTo] = useState("");
  const [savingVacation, setSavingVacation] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [usersError, setUsersError] = useState<string>("");

  const [hairdresserSearch, setHairdresserSearch] = useState("");

  const [activeTab, setActiveTab] = useState<AdminTab>("appointments");

  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const [editingUserPhone, setEditingUserPhone] = useState("");
  const [editingUserAddress, setEditingUserAddress] = useState("");
  const [editingUserSaving, setEditingUserSaving] = useState(false);

  const [editingHairdresser, setEditingHairdresser] = useState<Hairdresser | null>(null);
  const [editingHairdresserName, setEditingHairdresserName] = useState("");
  const [editingHairdresserAddress, setEditingHairdresserAddress] = useState("");
  const [editingHairdresserPhoto, setEditingHairdresserPhoto] = useState("");
  const [editingHairdresserSaving, setEditingHairdresserSaving] = useState(false);

  const [slotsModalOpen, setSlotsModalOpen] = useState(false);
  const [slotsModalHairdresserId, setSlotsModalHairdresserId] = useState<string | null>(null);
  const [slotsList, setSlotsList] = useState<Slot[]>([]);
  const [selectedSlotsModal, setSelectedSlotsModal] = useState<Set<string>>(new Set());
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [deletingHairdresser, setDeletingHairdresser] = useState<Hairdresser | null>(null);

  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const data: UserProfile[] = snapshot.docs.map(docSnap => ({
        uid: docSnap.id,
        ...(docSnap.data() as Omit<UserProfile, "uid">)
      }));
      setUsers(data);
      setUsersError("");
    } catch (error: any) {
      console.error("Ошибка загрузки пользователей", error);
      setUsers([]);
      setUsersError("Не удалось загрузить пользователей. Проверьте права доступа к Firestore.");
    }
  };

  const loadHairdressers = async () => {
    const snap = await getDocs(collection(db, "hairdressers"));
    const data: Hairdresser[] = snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Hairdresser, "id">)
    }));
    setHairdressers(data);
  };

  const loadAppointments = async () => {
    const snap = await getDocs(collection(db, "appointments"));
    const data: Appointment[] = snap.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Appointment, "id">)
    }));
    setAppointments(data);
  };

  useEffect(() => {
    loadUsers();
    loadHairdressers();
    loadAppointments();
  }, []);

  useEffect(() => {
    const current = hairdressers.find(h => h.id === selectedHairdresserId);
    setVacationFrom(current?.vacation?.from || "");
    setVacationTo(current?.vacation?.to || "");
  }, [selectedHairdresserId, hairdressers]);

  const handleChangeRole = async (uid: string, role: string) => {
    await updateDoc(doc(db, "users", uid), { role });
    setUsers(prev => prev.map(user => (user.uid === uid ? { ...user, role } : user)));
  };

  const handleAddHairdresser = async () => {
    if (!hName || !hAddress) {
      alert("Заполните имя и адрес");
      return;
    }
    setSavingHairdresser(true);
    try {
      await addDoc(collection(db, "hairdressers"), {
        name: hName,
        address: hAddress,
        photoUrl: hPhotoUrl || ""
      });
      setHName("");
      setHAddress("");
      setHPhotoUrl("");
      await loadHairdressers();
      alert("Парикмахер сохранен");
    } catch (error: any) {
      alert(error.message || "Ошибка сохранения");
    } finally {
      setSavingHairdresser(false);
    }
  };

  const openEditUser = async (user: UserProfile) => {
    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      const data = snapshot.data() as UserProfile | undefined;
      setEditingUser({ ...user, phone: data?.phone || "", address: data?.address || "" });
      setEditingUserName(user.name || "");
      setEditingUserPhone(data?.phone || "");
      setEditingUserAddress(data?.address || "");
    } catch (error) {
      alert("Не удалось загрузить данные пользователя");
    }
  };

  const handleSaveEditingUser = async () => {
    if (!editingUser) return;
    setEditingUserSaving(true);
    try {
      await updateDoc(doc(db, "users", editingUser.uid), {
        name: editingUserName,
        phone: editingUserPhone,
        address: editingUserAddress
      });
      await loadUsers();
      setEditingUser(null);
    } catch (error: any) {
      alert(error.message || "Ошибка сохранения профиля пользователя");
    } finally {
      setEditingUserSaving(false);
    }
  };

  const openEditHairdresser = async (hairdresser: Hairdresser) => {
    try {
      const snapshot = await getDoc(doc(db, "hairdressers", hairdresser.id));
      const data = snapshot.data() as Omit<Hairdresser, "id"> | undefined;
      if (!data) return;
      setEditingHairdresser({ id: hairdresser.id, ...data });
      setEditingHairdresserName(data.name || "");
      setEditingHairdresserAddress(data.address || "");
      setEditingHairdresserPhoto(data.photoUrl || "");
    } catch (error) {
      alert("Не удалось загрузить данные специалиста");
    }
  };

  const handleSaveEditingHairdresser = async () => {
    if (!editingHairdresser) return;
    setEditingHairdresserSaving(true);
    try {
      await updateDoc(doc(db, "hairdressers", editingHairdresser.id), {
        name: editingHairdresserName,
        address: editingHairdresserAddress,
        photoUrl: editingHairdresserPhoto
      });
      await loadHairdressers();
      setEditingHairdresser(null);
    } catch (error: any) {
      alert(error.message || "Ошибка сохранения специалиста");
    } finally {
      setEditingHairdresserSaving(false);
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    if (!window.confirm("Отменить запись и освободить слот?")) return;
    try {
      if (appointment.slotId) {
        await updateDoc(doc(db, "slots", appointment.slotId), { booked: false, userId: null });
      }
      await deleteDoc(doc(db, "appointments", appointment.id));
      setAppointments(prev => prev.filter(item => item.id !== appointment.id));
      alert("Запись отменена");
    } catch (error: any) {
      alert(error.message || "Ошибка отмены");
    }
  };

  const handleExportAppointments = () => {
    downloadAppointmentsCsv(appointments);
  };

  const handleSaveVacation = async () => {
    if (!selectedHairdresserId) return;
    const from = vacationFrom.trim();
    const to = vacationTo.trim();
    if (!from || !to) {
      alert(`Укажите даты начала и окончания отпуска. Сейчас: начало — ${from || "не выбрано"}, конец — ${to || "не выбрано"}`);
      return;
    }
    setSavingVacation(true);
    try {
      await updateDoc(doc(db, "hairdressers", selectedHairdresserId), {
        vacation: { from, to }
      });
      await loadHairdressers();
      alert("Отпуск сохранен");
    } catch (error: any) {
      alert(error.message || "Не удалось сохранить отпуск");
    } finally {
      setSavingVacation(false);
    }
  };

  const handleClearVacation = async () => {
    if (!selectedHairdresserId) return;
    setSavingVacation(true);
    try {
      await updateDoc(doc(db, "hairdressers", selectedHairdresserId), {
        vacation: null
      });
      await loadHairdressers();
      setVacationFrom("");
      setVacationTo("");
      alert("Отпуск снят");
    } catch (error: any) {
      alert(error.message || "Не удалось снять отпуск");
    } finally {
      setSavingVacation(false);
    }
  };

  const handleGenerateSlots = async () => {
    if (!selectedHairdresserId) {
      alert("Выберите специалиста");
      return;
    }
    if (!rangeFrom || !rangeTo) {
      alert("Укажите период генерации");
      return;
    }
    const fromDate = new Date(rangeFrom);
    const toDate = new Date(rangeTo);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      alert("Некорректные даты периода");
      return;
    }
    if (fromDate > toDate) {
      alert("Дата начала периода не может быть позже даты окончания");
      return;
    }
    if (!stepMinutes || stepMinutes <= 0) {
      alert("Шаг должен быть больше нуля");
      return;
    }
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    if (Number.isNaN(startTotalMinutes) || Number.isNaN(endTotalMinutes) || endTotalMinutes <= startTotalMinutes) {
      alert("Проверьте время начала и окончания");
      return;
    }
    if (!Object.values(weekdays).some(Boolean)) {
      alert("Выберите хотя бы один день недели");
      return;
    }

    setGeneratingSlots(true);
    try {
      const existingSnapshot = await getDocs(query(collection(db, "slots"), where("specialistId", "==", selectedHairdresserId)));
      const existingKeys = new Set(
        existingSnapshot.docs.map(docSnap => {
          const data = docSnap.data() as Omit<Slot, "id">;
          return `${data.date}-${data.time}`;
        })
      );

      const currentHairdresser = hairdressers.find(h => h.id === selectedHairdresserId);
      const vacationStart = currentHairdresser?.vacation?.from ? new Date(currentHairdresser.vacation.from) : null;
      const vacationEnd = currentHairdresser?.vacation?.to ? new Date(currentHairdresser.vacation.to) : null;

      const slotsToCreate: Omit<Slot, "id">[] = [];
      const walker = new Date(fromDate);
      while (walker <= toDate) {
        const dayOfWeek = walker.getDay();
        if (weekdays[dayOfWeek]) {
          const dayString = walker.toISOString().slice(0, 10);
          const isVacationDay =
            vacationStart && vacationEnd && !Number.isNaN(vacationStart.getTime()) && !Number.isNaN(vacationEnd.getTime())
              ? walker >= vacationStart && walker <= vacationEnd
              : false;

          if (!isVacationDay) {
            for (let minutes = startTotalMinutes; minutes < endTotalMinutes; minutes += stepMinutes) {
              const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
              const mins = String(minutes % 60).padStart(2, "0");
              const timeString = `${hours}:${mins}`;
              const key = `${dayString}-${timeString}`;
              if (!existingKeys.has(key)) {
                existingKeys.add(key);
                slotsToCreate.push({
                  specialistId: selectedHairdresserId,
                  date: dayString,
                  time: timeString,
                  booked: false
                });
              }
            }
          }
        }
        walker.setDate(walker.getDate() + 1);
      }

      if (slotsToCreate.length === 0) {
        alert("Под заданные условия новые слоты не найдены");
        return;
      }

      await Promise.all(slotsToCreate.map(payload => addDoc(collection(db, "slots"), payload)));
      alert(`Создано новых слотов: ${slotsToCreate.length}`);
      if (slotsModalOpen) {
        await refreshSlots();
      }
    } catch (error: any) {
      alert(error.message || "Не удалось сгенерировать слоты");
    } finally {
      setGeneratingSlots(false);
    }
  };

  const openSlotsModal = async (id?: string) => {
    const targetId = id ?? selectedHairdresserId;
    if (!targetId) return;
    try {
      const snapshot = await getDocs(query(collection(db, "slots"), where("specialistId", "==", targetId)));
      const list: Slot[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Slot, "id">)
      }));
      setSlotsList(list);
      setSelectedSlotsModal(new Set());
      setSlotsModalHairdresserId(targetId);
      setSlotsModalOpen(true);
    } catch (error) {
      alert("Не удалось загрузить слоты");
    }
  };

  const refreshSlots = async () => {
    if (!slotsModalHairdresserId) return;
    const snapshot = await getDocs(query(collection(db, "slots"), where("specialistId", "==", slotsModalHairdresserId)));
    const list: Slot[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Slot, "id">)
    }));
    setSlotsList(list);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm("Удалить слот?")) return;
    setDeletingSlotId(slotId);
    try {
      await deleteDoc(doc(db, "slots", slotId));
      setSlotsList(prev => prev.filter(slot => slot.id !== slotId));
      await refreshSlots();
      alert("Слот удален");
    } catch (error: any) {
      alert(error.message || "Не удалось удалить слот");
    } finally {
      setDeletingSlotId(null);
    }
  };

  const handleBulkDeleteSlots = async () => {
    if (selectedSlotsModal.size === 0) return;
    if (!window.confirm("Удалить выбранные слоты?")) return;
    try {
      const toRemove = Array.from(selectedSlotsModal);
      await Promise.all(toRemove.map(slotId => deleteDoc(doc(db, "slots", slotId))));
      setSlotsList(prev => prev.filter(slot => !selectedSlotsModal.has(slot.id)));
      setSelectedSlotsModal(new Set());
      await refreshSlots();
      alert("Выбранные слоты удалены");
    } catch (error: any) {
      alert(error.message || "Не удалось удалить слоты");
    }
  };

  const handleDeleteHairdresser = async (hairdresser: Hairdresser) => {
    if (!window.confirm(`Удалить специалиста ${hairdresser.name}?`)) return;
    setDeletingHairdresser(hairdresser);
    try {
      await deleteDoc(doc(db, "hairdressers", hairdresser.id));
      const snapshot = await getDocs(query(collection(db, "slots"), where("specialistId", "==", hairdresser.id)));
      await Promise.all(snapshot.docs.map(docSnap => deleteDoc(docSnap.ref)));
      await loadHairdressers();
      if (selectedHairdresserId === hairdresser.id) {
        setSelectedHairdresserId("");
      }
      alert("Специалист удален");
    } catch (error: any) {
      alert(error.message || "Не удалось удалить специалиста");
    } finally {
      setDeletingHairdresser(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return users;
    return users.filter(user => `${user.name || ""} ${user.email}`.toLowerCase().includes(term));
  }, [users, userSearch]);

  const filteredHairdressers = useMemo(() => {
    const term = hairdresserSearch.trim().toLowerCase();
    if (!term) return hairdressers;
    return hairdressers.filter(hairdresser => `${hairdresser.name || ""} ${hairdresser.address || ""}`.toLowerCase().includes(term));
  }, [hairdressers, hairdresserSearch]);

  const selectedHairdresser = useMemo(
    () => hairdressers.find(hairdresser => hairdresser.id === selectedHairdresserId),
    [hairdressers, selectedHairdresserId]
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "appointments":
        return (
          <AppointmentsTab
            appointments={appointments}
            onCancel={handleCancelAppointment}
            onExport={handleExportAppointments}
          />
        );
      case "schedule":
        return (
          <section className="card-surface p-5 sm:p-6 space-y-4">
            <h3 className="text-xl font-semibold">Рабочие часы и генерация слотов</h3>
            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-sm text-slate-500">Специалист</label>
                  <select
                    className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={selectedHairdresserId}
                    onChange={e => setSelectedHairdresserId(e.target.value)}
                  >
                    <option value="">Выберите специалиста</option>
                    {hairdressers.map(hairdresser => (
                      <option key={hairdresser.id} value={hairdresser.id}>
                        {hairdresser.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-sm text-slate-500">Шаг (минуты)</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={stepMinutes}
                    onChange={e => setStepMinutes(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-1">
                  <label className="text-sm text-slate-500">Начало</label>
                  <input
                    type="time"
                    className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm text-slate-500">Конец</label>
                  <input
                    type="time"
                    className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-sm text-slate-500">Дни недели</label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setWeekdays(prev => ({ ...prev, [day]: !prev[day] }))}
                        className={`px-3 py-1 rounded-full border text-sm transition ${
                          weekdays[day] ? "bg-primary text-white border-primary" : "border-slate-200 bg-white/80"
                        }`}
                      >
                        {"ПнВтСрЧтПтСбВс".match(/.{1,2}/g)?.[day === 0 ? 6 : day - 1]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-1">
                  <label className="text-sm text-slate-500">С даты</label>
                  <input
                    type="date"
                    className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={rangeFrom}
                    onChange={e => setRangeFrom(e.target.value)}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm text-slate-500">По дату</label>
                  <input
                    type="date"
                    className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={rangeTo}
                    onChange={e => setRangeTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="grid gap-1">
                  <label className="text-sm text-slate-500">Отпуск с</label>
                  <input
                    type="date"
                    className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={vacationFrom}
                    onChange={e => setVacationFrom(e.target.value)}
                    disabled={!selectedHairdresserId}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm text-slate-500">Отпуск по</label>
                  <input
                    type="date"
                    className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={vacationTo}
                    onChange={e => setVacationTo(e.target.value)}
                    disabled={!selectedHairdresserId}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleGenerateSlots}
                  disabled={!selectedHairdresserId || generatingSlots}
                  className="px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-purple-700 transition disabled:opacity-60"
                >
                  {generatingSlots ? "Генерация..." : "Сохранить часы и сгенерировать слоты"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveVacation}
                  disabled={!selectedHairdresserId || savingVacation}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition disabled:opacity-60"
                >
                  {savingVacation ? "Сохранение..." : "Сохранить отпуск"}
                </button>
                <button
                  type="button"
                  onClick={handleClearVacation}
                  disabled={!selectedHairdresserId || savingVacation || !selectedHairdresser?.vacation?.from}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition disabled:opacity-60"
                >
                  Снять отпуск
                </button>
                <button
                  type="button"
                  onClick={() => openSlotsModal(selectedHairdresserId)}
                  disabled={!selectedHairdresserId}
                  className="px-3 py-1.5 rounded-xl border border-primary text-primary hover:bg-primary hover:text-white transition disabled:opacity-60"
                >
                  Просмотреть / удалить слоты
                </button>
              </div>

              {selectedHairdresser?.vacation?.from && selectedHairdresser?.vacation?.to && (
                <div className="text-sm text-slate-500">
                  Текущий отпуск: {formatDate(selectedHairdresser.vacation.from)} — {formatDate(selectedHairdresser.vacation.to)}
                </div>
              )}
            </div>
          </section>
        );
      case "people":
        return (
          <div className="space-y-8">
            <section className="card-surface p-5 sm:p-6 space-y-4">
              <h3 className="text-xl font-semibold">Добавить специалиста</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <input
                  type="text"
                  placeholder="Имя"
                  className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={hName}
                  onChange={e => setHName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Полный адрес (улица, дом, офис)"
                  className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 sm:col-span-2 lg:col-span-3"
                  value={hAddress}
                  onChange={e => setHAddress(e.target.value)}
                />
                <input
                  type="url"
                  placeholder="Ссылка на фото (опционально)"
                  className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 sm:col-span-2 lg:col-span-3"
                  value={hPhotoUrl}
                  onChange={e => setHPhotoUrl(e.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={savingHairdresser}
                onClick={handleAddHairdresser}
                className="inline-flex items-center justify-center bg-primary text-white px-5 py-2.5 rounded-2xl hover:bg-purple-700 transition shadow shadow-primary/30 disabled:opacity-60"
              >
                {savingHairdresser ? "Сохранение..." : "Добавить парикмахера"}
              </button>
            </section>

            <section className="card-surface p-5 sm:p-6 space-y-4">
              <h3 className="text-xl font-semibold">Список специалистов</h3>
              <input
                type="text"
                placeholder="Поиск по имени или адресу"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={hairdresserSearch}
                onChange={e => setHairdresserSearch(e.target.value)}
              />
              <div className="grid gap-3">
                {filteredHairdressers.length === 0 && (
                  <div className="text-sm text-slate-500">Специалисты не найдены</div>
                )}
                {filteredHairdressers.map(hairdresser => (
                  <div
                    key={hairdresser.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-sm sm:text-base truncate">{hairdresser.name || "Без имени"}</p>
                      {hairdresser.address && <p className="text-xs text-slate-500 truncate">{hairdresser.address}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditHairdresser(hairdresser)}
                        className="px-3 py-1.5 rounded-xl border border-primary text-primary text-sm hover:bg-primary hover:text-white transition"
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHairdresser(hairdresser)}
                        className="px-3 py-1.5 rounded-xl border border-red-400 text-red-500 text-sm hover:bg-red-500 hover:text-white transition"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card-surface p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-xl font-semibold">Пользователи и роли</h3>
                <span className="text-sm text-slate-500">Всего: {users.length}</span>
              </div>
              {usersError && (
                <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                  {usersError}
                </div>
              )}
              <input
                type="text"
                placeholder="Поиск пользователя по имени или email"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <div className="grid gap-3">
                {filteredUsers.length === 0 && (
                  <div className="text-sm text-slate-500">Пользователей не найдено</div>
                )}
                {filteredUsers.map(user => (
                  <div
                    key={user.uid}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{user.name || "Без имени"}</p>
                      <p className="text-xs sm:text-sm text-slate-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={user.role}
                        onChange={e => handleChangeRole(user.uid, e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => openEditUser(user)}
                        className="px-3 py-1.5 rounded-xl border border-primary text-primary text-sm hover:bg-primary hover:text-white transition"
                      >
                        Редактировать
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="section-title">Админ-панель</h2>
          <p className="text-sm text-slate-500">Управляйте пользователями, специалистами, расписанием и записями.</p>
        </div>

        <div className="flex flex-wrap gap-2 bg-white/70 border border-white/60 rounded-2xl p-2 shadow-sm">
          {[{ id: "appointments", label: "Записи" }, { id: "schedule", label: "Рабочие часы" }, { id: "people", label: "Пользователи" }].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id ? "bg-primary text-white shadow shadow-primary/30" : "text-slate-600 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md grid gap-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center">Редактирование пользователя</h3>
            <input
              type="text"
              className="border border-slate-200 rounded-xl px-3 py-2"
              placeholder="Имя"
              value={editingUserName}
              onChange={e => setEditingUserName(e.target.value)}
            />
            <input
              type="tel"
              className="border border-slate-200 rounded-xl px-3 py-2"
              placeholder="Телефон"
              value={editingUserPhone}
              onChange={e => setEditingUserPhone(e.target.value)}
            />
            <input
              type="text"
              className="border border-slate-200 rounded-xl px-3 py-2"
              placeholder="Адрес"
              value={editingUserAddress}
              onChange={e => setEditingUserAddress(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveEditingUser}
                disabled={editingUserSaving}
                className="px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-purple-700 transition disabled:opacity-60"
              >
                {editingUserSaving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingHairdresser && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setEditingHairdresser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md grid gap-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-center">Редактирование специалиста</h3>
            <input
              type="text"
              className="border border-slate-200 rounded-xl px-3 py-2"
              placeholder="Имя"
              value={editingHairdresserName}
              onChange={e => setEditingHairdresserName(e.target.value)}
            />
            <input
              type="text"
              className="border border-slate-200 rounded-xl px-3 py-2"
              placeholder="Полный адрес"
              value={editingHairdresserAddress}
              onChange={e => setEditingHairdresserAddress(e.target.value)}
            />
            <input
              type="url"
              className="border border-slate-200 rounded-xl px-3 py-2"
              placeholder="Ссылка на фото"
              value={editingHairdresserPhoto}
              onChange={e => setEditingHairdresserPhoto(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingHairdresser(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveEditingHairdresser}
                disabled={editingHairdresserSaving}
                className="px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-purple-700 transition disabled:opacity-60"
              >
                {editingHairdresserSaving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {slotsModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-50"
          onClick={() => {
            setSlotsModalOpen(false);
            setSlotsModalHairdresserId(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-lg sm:max-w-2xl grid gap-4 max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold">Слоты специалиста</h3>
              <button
                type="button"
                onClick={() => {
                  setSlotsModalOpen(false);
                  setSlotsModalHairdresserId(null);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedSlotsModal.size === slotsList.length) {
                    setSelectedSlotsModal(new Set());
                  } else {
                    setSelectedSlotsModal(new Set(slotsList.map(slot => slot.id)));
                  }
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
              >
                {selectedSlotsModal.size === slotsList.length ? "Снять выделение" : "Выделить все"}
              </button>
              {selectedSlotsModal.size > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDeleteSlots}
                  className="px-3 py-1.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
                >
                  Удалить выбранные ({selectedSlotsModal.size})
                </button>
              )}
            </div>
            <div className="overflow-auto">
              {slotsList.length === 0 ? (
                <p className="text-sm text-slate-500">У специалиста нет слотов</p>
              ) : (
                <div className="grid gap-2">
                  {slotsList.map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between gap-3 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={selectedSlotsModal.has(slot.id)}
                          onChange={() => {
                            setSelectedSlotsModal(prev => {
                              const next = new Set(prev);
                              if (next.has(slot.id)) next.delete(slot.id);
                              else next.add(slot.id);
                              return next;
                            });
                          }}
                          disabled={slot.booked}
                        />
                        <span className="truncate">{formatDateTime(slot.date, slot.time)}</span>
                        {slot.booked && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs whitespace-nowrap">
                            занято
                          </span>
                        )}
              </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={deletingSlotId === slot.id || slot.booked}
                        className="h-8 px-2 sm:px-3 rounded-lg border border-red-300 text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 flex-shrink-0"
                        title={slot.booked ? "Слот занят" : "Удалить слот"}
                      >
                        <span className="sm:hidden">🗑</span>
                        <span className="hidden sm:inline">{deletingSlotId === slot.id ? "Удаление..." : "Удалить"}</span>
                      </button>
            </div>
          ))}
                </div>
              )}
            </div>
        </div>
      </div>
      )}
    </>
  );
};

export default Admin;

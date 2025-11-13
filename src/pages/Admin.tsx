import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, getDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
}

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const roles = ["user", "specialist", "admin"];

  const [hName, setHName] = useState("");
  const [hAddress, setHAddress] = useState("");
  const [hPhotoUrl, setHPhotoUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [hairdressers, setHairdressers] = useState<any[]>([]);
  const [selectedH, setSelectedH] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endTime, setEndTime] = useState<string>("18:00");
  const [stepMinutes, setStepMinutes] = useState<number>(30);
  const [weekdays, setWeekdays] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true, 5: true });
  const [rangeFrom, setRangeFrom] = useState<string>("");
  const [rangeTo, setRangeTo] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const [appointments, setAppointments] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"appointments" | "schedule" | "people">("appointments");

  const [userSearch, setUserSearch] = useState("");
  const [usersError, setUsersError] = useState<string>("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const [editingUserPhone, setEditingUserPhone] = useState("");
  const [editingUserAddress, setEditingUserAddress] = useState("");
  const [editingUserSaving, setEditingUserSaving] = useState(false);

  const [hairdresserSearch, setHairdresserSearch] = useState("");
  const [editingHairdresser, setEditingHairdresser] = useState<any>(null);
  const [editingHairdresserSaving, setEditingHairdresserSaving] = useState(false);
  const [editingHairdresserName, setEditingHairdresserName] = useState("");
  const [editingHairdresserAddress, setEditingHairdresserAddress] = useState("");
  const [editingHairdresserPhoto, setEditingHairdresserPhoto] = useState("");

  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const data: User[] = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
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
    setHairdressers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  const loadAppointments = async () => {
    const snap = await getDocs(collection(db, "appointments"));
    setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const openEditUser = async (user: User) => {
    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      const data = snapshot.data() as any;
      setEditingUser({ ...user, phone: data?.phone || "", address: data?.address || "" });
      setEditingUserName(user.name || "");
      setEditingUserPhone(data?.phone || "");
      setEditingUserAddress(data?.address || "");
    } catch (e) {
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
    } catch (e: any) {
      alert(e.message || "Ошибка сохранения профиля пользователя");
    } finally {
      setEditingUserSaving(false);
    }
  };

  const openEditHairdresser = async (hairdresser: any) => {
    try {
      const snapshot = await getDoc(doc(db, "hairdressers", hairdresser.id));
      const data = snapshot.data() as any;
      setEditingHairdresser({ id: hairdresser.id, ...data });
      setEditingHairdresserName(data?.name || "");
      setEditingHairdresserAddress(data?.address || "");
      setEditingHairdresserPhoto(data?.photoUrl || "");
    } catch (e) {
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
    } catch (e: any) {
      alert(e.message || "Ошибка сохранения специалиста");
    } finally {
      setEditingHairdresserSaving(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadHairdressers();
    loadAppointments();
  }, []);

  const handleChangeRole = async (uid: string, role: string) => {
    await updateDoc(doc(db, "users", uid), { role });
    setUsers(prev => prev.map(u => (u.uid === uid ? { ...u, role } : u)));
  };

  const handleAddHairdresser = async () => {
    if (!hName || !hAddress) {
      alert("Заполните имя и адрес");
      return;
    }
    setSaving(true);
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
    } catch (e: any) {
      alert(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return true;
    const target = `${user.name || ""} ${user.email}`.toLowerCase();
    return target.includes(term);
  });

  const filteredHairdressers = hairdressers.filter((h: any) => {
    const term = hairdresserSearch.trim().toLowerCase();
    if (!term) return true;
    const target = `${h.name || ""} ${h.address || ""}`.toLowerCase();
    return target.includes(term);
  });

  const tabs: { id: "appointments" | "schedule" | "people"; label: string }[] = [
    { id: "appointments", label: "Записи" },
    { id: "schedule", label: "Рабочие часы" },
    { id: "people", label: "Пользователи" }
  ];

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="section-title">Админ-панель</h2>
          <p className="text-sm text-slate-500">Управляйте пользователями, специалистами, расписанием и записями.</p>
        </div>

        <div className="flex flex-wrap gap-2 bg-white/70 border border-white/60 rounded-2xl p-2 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow shadow-primary/30"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "appointments" && (
          <section className="card-surface p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-xl font-semibold">Все записи</h3>
              <span className="text-sm text-slate-500">Всего: {appointments.length}</span>
            </div>
            <div className="grid gap-3">
              {appointments.length === 0 ? (
                <div className="text-slate-500 text-sm">Записей нет</div>
              ) : (
                appointments
                  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                  .map(a => {
                    const phoneDigits = a.userPhone ? String(a.userPhone).replace(/\D/g, "") : "";
                    const whatsappLink = phoneDigits ? `https://wa.me/${phoneDigits}` : "";
                    return (
                      <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm space-y-1">
                          <div className="font-semibold text-slate-800">{a.hairdresserName}</div>
                          {a.hairdresserAddress && <div className="text-slate-500">{a.hairdresserAddress}</div>}
                          <div className="text-slate-600">{a.date} {a.time}</div>
                          <div className="text-slate-500">
                            {a.userName}
                            {a.userPhone ? ` — ${a.userPhone}` : ""}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {whatsappLink && (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-sm hover:bg-emerald-600 transition"
                            >
                              Написать в WhatsApp
                            </a>
                          )}
                          <button
                            onClick={async () => {
                              if (!window.confirm("Отменить запись и освободить слот?")) return;
                              try {
                                if (a.slotId) {
                                  await updateDoc(doc(db, "slots", a.slotId), { booked: false, userId: null });
                                }
                                await deleteDoc(doc(db, "appointments", a.id));
                                setAppointments(prev => prev.filter(x => x.id !== a.id));
                                alert("Запись отменена");
                              } catch (e: any) {
                                alert(e.message || "Ошибка отмены");
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600 transition"
                          >
                            Отменить
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </section>
        )}

        {activeTab === "schedule" && (
          <section className="card-surface p-5 sm:p-6 space-y-4">
            <h3 className="text-xl font-semibold">Рабочие часы и генерация слотов</h3>
            <div className="grid gap-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <label className="text-sm text-slate-500">Специалист</label>
                  <select
                    className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    value={selectedH}
                    onChange={e => setSelectedH(e.target.value)}
                  >
                    <option value="">Выберите специалиста</option>
                    {hairdressers.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name}
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
                    {[1, 2, 3, 4, 5, 6, 0].map(wd => (
                      <button
                        key={wd}
                        type="button"
                        onClick={() => setWeekdays(prev => ({ ...prev, [wd]: !prev[wd] }))}
                        className={`px-3 py-1 rounded-full border text-sm transition ${
                          weekdays[wd] ? "bg-primary text-white border-primary" : "border-slate-200 bg-white/80"
                        }`}
                      >
                        {"ПнВтСрЧтПтСбВс".match(/.{1,2}/g)?.[wd === 0 ? 6 : wd - 1]}
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

              <button
                disabled={generating || !selectedH || !rangeFrom || !rangeTo}
                onClick={async () => {
                  if (!selectedH) return;
                  setGenerating(true);
                  try {
                    const from = new Date(rangeFrom);
                    const to = new Date(rangeTo);
                    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
                      const wd = d.getDay();
                      if (!weekdays[wd]) continue;
                      const dayIso = d.toISOString().slice(0, 10);
                      const [sH, sM] = startTime.split(":").map(Number);
                      const [eH, eM] = endTime.split(":").map(Number);
                      const start = new Date(`${dayIso}T${String(sH).padStart(2, "0")}:${String(sM).padStart(2, "0")}:00`);
                      const end = new Date(`${dayIso}T${String(eH).padStart(2, "0")}:${String(eM).padStart(2, "0")}:00`);
                      for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + stepMinutes)) {
                        const hh = String(t.getHours()).padStart(2, "0");
                        const mm = String(t.getMinutes()).padStart(2, "0");
                        const timeStr = `${hh}:${mm}`;
                        await addDoc(collection(db, "slots"), {
                          specialistId: selectedH,
                          date: dayIso,
                          time: timeStr,
                          booked: false
                        });
                      }
                    }
                    alert("Слоты сгенерированы");
                  } catch (e: any) {
                    alert(e.message || "Ошибка генерации слотов");
                  } finally {
                    setGenerating(false);
                  }
                }}
                className="inline-flex items-center justify-center bg-primary text-white px-5 py-2.5 rounded-2xl hover:bg-purple-700 transition shadow shadow-primary/30 disabled:opacity-60"
              >
                {generating ? "Генерация..." : "Сохранить часы и сгенерировать слоты"}
              </button>
            </div>
          </section>
        )}

        {activeTab === "people" && (
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
                disabled={saving}
                onClick={handleAddHairdresser}
                className="inline-flex items-center justify-center bg-primary text-white px-5 py-2.5 rounded-2xl hover:bg-purple-700 transition shadow shadow-primary/30 disabled:opacity-60"
              >
                {saving ? "Сохранение..." : "Добавить парикмахера"}
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
                {filteredHairdressers.map((h: any) => (
                  <div
                    key={h.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-sm sm:text-base truncate">{h.name || "Без имени"}</p>
                      {h.address && <p className="text-xs text-slate-500 truncate">{h.address}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditHairdresser(h)}
                      className="px-3 py-1.5 rounded-xl border border-primary text-primary text-sm hover:bg-primary hover:text-white transition"
                    >
                      Редактировать
                    </button>
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
                        {roles.map(r => (
                          <option key={r} value={r}>
                            {r}
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
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md grid gap-4">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md grid gap-4">
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
    </>
  );
};

export default Admin;

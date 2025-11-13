import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";

interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
}

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const roles = ["user", "specialist", "admin"];

  const [hName, setHName] = useState("");
  const [hSpec, setHSpec] = useState("");
  const [hRating, setHRating] = useState<number>(5);
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

  const loadUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const data: User[] = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    setUsers(data);
  };
  const loadHairdressers = async () => {
    const snap = await getDocs(collection(db, "hairdressers"));
    setHairdressers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };
  const loadAppointments = async () => {
    const snap = await getDocs(collection(db, "appointments"));
    setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    if (!hName || !hSpec) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "hairdressers"), {
        name: hName,
        specialization: hSpec,
        rating: hRating,
        photoUrl: hPhotoUrl || ""
      });
      setHName("");
      setHSpec("");
      setHRating(5);
      setHPhotoUrl("");
      await loadHairdressers();
      alert("Парикмахер сохранен");
    } catch (e: any) {
      alert(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        <div className="flex flex-col gap-2">
          <h2 className="section-title">Админ-панель</h2>
          <p className="text-sm text-slate-500">Управляйте пользователями, специалистами, расписанием и записями.</p>
        </div>

        <section className="card-surface p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-xl font-semibold">Пользователи и роли</h3>
            <span className="text-sm text-slate-500">Всего: {users.length}</span>
          </div>
          <div className="grid gap-3">
            {users.map(user => (
              <div key={user.uid} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">{user.name || "Без имени"}</p>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">{user.email}</p>
                </div>
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
              </div>
            ))}
          </div>
        </section>

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
              placeholder="Специализация"
              className="border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={hSpec}
              onChange={e => setHSpec(e.target.value)}
            />
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2">
              <label className="text-sm text-slate-500 whitespace-nowrap">Рейтинг</label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.5}
                className="w-full bg-transparent focus:outline-none"
                value={hRating}
                onChange={e => setHRating(Number(e.target.value))}
              />
            </div>
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
                      {h.name} — {h.specialization}
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
                  {[0, 1, 2, 3, 4, 5, 6].map(wd => (
                    <button
                      key={wd}
                      type="button"
                      onClick={() => setWeekdays(prev => ({ ...prev, [wd]: !prev[wd] }))}
                      className={`px-3 py-1 rounded-full border text-sm transition ${weekdays[wd] ? "bg-primary text-white border-primary" : "border-slate-200 bg-white/80"}`}
                    >
                      {"ВсПнВтСрЧтПтСб".match(/.{1,2}/g)?.[wd]}
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
      </div>
    </>
  );
};

export default Admin;

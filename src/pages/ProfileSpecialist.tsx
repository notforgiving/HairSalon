import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";

interface Slot {
  id: string;
  date: string;
  time: string;
  booked: boolean;
  userId?: string;
}

const ProfileSpecialist: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchSlots = async () => {
      const q = query(collection(db, "slots"), where("specialistId", "==", user.uid));
      const snapshot = await getDocs(q);
      const data: Slot[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slot));
      setSlots(data);
    };
    const fetchAppointments = async () => {
      const q = query(collection(db, "appointments"), where("specialistId", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAppointments(data);
    };
    fetchSlots();
    fetchAppointments();
  }, [user]);

  const handleAddSlot = async () => {
    if (!date || !time) return alert("Введите дату и время");
    const docRef = await addDoc(collection(db, "slots"), {
      specialistId: user?.uid,
      date,
      time,
      booked: false,
    });
    setSlots(prev => [...prev, { id: docRef.id, date, time, booked: false }]);
    setDate(""); setTime("");
  };

  const handleDeleteSlot = async (id: string) => {
    if (!window.confirm("Удалить слот?")) return;
    await deleteDoc(doc(db, "slots", id));
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  return (
    <>
      <Navbar />
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Мои слоты</h2>

        <div className="mb-4 flex gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 rounded" />
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className="border p-2 rounded" />
          <button onClick={handleAddSlot} className="bg-primary text-white px-4 py-2 rounded hover:bg-purple-700 transition">
            Добавить слот
          </button>
        </div>

        <div className="grid gap-4">
          {slots.map(s => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <p>{s.date} {s.time}</p>
                <p>{s.booked ? "Забронирован" : "Свободен"}</p>
              </div>
              <button
                onClick={() => handleDeleteSlot(s.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
              >
                Удалить
              </button>
            </motion.div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">Мои клиенты и записи</h2>
        <div className="grid gap-4">
          {appointments.map(a => (
            <div key={a.id} className="bg-white p-4 rounded shadow flex justify-between">
              <div>
                <p className="font-semibold">{a.userName}</p>
                <p>{a.date} {a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProfileSpecialist;

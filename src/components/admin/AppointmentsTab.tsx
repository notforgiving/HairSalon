import { Appointment } from "../../types";
import { formatDateTime } from "../../utils/date";

interface AppointmentsTabProps {
  appointments: Appointment[];
  onCancel: (appointment: Appointment) => Promise<void>;
}

const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ appointments, onCancel }) => {
  if (appointments.length === 0) {
    return (
      <section className="card-surface p-5 sm:p-6">
        <p className="text-sm text-slate-500">Записей нет</p>
      </section>
    );
  }

  return (
    <section className="card-surface p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-xl font-semibold">Все записи</h3>
        <span className="text-sm text-slate-500">Всего: {appointments.length}</span>
      </div>
      <div className="grid gap-3">
        {appointments
          .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
          .map(appointment => {
            const phoneDigits = appointment.userPhone ? String(appointment.userPhone).replace(/\D/g, "") : "";
            const whatsappLink = phoneDigits ? `https://wa.me/${phoneDigits}` : "";
            return (
              <div
                key={appointment.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm space-y-1">
                  <div className="font-semibold text-slate-800">{appointment.hairdresserName}</div>
                  {appointment.hairdresserAddress && <div className="text-slate-500">{appointment.hairdresserAddress}</div>}
                  <div className="text-slate-600">{formatDateTime(appointment.date, appointment.time)}</div>
                  <div className="text-slate-500">
                    {appointment.userName}
                    {appointment.userPhone ? ` — ${appointment.userPhone}` : ""}
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
                    type="button"
                    onClick={() => onCancel(appointment)}
                    className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600 transition"
                  >
                    Отменить
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
};

export default AppointmentsTab;

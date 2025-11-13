import { Appointment } from "../types";
import { formatDateTime } from "./date";

const escapeCsvValue = (value: string | undefined | null) => {
  if (!value) return "";
  const stringValue = value.toString().replace(/"/g, '""');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue}"`;
  }
  return stringValue;
};

export const downloadAppointmentsCsv = (appointments: Appointment[]) => {
  if (!appointments.length) {
    alert("Нет записей для экспорта");
    return;
  }

  const header = [
    "ID",
    "Мастер",
    "Адрес",
    "Дата и время",
    "Пользователь",
    "Email",
    "Телефон"
  ];

  const rows = appointments.map(appointment => [
    appointment.id,
    appointment.hairdresserName,
    appointment.hairdresserAddress || "",
    formatDateTime(appointment.date, appointment.time),
    appointment.userName || "",
    appointment.userEmail || "",
    appointment.userPhone || ""
  ]);

  const csvContent = [header, ...rows]
    .map(cells => cells.map(escapeCsvValue).join(","))
    .join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `appointments-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

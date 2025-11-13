export const formatDate = (value?: string | Date) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ru-RU");
};

export const formatTime = (value?: string | Date) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

export const formatDateTime = (date: string, time?: string) => {
  if (!date) return "";
  const dt = time ? new Date(`${date}T${time}`) : new Date(date);
  if (Number.isNaN(dt.getTime())) {
    return time ? `${date} ${time}` : date;
  }
  const formattedDate = formatDate(dt);
  const formattedTime = dt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${formattedDate} ${formattedTime}`;
};

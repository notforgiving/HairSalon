import { VacationStatus } from "../../utils/vacation";
import { formatDate } from "../../utils/date";

interface VacationBannerProps {
  status: VacationStatus;
}

export const ActiveVacationBanner: React.FC<VacationBannerProps> = ({ status }) => {
  if (!status.active) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 text-white p-6">
      <div className="absolute inset-0 bg-white/10 blur-3xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="text-4xl">🌴</span>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold">Сейчас в отпуске</h3>
          <p className="text-sm text-white/85">
            Мастер недоступен с {formatDate(status.from)} по {formatDate(status.to)}. Выберите другого мастера или
            попробуйте записаться позже.
          </p>
          {typeof status.daysUntilEnd === "number" && (
            <p className="text-sm text-white/70">
              Возвращается через {status.daysUntilEnd} {status.daysUntilEnd === 1 ? "день" : "дней"}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const UpcomingVacationBanner: React.FC<VacationBannerProps> = ({ status }) => {
  if (!status.upcoming || typeof status.daysUntilStart !== "number") return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 flex items-start gap-3">
      <span className="text-2xl">🌞</span>
      <div className="space-y-1">
        <p className="font-medium">
          Отпуск через {status.daysUntilStart} {status.daysUntilStart === 1 ? "день" : "дней"}
        </p>
        <p className="text-sm text-amber-600">
          Мастер будет недоступен с {formatDate(status.from)} по {formatDate(status.to)}.
        </p>
      </div>
    </div>
  );
};

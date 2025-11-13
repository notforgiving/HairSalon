import { Hairdresser, Slot } from "../../types";
import { formatDateTime } from "../../utils/date";
import { isDayWithinVacation } from "../../utils/vacation";

interface DayItem {
  iso: string;
  label: string;
}

interface SlotsGridProps {
  days: DayItem[];
  slots: Slot[];
  selectedHairdresser: Hairdresser | null;
  selectedSlotId?: string;
  onSelectSlot: (slot: Slot) => void;
}

const SlotsGrid: React.FC<SlotsGridProps> = ({ days, slots, selectedHairdresser, selectedSlotId, onSelectSlot }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {days.map(day => {
        const vacationDay = isDayWithinVacation(selectedHairdresser, day.iso);
        const filteredSlots = slots
          .filter(slot => slot.date === day.iso && slot.booked === false)
          .filter(slot => !isDayWithinVacation(selectedHairdresser, slot.date));

        return (
          <div
            key={day.iso}
            className={`border rounded-lg p-3 ${vacationDay ? "border-amber-300 bg-amber-50" : ""}`}
          >
            <div className={`text-sm mb-2 ${vacationDay ? "text-amber-700 font-medium" : "text-gray-600"}`}>
              {day.label}
              {vacationDay && " · отпуск"}
            </div>
            <div className="grid gap-2">
              {vacationDay ? (
                <span className="text-xs text-amber-600">Мастер в отпуске</span>
              ) : filteredSlots.length === 0 ? (
                <span className="text-xs text-gray-400">Нет слотов</span>
              ) : (
                filteredSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => onSelectSlot(slot)}
                    className={`text-sm border rounded px-2 py-1 transition ${
                      selectedSlotId === slot.id ? "bg-primary text-white border-primary" : "hover:bg-accent"
                    }`}
                    title={formatDateTime(slot.date, slot.time)}
                  >
                    {slot.time}
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SlotsGrid;

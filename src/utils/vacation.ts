import { Hairdresser } from "../types";

export interface VacationStatus {
  active: boolean;
  upcoming: boolean;
  from?: string;
  to?: string;
  daysUntilStart?: number;
  daysUntilEnd?: number;
}

export const getVacationStatus = (hairdresser?: Hairdresser | null): VacationStatus => {
  const fallback: VacationStatus = {
    active: false,
    upcoming: false,
    from: undefined,
    to: undefined,
    daysUntilStart: undefined,
    daysUntilEnd: undefined
  };

  if (!hairdresser?.vacation?.from || !hairdresser.vacation?.to) return fallback;

  const startDate = new Date(hairdresser.vacation.from);
  const endDate = new Date(hairdresser.vacation.to);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return fallback;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const vacationStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const vacationEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
  const msInDay = 1000 * 60 * 60 * 24;

  if (todayStart >= vacationStart && todayStart <= vacationEnd) {
    const daysUntilEnd = Math.max(0, Math.ceil((vacationEnd.getTime() - todayStart.getTime()) / msInDay));
    return {
      active: true,
      upcoming: false,
      from: hairdresser.vacation.from,
      to: hairdresser.vacation.to,
      daysUntilStart: 0,
      daysUntilEnd
    };
  }

  if (todayStart < vacationStart) {
    const diff = Math.ceil((vacationStart.getTime() - todayStart.getTime()) / msInDay);
    if (diff <= 14) {
      return {
        active: false,
        upcoming: true,
        from: hairdresser.vacation.from,
        to: hairdresser.vacation.to,
        daysUntilStart: diff,
        daysUntilEnd: undefined
      };
    }
  }

  return {
    active: false,
    upcoming: false,
    from: hairdresser.vacation.from,
    to: hairdresser.vacation.to,
    daysUntilStart: undefined,
    daysUntilEnd: undefined
  };
};

export const isDayWithinVacation = (hairdresser: Hairdresser | null, isoDate: string) => {
  if (!hairdresser?.vacation?.from || !hairdresser.vacation?.to) return false;
  const date = new Date(isoDate);
  const start = new Date(hairdresser.vacation.from);
  const end = new Date(hairdresser.vacation.to);
  if (Number.isNaN(date.getTime()) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  const vacationStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const vacationEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);

  return dayEnd >= vacationStart && dayStart <= vacationEnd;
};

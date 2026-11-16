"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { getNextPacificMidnight, getPacificCalendarDay } from "../model/maintenance-age";

const ClassroomMaintenanceDayContext = createContext<number | undefined>(undefined);

export function useClassroomMaintenanceDay() {
  return useContext(ClassroomMaintenanceDayContext);
}

export function ClassroomMaintenanceDayProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(getPacificCalendarDay);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function updateDay() {
      clearTimeout(timer);
      const now = new Date();
      setToday(getPacificCalendarDay(now));
      timer = setTimeout(updateDay, getNextPacificMidnight(now) - now.getTime());
    }

    updateDay();
    document.addEventListener("visibilitychange", updateDay);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", updateDay);
    };
  }, []);

  return <ClassroomMaintenanceDayContext.Provider value={today}>{children}</ClassroomMaintenanceDayContext.Provider>;
}

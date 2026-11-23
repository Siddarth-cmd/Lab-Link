"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SHOWCASE_STUDENT_PROFILES } from "@/lib/showcase/profiles";

const STORAGE_KEY = "lablink.showcase-profile.v1";
type ProfileId = typeof SHOWCASE_STUDENT_PROFILES[number]["id"];
type ContextValue = { studentId: ProfileId | null; selectStudent: (id: ProfileId | null) => void };
const StudentContext = createContext<ContextValue | null>(null);

export function ShowcaseStudentProvider({ children }: { children: React.ReactNode }) {
  const [studentId, setStudentId] = useState<ProfileId | null>(null);
  useEffect(() => {
    const syncPreference = () => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      setStudentId(SHOWCASE_STUDENT_PROFILES.some((profile) => profile.id === saved) ? saved as ProfileId : null);
    };
    const frame = window.requestAnimationFrame(syncPreference);
    window.addEventListener("storage", syncPreference);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("storage", syncPreference); };
  }, []);
  const value = useMemo<ContextValue>(() => ({
    studentId,
    selectStudent(id) {
      setStudentId(id);
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    },
  }), [studentId]);
  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useShowcaseStudent() {
  const context = useContext(StudentContext);
  if (!context) throw new Error("ShowcaseStudentProvider is missing.");
  return { ...context, profile: SHOWCASE_STUDENT_PROFILES.find((profile) => profile.id === context.studentId) ?? null };
}

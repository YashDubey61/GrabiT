"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Student } from "@/lib/types/database";

type AuthContextType = {
  student: Student | null;
  isLoading: boolean;
  login: (student: Student) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for persisted session
    const stored = localStorage.getItem("grabit-student");
    if (stored) {
      try {
        setStudent(JSON.parse(stored));
      } catch {
        localStorage.removeItem("grabit-student");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (s: Student) => {
    setStudent(s);
    localStorage.setItem("grabit-student", JSON.stringify(s));
    // Set cookie for middleware
    document.cookie = `grabit-student-id=${s.id}; path=/; max-age=${60 * 60 * 24 * 30}`;
  };

  const logout = () => {
    setStudent(null);
    localStorage.removeItem("grabit-student");
    document.cookie = "grabit-student-id=; path=/; max-age=0";
  };

  return (
    <AuthContext.Provider value={{ student, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

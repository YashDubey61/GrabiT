"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRoleAndProfile = useCallback(async (authUser: User): Promise<UserRole> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error || !data) {
        // First time Google user or missing profile -> insert default student profile
        const randomPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        await supabase.from("users").upsert({
          id: authUser.id,
          phone: authUser.phone || randomPhone,
          role: "student",
          campus_id: "a1000000-0000-0000-0000-000000000001",
        });
        return "student";
      }

      return (data.role as UserRole) || "student";
    } catch {
      return "student";
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    console.log("[AuthContext] refreshAuth starting...");
    try {
      const supabase = createClient();
      console.log("[AuthContext] fetching getSession()...");
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: Session | null } }>((resolve) =>
        setTimeout(() => {
          console.warn("[AuthContext] getSession timeout reached after 2500ms");
          resolve({ data: { session: null } });
        }, 2500),
      );

      const { data } = await Promise.race([sessionPromise, timeoutPromise]);
      console.log("[AuthContext] session resolved:", data?.session ? "User found: " + data.session.user.id : "No session");
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);

      if (data?.session?.user) {
        const userRole = await fetchRoleAndProfile(data.session.user);
        console.log("[AuthContext] role resolved:", userRole);
        setRole(userRole);
      } else {
        setRole(null);
      }
    } catch (err) {
      console.error("[AuthContext] refreshAuth caught error:", err);
      setSession(null);
      setUser(null);
      setRole(null);
    } finally {
      console.log("[AuthContext] setting isLoading = false");
      setIsLoading(false);
    }
  }, [fetchRoleAndProfile]);

  useEffect(() => {
    console.log("[AuthContext] useEffect mounted, triggering refreshAuth");
    refreshAuth();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("[AuthContext] onAuthStateChange event:", event, currentSession ? "User: " + currentSession.user.id : "No session");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        try {
          const userRole = await fetchRoleAndProfile(currentSession.user);
          console.log("[AuthContext] onAuthStateChange role:", userRole);
          setRole(userRole);
        } catch {
          setRole("student");
        } finally {
          setIsLoading(false);
        }
      } else {
        setRole(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchRoleAndProfile, refreshAuth]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

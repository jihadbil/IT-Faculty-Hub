import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  authApi,
  clearStoredTokens,
  getStoredTokens,
  setOnUnauthorized,
  setStoredTokens,
  usersApi,
  type AuthResponseDto,
  type UserResponseDto,
  type Uuid,
} from "@/lib/external-api";

export type Role = "teacher" | "student" | "admin";

export interface AuthUser {
  id: Uuid;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: Role;
  roles: string[];
  profileImageUrl?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function deriveRole(roles: string[]): Role {
  const lower = roles.map((r) => r.toLowerCase());
  const has = (...needles: string[]) => lower.some((r) => needles.some((n) => r.includes(n)));
  if (has("admin", "manager")) return "admin";
  if (has("teacher", "instructor", "professor")) return "teacher";
  return "student";
}

function toAuthUser(u: UserResponseDto, fallbackRoles?: string[]): AuthUser {
  const roles = u.roles?.length ? u.roles : fallbackRoles || [];
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName || `${u.firstName} ${u.lastName}`.trim(),
    firstName: u.firstName,
    lastName: u.lastName,
    role: deriveRole(roles),
    roles,
    profileImageUrl: u.profileImageUrl ?? null,
  };
}

function persistTokens(res: AuthResponseDto) {
  setStoredTokens({
    token: res.token,
    refreshToken: res.refreshToken,
    expiresAt: res.expiresAt,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getStoredTokens()) {
      setUser(null);
      return;
    }
    try {
      const me = await usersApi.me();
      setUser(toAuthUser(me));
    } catch {
      clearStoredTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      clearStoredTokens();
      setUser(null);
    });
    refresh().finally(() => setLoading(false));
    return () => setOnUnauthorized(null);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    persistTokens(res);
    let me: UserResponseDto;
    try {
      me = await usersApi.me();
    } catch {
      const u = res.user;
      const [first, ...rest] = (u.fullName || "").split(" ");
      me = {
        id: u.id,
        firstName: first || u.fullName,
        lastName: rest.join(" "),
        fullName: u.fullName,
        email: u.email,
        phoneNumber: null,
        profileImageUrl: u.profileImageUrl ?? null,
        preferredLanguage: "ar",
        isActive: true,
        createdAtUtc: new Date().toISOString(),
        roles: res.roles || [],
      };
    }
    const next = toAuthUser(me, res.roles);
    setUser(next);
    return next;
  }, []);

  const register = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      const res = await authApi.register(input);
      persistTokens(res);
      let me: UserResponseDto;
      try {
        me = await usersApi.me();
      } catch {
        me = {
          id: res.user.id,
          firstName: input.firstName,
          lastName: input.lastName,
          fullName: `${input.firstName} ${input.lastName}`.trim(),
          email: input.email,
          phoneNumber: null,
          profileImageUrl: null,
          preferredLanguage: "ar",
          isActive: true,
          createdAtUtc: new Date().toISOString(),
          roles: res.roles || [],
        };
      }
      const next = toAuthUser(me, res.roles);
      setUser(next);
      return next;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore network errors on logout */
    }
    clearStoredTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

"use client";

import { getToken, removeToken, setToken } from "@/utils/tokenHelper";
import axios from "axios";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

// ========== CONSULTANT USER TYPE ==========
export type ConsultantUser = {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  role: "consultant"; // fixed for consultant app
  isVerified: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive?: boolean;
  avatar?: string | null;
  gender?: "male" | "female" | "other" | null;
  dateOfBirth?: string | Date | null;
  languages?: string[];
  createdAt?: string;
  lastLogin?: string;

  // ============= CONSULTANT PROFILE ============
  consultantProfile: {
    bio?: string;
    skills?: string[];
    ratingAverage?: number;
    ratingCount?: number;
    totalSessions?: number;
    onboardingScore?: number;
    ratePerMinute?: number;
    availabilityStatus?: "onWork" | "offWork" | "busy";
    wallet?: {
      available: number;
      pending: number;
      totalEarned: number;
    };
  };

  // ============= KYC + DOCUMENTS ============
  kycVerified?: boolean;
  documents?: {
    type: "aadhaar" | "pan" | "passport" | "license";
    url: string;
    verified: boolean;
    uploadedAt: string;
  }[];

  // ============= REFERRAL + META ============
  referralCode?: string;
  referredBy?: string;
  totalReferrals?: number;

  accessToken?: string; // stored JWT
};

// ========== AUTH CONTEXT TYPES ==========
export type AuthContextType = {
  user: ConsultantUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  saveAuthData: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

// ========== DEFAULT CONTEXT ==========
const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  saveAuthData: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// ========== PROVIDER ==========
type Props = { children: ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<ConsultantUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const API_BASE_URL = "https://api.colio.in/api";

  // ✅ INIT AUTH ON MOUNT
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          setUser(null);
          setIsAuthLoading(false);
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success && res.data.data) {
          setUser(res.data.data);
        } else {
          await removeToken();
          setUser(null);
        }
      } catch (err) {
        console.error("Init consultant auth error:", err);
        await removeToken();
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  // ✅ SAVE AUTH DATA AFTER LOGIN/REGISTER
  const saveAuthData = async (userData: any) => {
    try {
      const token = userData?.accessToken;
      if (token) await setToken(token);
      setUser(userData);
    } catch (err) {
      console.error("Error saving consultant auth data:", err);
    }
  };

  // ✅ REFRESH USER FROM BACKEND
  const refreshUser = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/consultant/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.error("Failed to refresh consultant user:", err);
    }
  };

  // ✅ LOGOUT
  const logout = async () => {
    try {
      setIsAuthLoading(true);
      await removeToken();
      setUser(null);
    } catch (err) {
      console.error("Consultant logout error:", err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAuthLoading,
    saveAuthData,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ✅ HOOK
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

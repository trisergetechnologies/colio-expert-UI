"use client";

import notificationService from '@/services/notificationService';
import { getToken, removeToken, setToken } from "@/utils/tokenHelper";
import { API_BASE_URL } from "@/constants/onboarding";
import axios from "axios";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
    category?: string;
    ratingAverage?: number;
    ratingCount?: number;
    totalSessions?: number;
    onboardingScore?: number;
    ratePerMinute?: number;
    ratePerMinuteVideo?: number;
    ratePerMinuteChat?: number;
    availabilityStatus?: "onWork" | "offWork" | "busy";
    applicationStatus?:
      | "pending_profile"
      | "pending_approval"
      | "approved"
      | "rejected";
    rejectionReason?: string;
    wallet?: {
      available: number;
      pending: number;
      totalEarned: number;
    };
    agreement?: {
      signed?: boolean;
      signedName?: string;
      signedAt?: string;
      version?: string;
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

  const initializeNotifications = useCallback(async () => {
    try {
      console.log("[Expert] 🔔 Initializing notifications...");
      await notificationService.initialize();
    } catch (error) {
      console.error("[Expert] ❌ Error initializing notifications:", error);
    }
  }, []);

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
          await initializeNotifications();
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

    void initAuth();
  }, [initializeNotifications]);

  // ✅ SAVE AUTH DATA AFTER LOGIN/REGISTER
  const saveAuthData = useCallback(
    async (userData: any) => {
      try {
        const token = userData?.accessToken;
        if (token) await setToken(token);
        setUser(userData);
        await initializeNotifications();
      } catch (err) {
        console.error("Error saving consultant auth data:", err);
      }
    },
    [initializeNotifications],
  );

  // Prevent concurrent refreshUser calls and unnecessary re-renders from identical data.
  const refreshingRef = useRef(false);

  const refreshUser = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const token = await getToken();
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data.data) {
        const incoming = res.data.data as ConsultantUser;
        setUser((prev) => {
          if (!prev) return incoming;

          const prevStatus = prev.consultantProfile?.applicationStatus;
          const nextStatus = incoming.consultantProfile?.applicationStatus;

          // Preserve previous status when the API omits it.
          if (prevStatus && (nextStatus === undefined || nextStatus === null)) {
            return {
              ...incoming,
              consultantProfile: {
                ...(incoming.consultantProfile ?? prev.consultantProfile ?? {}),
                applicationStatus: prevStatus,
              },
            };
          }

          // Skip state update when nothing meaningful changed — avoids
          // creating a new object ref that triggers layout effects and flicker.
          if (
            prev.userId === incoming.userId &&
            prevStatus === nextStatus &&
            prev.isActive === incoming.isActive &&
            prev.consultantProfile?.availabilityStatus ===
              incoming.consultantProfile?.availabilityStatus &&
            prev.consultantProfile?.ratingAverage ===
              incoming.consultantProfile?.ratingAverage &&
            prev.name === incoming.name &&
            prev.avatar === incoming.avatar
          ) {
            return prev;
          }

          return incoming;
        });
      }
    } catch (err) {
      console.error("Failed to refresh consultant user:", err);
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsAuthLoading(true);
      await notificationService.removeTokenFromBackend();
      notificationService.removeListeners();
      await removeToken();
      setUser(null);
    } catch (err) {
      console.error("Consultant logout error:", err);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

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

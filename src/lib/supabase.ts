import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { UserProfile } from "../types";

// Access environment variables
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("your-supabase-project");

// Initialize Supabase Client lazily/gracefully
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Key for local storage mock session fallback when Supabase keys are not set
const MOCK_USER_STORAGE_KEY = "codefix_mock_supabase_user";
const MOCK_PROFILES_STORAGE_KEY = "codefix_mock_supabase_profiles";

export function getStoredLocalUser(): UserProfile | null {
  try {
    const data = localStorage.getItem(MOCK_USER_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredLocalUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to save local mock user session", e);
  }
}
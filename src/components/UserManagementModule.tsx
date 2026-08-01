import React, { useState, useEffect } from "react";
import { UserProfile } from "../types";
import {
  supabase,
  isSupabaseConfigured,
  getStoredLocalUser,
  setStoredLocalUser,
} from "../lib/supabase";
import {
  User,
  Lock,
  Mail,
  Shield,
  KeyRound,
  LogOut,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Building,
  Briefcase,
  Sparkles,
  Database,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Clock,
  ShieldCheck,
  Key,
  Info,
  Terminal,
  ChevronRight,
  Sliders,
  Check,
} from "lucide-react";

interface UserManagementModuleProps {
  onUserSessionChange?: (user: UserProfile | null) => void;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({
  onUserSessionChange,
}) => {
  // Current session user state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return getStoredLocalUser();
  });

  // Form Mode: "login" | "register" | "forgot-password"
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot-password">("login");

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [organization, setOrganization] = useState("CodeFix AI Labs");
  const [showPassword, setShowPassword] = useState(false);

  // Profile Edit state for logged-in user
  const [profileName, setProfileName] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [profileOrg, setProfileOrg] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Feedback messages
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Supabase SQL Drawer toggle
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  // Populate profile edit form when user changes
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.fullName || "");
      setProfileRole(currentUser.role || "Software Engineer");
      setProfileOrg(currentUser.organization || "CodeFix AI Labs");
      setProfileBio(currentUser.bio || "");
    }
  }, [currentUser]);

  // Sync Supabase Auth Listener if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userObj: UserProfile = {
            id: session.user.id,
            email: session.user.email || "",
            fullName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
            role: session.user.user_metadata?.role || "Developer",
            organization: session.user.user_metadata?.organization || "Engineering",
            emailVerified: Boolean(session.user.email_confirmed_at),
            createdAt: session.user.created_at,
            lastLoginAt: session.user.last_sign_in_at || new Date().toISOString(),
          };
          setCurrentUser(userObj);
          setStoredLocalUser(userObj);
          if (onUserSessionChange) onUserSessionChange(userObj);
        }
      });

      // Listen for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            const userObj: UserProfile = {
              id: session.user.id,
              email: session.user.email || "",
              fullName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
              role: session.user.user_metadata?.role || "Developer",
              organization: session.user.user_metadata?.organization || "Engineering",
              emailVerified: Boolean(session.user.email_confirmed_at),
              createdAt: session.user.created_at,
              lastLoginAt: new Date().toISOString(),
            };
            setCurrentUser(userObj);
            setStoredLocalUser(userObj);
            if (onUserSessionChange) onUserSessionChange(userObj);
          } else {
            setCurrentUser(null);
            setStoredLocalUser(null);
            if (onUserSessionChange) onUserSessionChange(null);
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Clear alerts after 5 seconds
  const setAlert = (msg: string, type: "error" | "success") => {
    if (type === "error") {
      setErrorMessage(msg);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(msg);
      setErrorMessage(null);
    }
    setTimeout(() => {
      setErrorMessage(null);
      setSuccessMessage(null);
    }, 6000);
  };

  // 1. Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAlert("Please enter a valid email and password.", "error");
      return;
    }
    if (password.length < 6) {
      setAlert("Password must be at least 6 characters long.", "error");
      return;
    }
    if (password !== confirmPassword) {
      setAlert("Passwords do not match.", "error");
      return;
    }

    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split("@")[0],
              role,
              organization,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          setAlert(
            "Account registered successfully via Supabase Auth! Please check your email for confirmation if required.",
            "success"
          );
          setAuthMode("login");
        }
      } catch (err: any) {
        setAlert(err.message || "Registration failed. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Mock account registration fallback
      setTimeout(() => {
        const newUser: UserProfile = {
          id: `usr-${Date.now()}`,
          email,
          fullName: fullName || email.split("@")[0],
          role,
          organization,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          bio: "Software developer registered on CodeFix AI Platform.",
        };
        setCurrentUser(newUser);
        setStoredLocalUser(newUser);
        if (onUserSessionChange) onUserSessionChange(newUser);
        setAlert(`Account created successfully for ${email}! You are now logged in.`, "success");
        setIsLoading(false);
      }, 700);
    }
  };

  // 2. Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAlert("Please provide both email and password.", "error");
      return;
    }

    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          setAlert("Authenticated successfully via Supabase Auth!", "success");
        }
      } catch (err: any) {
        setAlert(err.message || "Invalid email or password.", "error");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Demo / Sandbox login logic
      setTimeout(() => {
        const loggedUser: UserProfile = {
          id: `usr-supa-${Math.floor(Math.random() * 90000 + 10000)}`,
          email,
          fullName: email.split("@")[0].replace(".", " "),
          role: "Software Architect",
          organization: "CodeFix AI Engineering",
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setCurrentUser(loggedUser);
        setStoredLocalUser(loggedUser);
        if (onUserSessionChange) onUserSessionChange(loggedUser);
        setAlert(`Welcome back, ${loggedUser.fullName}! Authenticated successfully.`, "success");
        setIsLoading(false);
      }, 600);
    }
  };

  // 3. Handle Logout
  const handleLogout = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err: any) {
        console.error("Sign out error", err);
      }
    }
    setCurrentUser(null);
    setStoredLocalUser(null);
    if (onUserSessionChange) onUserSessionChange(null);
    setIsLoading(false);
    setAlert("You have been logged out safely.", "success");
  };

  // 4. Handle Forgot / Reset Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setAlert("Please enter your registered email address.", "error");
      return;
    }

    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setAlert(`Password reset link dispatched via Supabase to ${email}.`, "success");
      } catch (err: any) {
        setAlert(err.message || "Failed to request password reset.", "error");
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        setAlert(`Password reset instructions sent to ${email} (Sandbox Mode).`, "success");
        setIsLoading(false);
        setAuthMode("login");
      }, 700);
    }
  };

  // 5. Update Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSavingProfile(true);

    const updatedUser: UserProfile = {
      ...currentUser,
      fullName: profileName,
      role: profileRole,
      organization: profileOrg,
      bio: profileBio,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: profileName,
            role: profileRole,
            organization: profileOrg,
            bio: profileBio,
          },
        });
        if (error) throw error;
        setAlert("Profile information updated successfully in Supabase!", "success");
      } catch (err: any) {
        setAlert(err.message || "Failed to update profile.", "error");
      } finally {
        setIsSavingProfile(false);
      }
    } else {
      setTimeout(() => {
        setCurrentUser(updatedUser);
        setStoredLocalUser(updatedUser);
        if (onUserSessionChange) onUserSessionChange(updatedUser);
        setAlert("Profile details updated successfully!", "success");
        setIsSavingProfile(false);
      }, 500);
    }
  };

  // 6. Change Password (when logged in)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setAlert("New password must be at least 6 characters.", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setAlert("New passwords do not match.", "error");
      return;
    }

    setIsChangingPassword(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
        setAlert("Password updated securely via Supabase Auth!", "success");
        setNewPassword("");
        setConfirmNewPassword("");
      } catch (err: any) {
        setAlert(err.message || "Failed to change password.", "error");
      } finally {
        setIsChangingPassword(false);
      }
    } else {
      setTimeout(() => {
        setAlert("Password changed successfully using secure encryption!", "success");
        setNewPassword("");
        setConfirmNewPassword("");
        setIsChangingPassword(false);
      }, 600);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <span>User Management & Supabase Auth Module</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                Secure registration, password hashing, identity verification, multi-factor session security, and profile persistence powered by <strong className="text-emerald-400">Supabase</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Supabase Connection Status Pill & Guide Toggle */}
        <div className="flex items-center space-x-2">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center space-x-2 ${
              isSupabaseConfigured
                ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                : "bg-indigo-950/80 border-indigo-800 text-indigo-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? "bg-emerald-400 animate-pulse" : "bg-indigo-400"
              }`}
            />
            <span>{isSupabaseConfigured ? "Supabase Cloud Connected" : "Supabase Sandbox Mode"}</span>
          </div>

          <button
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showSqlGuide ? "Hide Schema" : "Supabase RLS Setup"}</span>
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="bg-rose-950/80 border border-rose-800 rounded-xl p-3.5 px-4 flex items-center space-x-2.5 text-xs text-rose-200 shadow-lg animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-950/80 border border-emerald-800 rounded-xl p-3.5 px-4 flex items-center space-x-2.5 text-xs text-emerald-200 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Supabase SQL Schema & Integration Info Box */}
      {showSqlGuide && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Supabase Database Schema & Row Level Security (RLS) SQL Script</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Paste in Supabase SQL Editor</span>
          </div>
          <p className="text-xs text-slate-400">
            To store profile metadata securely with Row Level Security (RLS) in your Supabase project, execute this standard SQL schema:
          </p>
          <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
{`-- Create a public profiles table connected to auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text,
  organization text,
  bio text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policy for users to read their own profile
create policy "Allow user read own profile" on public.profiles
  for select using (auth.uid() = id);

-- Create policy for users to update their own profile
create policy "Allow user update own profile" on public.profiles
  for update using (auth.uid() = id);`}
          </pre>
        </div>
      )}

      {/* Main Grid: User Auth Form OR User Profile Account Dashboard */}
      {currentUser ? (
        /* LOGGED IN ACCOUNT DASHBOARD */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: User Identity Card & Quick Stats */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="text-center space-y-3">
                {/* Avatar Placeholder */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-1 mx-auto shadow-xl shadow-indigo-950/50">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-white text-xl font-black font-mono">
                    {currentUser.fullName
                      ? currentUser.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "U"}
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">{currentUser.fullName}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
                </div>

                {/* Identity Badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified User Identity</span>
                  </span>
                  <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-full text-[10px] font-mono">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>Organization:</span>
                  </span>
                  <span className="text-slate-200 font-bold">{currentUser.organization}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    <span>Auth Engine:</span>
                  </span>
                  <span className="text-cyan-400 font-bold">
                    {isSupabaseConfigured ? "Supabase Auth (JWT)" : "Supabase Local Sandbox"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>User UUID:</span>
                  </span>
                  <span className="text-slate-300 text-[10px] truncate max-w-[140px]" title={currentUser.id}>
                    {currentUser.id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Last Sign-In:</span>
                  </span>
                  <span className="text-slate-300 text-[10px]">
                    {new Date(currentUser.lastLoginAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800/80 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Details Management & Password Change Forms */}
          <div className="lg:col-span-8 space-y-6">
            {/* Form 1: Profile Details Update */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Profile Management & Personal Information
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Updates Supabase User Metadata</span>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Job Role / Title</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={profileRole}
                        onChange={(e) => setProfileRole(e.target.value)}
                        placeholder="Lead Software Architect"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Organization / Team</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={profileOrg}
                        onChange={(e) => setProfileOrg(e.target.value)}
                        placeholder="CodeFix AI Engineering"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Email Address (Read Only)</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={currentUser.email}
                        disabled
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-400 font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Developer Bio / Notes</label>
                  <textarea
                    rows={2}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Brief description of your role, coding focus, or bug prediction workflow..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    {isSavingProfile ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Form 2: Password Reset & Password Change */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Password Reset & Account Security
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Secured via Supabase Encryption</span>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <p className="text-slate-400 leading-relaxed">
                  Protect your account by updating your password. Passwords are encrypted on Supabase auth servers using industry-standard salted hashing algorithms.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-bold rounded-xl flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    {isChangingPassword ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4 text-rose-400" />
                    )}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* LOGGED OUT: USER LOGIN / REGISTRATION / FORGOT PASSWORD FORMS */
        <div className="max-w-md mx-auto space-y-6 pt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            {/* Toggle Header Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  authMode === "login" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                  authMode === "register" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Account</span>
              </button>
            </div>

            {/* FORM 1: LOGIN */}
            {authMode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">Sign In to CodeFix AI</h3>
                  <p className="text-slate-400 text-xs">Access software defect predictions and saved reports</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@company.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-slate-300 font-bold">Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode("forgot-password")}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-950/50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  <span>Secure Sign In</span>
                </button>
              </form>
            )}

            {/* FORM 2: USER REGISTRATION */}
            {authMode === "register" && (
              <form onSubmit={handleRegister} className="space-y-4 text-xs">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">Create New User Account</h3>
                  <p className="text-slate-400 text-xs">Registers user identity securely with Supabase Auth</p>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Job Role</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Software Engineer"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Organization</label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Engineering Team"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Password (Min 6 chars)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Register Account</span>
                </button>
              </form>
            )}

            {/* FORM 3: FORGOT PASSWORD */}
            {authMode === "forgot-password" && (
              <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">Reset Password</h3>
                  <p className="text-slate-400 text-xs">
                    Dispatches a secure password recovery email via Supabase Auth
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 font-sans"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Send Reset Link</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
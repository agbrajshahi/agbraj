"use client";

import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Save,
  Shield,
  Palette,
  Globe,
  Key,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<Record<string, string>>({
    site_name: "AbacusUp Education Platform",
    support_email: "support@abacusup.com",
    support_phone: "+1 (800) 555-ABACUS",
    headquarters_address: "100 Innovation Way, Suite 400, Metro City",
    brand_primary_color: "#2563EB",
    brand_accent_color: "#0D9488",
    theme_mode: "light",
    session_timeout_minutes: "120",
    max_login_attempts: "5",
    require_strong_passwords: "true",
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      }
    } catch {
      toast("Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      toast("Platform configuration saved successfully!", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast("New passwords do not match", "error");
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password update failed");

      toast("Your password has been updated securely!", "success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading system settings...</p>
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "General Configuration", icon: Globe },
    { id: "appearance", label: "Appearance & Brand", icon: Palette },
    { id: "security", label: "Security & Sessions", icon: Shield },
    { id: "password", label: "Change Password", icon: Key },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-slate-800" /> Platform Settings & Controls
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure branding, session parameters, security policies, and administrator credentials
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-2xl px-4 flex gap-1 overflow-x-auto shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50/20"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-b-2xl border border-slate-200/80 p-6 shadow-sm max-w-4xl">
        {/* GENERAL TAB */}
        {activeTab === "general" && (
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Platform Name / Brand Title
              </label>
              <input
                type="text"
                value={settings.site_name || ""}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Official Support Email
                </label>
                <input
                  type="email"
                  value={settings.support_email || ""}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Official Support Phone
                </label>
                <input
                  type="text"
                  value={settings.support_phone || ""}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Global Headquarters Address
              </label>
              <input
                type="text"
                value={settings.headquarters_address || ""}
                onChange={(e) => setSettings({ ...settings, headquarters_address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save General Settings"}
              </button>
            </div>
          </form>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === "appearance" && (
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.brand_primary_color || "#2563EB"}
                    onChange={(e) => setSettings({ ...settings, brand_primary_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={settings.brand_primary_color || "#2563EB"}
                    onChange={(e) => setSettings({ ...settings, brand_primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.brand_accent_color || "#0D9488"}
                    onChange={(e) => setSettings({ ...settings, brand_accent_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={settings.brand_accent_color || "#0D9488"}
                    onChange={(e) => setSettings({ ...settings, brand_accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Appearance Settings"}
              </button>
            </div>
          </form>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Session Expiration (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.session_timeout_minutes || "120"}
                  onChange={(e) => setSettings({ ...settings, session_timeout_minutes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Max Failed Login Attempts
                </label>
                <input
                  type="number"
                  value={settings.max_login_attempts || "5"}
                  onChange={(e) => setSettings({ ...settings, max_login_attempts: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Enforce Strong Password Policy</span>
                <span className="text-slate-500 text-[11px]">
                  Requires minimum 8 characters, uppercase, and numeric symbols
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.require_strong_passwords === "true"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    require_strong_passwords: e.target.checked ? "true" : "false",
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Security Configuration"}
              </button>
            </div>
          </form>
        )}

        {/* PASSWORD TAB */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs max-w-md">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition"
              >
                <Key className="w-4 h-4" /> {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

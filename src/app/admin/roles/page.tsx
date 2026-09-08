"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Check,
  CheckCircle2,
  Sparkles,
  Loader2,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function RolesPermissionsPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/roles");
      const data = await res.json();
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      if (data.roles?.length > 0) {
        setActiveRole(data.roles[0]);
      }
    } catch {
      toast("Failed to load roles matrix", "error");
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by module
  const modules = Array.from(new Set(permissions.map((p) => p.module)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-7 h-7 text-indigo-600" /> Roles & Granular Permissions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Access control matrix governing students, instructors, branches, curriculum, and administrative operations
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading access control matrix...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
              System Roles ({roles.length})
            </span>
            <div className="space-y-2">
              {roles.map((r) => {
                const isSelected = activeRole?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setActiveRole(r)}
                    className={`p-4 rounded-2xl border cursor-pointer transition select-none flex items-start justify-between ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                        : "bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{r.displayName}</span>
                        {r.isSystem && (
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                              isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            System
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-1 leading-relaxed ${
                          isSelected ? "text-indigo-100" : "text-slate-500"
                        }`}
                      >
                        {r.description}
                      </p>
                      <span
                        className={`text-[10px] font-mono mt-2 block font-semibold ${
                          isSelected ? "text-indigo-200" : "text-indigo-600"
                        }`}
                      >
                        {r.name}
                      </span>
                    </div>

                    <div className="mt-1">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Granular Permission Checklist for Selected Role */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Privileges for {activeRole?.displayName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeRole?.name === "SUPER_ADMIN"
                    ? "SUPER_ADMIN automatically bypasses all permission checks with unrestricted global access (*)"
                    : "Granular capabilities enabled for this role profile"}
                </p>
              </div>

              {activeRole?.name === "SUPER_ADMIN" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Super Bypass
                </span>
              )}
            </div>

            <div className="space-y-6">
              {modules.map((mod) => {
                const modPerms = permissions.filter((p) => p.module === mod);
                return (
                  <div key={mod} className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      {mod} Module
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {modPerms.map((perm) => {
                        const isGranted =
                          activeRole?.name === "SUPER_ADMIN" ||
                          activeRole?.permissions?.some((p: any) => p.code === perm.code);

                        return (
                          <div
                            key={perm.id}
                            className={`p-3 rounded-xl border flex items-start space-x-3 text-xs transition ${
                              isGranted
                                ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-950"
                                : "bg-slate-50 border-slate-100 text-slate-400 opacity-60"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center ${
                                isGranted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
                              }`}
                            >
                              {isGranted && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-slate-900">{perm.code}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{perm.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

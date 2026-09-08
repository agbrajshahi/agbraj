"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Loader2, Edit, Trash2, LucideIcon } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { FileUpload } from "@/components/ui/FileUpload";

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select" | "image" | "file" | "url";
  options?: { value: string; label: string }[] | string[];
  required?: boolean;
  placeholder?: string;
  colSpan?: 1 | 2;
  rows?: number;
  accept?: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface ResourceManagerProps {
  title: string;
  description: string;
  icon: LucideIcon;
  endpoint: string; // e.g. /api/cms/gallery
  fields: FieldDef[];
  columns: ColumnDef[];
  defaultValues: Record<string, any>;
  searchKeys?: string[];
  accent?: string; // tailwind color name e.g. "blue"
  createLabel?: string;
  readOnlyCreate?: boolean;
  extraActions?: (row: any, refresh: () => void) => React.ReactNode;
  filterOptions?: { key: string; label: string; options: string[] };
  itemsKey?: string;
}

const accentMap: Record<string, { btn: string; text: string }> = {
  blue: { btn: "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20", text: "text-blue-600" },
  indigo: { btn: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20", text: "text-indigo-600" },
  emerald: { btn: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20", text: "text-emerald-600" },
  teal: { btn: "bg-teal-600 hover:bg-teal-500 shadow-teal-600/20", text: "text-teal-600" },
  amber: { btn: "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20", text: "text-amber-600" },
  rose: { btn: "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20", text: "text-rose-600" },
  purple: { btn: "bg-purple-600 hover:bg-purple-500 shadow-purple-600/20", text: "text-purple-600" },
  slate: { btn: "bg-slate-800 hover:bg-slate-700 shadow-slate-800/20", text: "text-slate-700" },
};

export const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200", APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200", REPLIED: "bg-emerald-50 text-emerald-700 border-emerald-200", COMPLETED: "bg-slate-100 text-slate-600 border-slate-200",
    DRAFT: "bg-amber-50 text-amber-700 border-amber-200", PENDING: "bg-amber-50 text-amber-700 border-amber-200", NEW: "bg-blue-50 text-blue-700 border-blue-200", UNDER_REVIEW: "bg-indigo-50 text-indigo-700 border-indigo-200", CONTACTED: "bg-purple-50 text-purple-700 border-purple-200", READ: "bg-slate-100 text-slate-600 border-slate-200",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200", CANCELLED: "bg-rose-50 text-rose-700 border-rose-200", CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[s] || "bg-slate-100 text-slate-600 border-slate-200"}`}>{s}</span>;
};

export function ResourceManager(props: ResourceManagerProps) {
  const { toast } = useToast();
  const Icon = props.icon;
  const accent = accentMap[props.accent || "blue"];
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [editing, setEditing] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(props.defaultValues);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(props.endpoint);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to load");
      setItems(d[props.itemsKey || "items"] || []);
    } catch (e: any) { toast(e.message, "error"); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(props.defaultValues); setIsOpen(true); };
  const openEdit = (row: any) => {
    const f: Record<string, any> = {};
    props.fields.forEach((fd) => {
      let v = row[fd.name];
      if (fd.type === "date" && v) v = new Date(v).toISOString().slice(0, 10);
      f[fd.name] = v ?? "";
    });
    setEditing(row); setForm(f); setIsOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(editing ? `${props.endpoint}/${editing.id}` : props.endpoint, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      toast(editing ? "Updated successfully" : "Created successfully", "success");
      setIsOpen(false); load();
    } catch (e: any) { toast(e.message, "error"); } finally { setSaving(false); }
  };

  const remove = async (row: any) => {
    if (!confirm("Delete this item permanently?")) return;
    const res = await fetch(`${props.endpoint}/${row.id}`, { method: "DELETE" });
    if (res.ok) { toast("Deleted", "info"); load(); } else toast("Delete failed", "error");
  };

  const filtered = items.filter((it) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (props.searchKeys || ["title", "name"]).some((k) => String(it[k] || "").toLowerCase().includes(q));
    const matchesFilter = filter === "ALL" || !props.filterOptions || it[props.filterOptions.key] === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5"><Icon className={`w-7 h-7 ${accent.text}`} /> {props.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{props.description}</p>
        </div>
        {!props.readOnlyCreate && (
          <button onClick={openCreate} className={`inline-flex items-center gap-2 px-4 py-2 ${accent.btn} text-white text-xs font-bold rounded-xl shadow-md transition`}><Plus className="w-4 h-4" /> {props.createLabel || "Add New"}</button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl" />
        </div>
        {props.filterOptions && (
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
            <option value="ALL">All {props.filterOptions.label}</option>
            {props.filterOptions.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        <span className="px-3 py-2 text-xs text-slate-500 self-center">{filtered.length} items</span>
      </div>

      {loading ? (
        <div className="p-16 text-center"><Loader2 className={`w-8 h-8 animate-spin mx-auto ${accent.text}`} /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200"><Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" /><h3 className="text-sm font-bold text-slate-800">Nothing here yet</h3><p className="text-xs text-slate-500 mt-1">Create your first item to get started.</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-50 border-b text-slate-500 uppercase font-semibold text-[10px]">
              {props.columns.map((c) => <th key={c.key} className="p-3">{c.label}</th>)}<th className="p-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  {props.columns.map((c) => <td key={c.key} className="p-3 align-middle">{c.render ? c.render(row) : <span className="text-slate-700">{String(row[c.key] ?? "—")}</span>}</td>)}
                  <td className="p-3 text-right">
                    <div className="flex gap-1.5 justify-end items-center flex-wrap">
                      {props.extraActions?.(row, load)}
                      <button onClick={() => openEdit(row)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(row)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? `Edit ${props.title}` : `New ${props.title}`} maxWidth="2xl">
        <form onSubmit={save} className="grid grid-cols-2 gap-4 text-xs">
          {props.fields.map((fd) => {
            const span = fd.colSpan === 2 || fd.type === "textarea" || fd.type === "image" || fd.type === "file" ? "col-span-2" : "col-span-2 sm:col-span-1";
            const cls = "w-full px-3 py-2 border border-slate-200 rounded-xl bg-white";
            const opts = (fd.options || []).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
            return (
              <div key={fd.name} className={span}>
                {fd.type === "image" || fd.type === "file" ? (
                  <FileUpload label={fd.label} entityType="GENERAL" category={fd.type === "image" ? "CMS_IMAGE" : "CMS_DOC"} accept={fd.accept || (fd.type === "image" ? "image/*" : undefined)} currentUrl={form[fd.name] || null} onSuccess={(url) => setForm({ ...form, [fd.name]: url })} />
                ) : (
                  <>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{fd.label}{fd.required && " *"}</label>
                    {fd.type === "textarea" ? (
                      <textarea rows={fd.rows || 3} required={fd.required} value={form[fd.name] ?? ""} onChange={(e) => setForm({ ...form, [fd.name]: e.target.value })} placeholder={fd.placeholder} className={cls} />
                    ) : fd.type === "select" ? (
                      <select required={fd.required} value={form[fd.name] ?? ""} onChange={(e) => setForm({ ...form, [fd.name]: e.target.value })} className={cls}>
                        {!fd.required && <option value="">—</option>}
                        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input type={fd.type === "url" ? "url" : fd.type || "text"} required={fd.required} value={form[fd.name] ?? ""} onChange={(e) => setForm({ ...form, [fd.name]: e.target.value })} placeholder={fd.placeholder} className={cls} />
                    )}
                  </>
                )}
              </div>
            );
          })}
          <div className="col-span-2 flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={saving} className={`px-4 py-2 font-bold text-white rounded-xl ${accent.btn}`}>{saving ? "Saving..." : editing ? "Save Changes" : "Create"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

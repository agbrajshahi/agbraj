"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Check, FileText, AlertCircle, Loader2 } from "lucide-react";

interface FileUploadProps {
  onSuccess: (url: string, fileData: any) => void;
  entityType?: "STUDENT" | "TEACHER" | "BRANCH" | "COURSE" | "GENERAL";
  entityId?: number;
  category?: string;
  accept?: string;
  label?: string;
  currentUrl?: string | null;
  maxSizeMB?: number;
}

export function FileUpload({
  onSuccess,
  entityType = "GENERAL",
  entityId,
  category = "GENERAL",
  accept = "image/*,application/pdf",
  label = "Upload Image or Document",
  currentUrl,
  maxSizeMB = 5,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds maximum limit of ${maxSizeMB}MB`);
      return;
    }

    setFileName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      if (entityId) formData.append("entityId", entityId.toString());
      formData.append("category", category);
      formData.append("title", file.name);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setPreview(data.url);
      onSuccess(data.url, data.document);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onSuccess("", null);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
        {label}
      </label>

      {preview ? (
        <div className="relative group border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            {preview.startsWith("http") || preview.startsWith("/") || preview.startsWith("data:") ? (
              <img
                src={preview}
                alt="Uploaded preview"
                className="w-12 h-12 object-cover rounded-lg border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="truncate">
              <p className="text-sm font-medium text-slate-900 truncate">
                {fileName || "Uploaded File"}
              </p>
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Ready
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition hover:border-blue-500 hover:bg-blue-50/30 ${
            error ? "border-rose-300 bg-rose-50/20" : "border-slate-300 bg-slate-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          {uploading ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
              <p className="text-xs text-slate-500 font-medium">Uploading securely...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700">Click to upload file</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, PDF up to {maxSizeMB}MB</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

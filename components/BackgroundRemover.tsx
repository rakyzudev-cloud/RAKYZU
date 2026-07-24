"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Download, Eraser, X, Info, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackgroundRemover() {
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    setOriginalPreview(URL.createObjectURL(file));
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clear = () => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setOriginalPreview(null);
    setFileName("");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">AI Background Removal – Temporary Status</p>
          <p className="mt-1 opacity-90">
            The previous open-source library caused build failures with Next.js 14.
            We are switching to a more compatible open-source solution (MediaPipe).
            This page is temporarily simplified so the rest of the site can deploy successfully.
            Full AI background removal will be restored in the next update.
          </p>
        </div>
      </div>

      {!originalPreview ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all",
            "border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <Eraser className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            Drop an image here or click to browse
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Full AI processing will be available again shortly.
          </p>
        </div>
      ) : (
        <div className="card space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{fileName}</p>
            <button onClick={clear} className="btn-secondary gap-2 text-sm">
              <X className="h-4 w-4" /> Clear
            </button>
          </div>
          <div className="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={originalPreview} alt="Preview" className="w-full object-contain max-h-96" />
          </div>
          <p className="text-center text-sm text-slate-500">
            AI background removal is being updated. Please check back soon.
          </p>
        </div>
      )}
    </div>
  );
}

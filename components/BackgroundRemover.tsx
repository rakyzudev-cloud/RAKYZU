"use client";

import { useCallback, useRef, useState } from "react";
import { removeBackground } from "@imgly/background-removal";
import {
  Upload,
  Download,
  Eraser,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RemovalResult {
  originalFile: File;
  originalPreview: string;
  resultBlob: Blob | null;
  resultPreview: string | null;
  originalSize: number;
  resultSize: number | null;
  error: string | null;
  status: "idle" | "processing" | "done" | "error";
  progress: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function BackgroundRemover() {
  const [result, setResult] = useState<RemovalResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setResult({
          originalFile: file,
          originalPreview: "",
          resultBlob: null,
          resultPreview: null,
          originalSize: file.size,
          resultSize: null,
          error: "Please select a valid image file (JPG, PNG, WebP, etc.).",
          status: "error",
          progress: 0,
        });
        return;
      }

      if (result?.originalPreview) URL.revokeObjectURL(result.originalPreview);
      if (result?.resultPreview) URL.revokeObjectURL(result.resultPreview);

      const originalPreview = URL.createObjectURL(file);
      setResult({
        originalFile: file,
        originalPreview,
        resultBlob: null,
        resultPreview: null,
        originalSize: file.size,
        resultSize: null,
        error: null,
        status: "processing",
        progress: 0,
      });

      try {
      const blob = await removeBackground(file, {
  progress: (key, current, total) => {
    if (total > 0) {
      const pct = Math.min(Math.round((current / total) * 100), 99);
      setResult((prev) => (prev ? { ...prev, progress: pct } : prev));
    }
  },
  model: "isnet_fp16",
  publicPath: "https://static.imgly.com/@imgly/background-removal-data/1.5.5/dist/",
  output: {
    format: "image/png",
    quality: 0.9,
  },
});

        const resultPreview = URL.createObjectURL(blob);

        setResult((prev) =>
          prev
            ? {
                ...prev,
                resultBlob: blob,
                resultPreview,
                resultSize: blob.size,
                status: "done",
                progress: 100,
              }
            : prev
        );
      } catch (err) {
        console.error("Background removal error:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Background removal failed. Please try a different image.";
        setResult((prev) =>
          prev ? { ...prev, status: "error", error: message, progress: 0 } : prev
        );
      }
    },
    [result]
  );

  const handleFile = useCallback((file: File) => processImage(file), [processImage]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const clearResult = () => {
    if (result?.originalPreview) URL.revokeObjectURL(result.originalPreview);
    if (result?.resultPreview) URL.revokeObjectURL(result.resultPreview);
    setResult(null);
  };

  const downloadResult = () => {
    if (!result?.resultBlob) return;
    const url = URL.createObjectURL(result.resultBlob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = result.originalFile.name.replace(/\.[^.]+$/, "");
    a.download = "no-bg-" + baseName + ".png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isBusy = result?.status === "processing";

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">AI Background Removal (open-source model)</p>
          <p className="mt-1 opacity-90">
            Works with any subject â€” people, products, logos, and objects. Everything runs locally in your browser.
          </p>
        </div>
      </div>

      {!result && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all",
            isDragging
              ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
              : "border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-500"
          )}
        >
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelect} className="hidden" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
            <Upload className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Drop an image here or click to browse</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Supported: JPG, PNG, WebP, and most common formats.</p>
        </div>
      )}

      {result && (
        <div className="card space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {result.status === "processing" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processingâ€¦ {result.progress}%
                </span>
              )}
              {result.status === "done" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                </span>
              )}
              {result.status === "error" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                  <AlertCircle className="h-3.5 w-3.5" /> Failed
                </span>
              )}
            </div>
            <button type="button" onClick={clearResult} className="btn-secondary gap-2 text-sm" disabled={isBusy}>
              <X className="h-4 w-4" /> Clear
            </button>
          </div>

          {result.status === "processing" && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>Removing backgroundâ€¦</span>
                <span>{result.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full rounded-full bg-primary-600 transition-all duration-300" style={{ width: result.progress + "%" }} />
              </div>
            </div>
          )}

          {result.status === "error" && result.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {result.error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Original â€” {formatBytes(result.originalSize)}
              </p>
              <div className="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                {result.originalPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.originalPreview} alt="Original" className="w-full object-contain" />
                )}
              </div>
              <p className="mt-2 truncate text-sm text-slate-600 dark:text-slate-400">{result.originalFile.name}</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Background removed
                {result.resultSize != null && " â€” " + formatBytes(result.resultSize)}
              </p>
              <div
                className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                }}
              >
                {result.status === "done" && result.resultPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.resultPreview} alt="Background removed" className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100/60 dark:bg-slate-900/60">
                    {isBusy && <Loader2 className="h-10 w-10 animate-spin text-primary-600" />}
                    {result.status === "error" && <AlertCircle className="h-10 w-10 text-red-500" />}
                    {result.status !== "processing" && result.status !== "error" && (
                      <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {result.status === "done" && result.resultBlob && (
            <div className="flex justify-end">
              <button type="button" onClick={downloadResult} className="btn-primary gap-2">
                <Download className="h-4 w-4" /> Download PNG (Transparent)
              </button>
            </div>
          )}
        </div>
      )}

      {!result && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <Eraser className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Drop or select an image. The first run will download the AI model (~20-80 MB depending on quality) and cache it for future use.
          </p>
        </div>
      )}
    </div>
  );
}

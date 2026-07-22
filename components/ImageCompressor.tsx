"use client";

import { useCallback, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import {
  Upload,
  Download,
  Image as ImageIcon,
  Settings2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OutputFormat = "original" | "image/jpeg" | "image/png" | "image/webp";

interface CompressionOptions {
  quality: number; // 0.1 – 1.0
  maxWidthOrHeight: number;
  maxSizeMB: number;
  useWebWorker: boolean;
  outputFormat: OutputFormat;
}

interface FileResult {
  originalFile: File;
  originalPreview: string;
  compressedFile: File | null;
  compressedPreview: string | null;
  originalSize: number;
  compressedSize: number | null;
  error: string | null;
  status: "idle" | "compressing" | "done" | "error";
}

const DEFAULT_OPTIONS: CompressionOptions = {
  quality: 0.8,
  maxWidthOrHeight: 1920,
  maxSizeMB: 1,
  useWebWorker: true,
  outputFormat: "original",
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getSavingsPercent(original: number, compressed: number | null): string {
  if (!compressed || original === 0) return "—";
  const savings = ((original - compressed) / original) * 100;
  return `${savings.toFixed(1)}%`;
}

export function ImageCompressor() {
  const [options, setOptions] = useState<CompressionOptions>(DEFAULT_OPTIONS);
  const [results, setResults] = useState<FileResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateOption = <K extends keyof CompressionOptions>(
    key: K,
    value: CompressionOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const processFile = useCallback(
    async (file: File): Promise<FileResult> => {
      const originalPreview = URL.createObjectURL(file);
      const base: FileResult = {
        originalFile: file,
        originalPreview,
        compressedFile: null,
        compressedPreview: null,
        originalSize: file.size,
        compressedSize: null,
        error: null,
        status: "compressing",
      };

      try {
        // Options object for browser-image-compression.
        // Explicit library type is avoided because the package's type declarations
        // do not consistently export a named 'Options' member across versions.
        const compressionOpts: {
          maxSizeMB: number;
          maxWidthOrHeight: number;
          useWebWorker: boolean;
          initialQuality: number;
          alwaysKeepResolution: boolean;
          fileType?: string;
        } = {
          maxSizeMB: options.maxSizeMB,
          maxWidthOrHeight: options.maxWidthOrHeight,
          useWebWorker: options.useWebWorker,
          initialQuality: options.quality,
          alwaysKeepResolution: false,
        };

        if (options.outputFormat !== "original") {
          compressionOpts.fileType = options.outputFormat;
        }

        const compressed = await imageCompression(file, compressionOpts);
        const compressedPreview = URL.createObjectURL(compressed);

        return {
          ...base,
          compressedFile: compressed,
          compressedPreview,
          compressedSize: compressed.size,
          status: "done",
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Compression failed unexpectedly.";
        return {
          ...base,
          error: message,
          status: "error",
        };
      }
    },
    [options]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );

      if (imageFiles.length === 0) {
        return;
      }

      // Limit concurrent processing for UX; process sequentially for simplicity and memory safety
      const newResults: FileResult[] = imageFiles.map((file) => ({
        originalFile: file,
        originalPreview: URL.createObjectURL(file),
        compressedFile: null,
        compressedPreview: null,
        originalSize: file.size,
        compressedSize: null,
        error: null,
        status: "compressing" as const,
      }));

      setResults((prev) => [...prev, ...newResults]);

      for (let i = 0; i < imageFiles.length; i++) {
        const result = await processFile(imageFiles[i]);
        setResults((prev) => {
          const updated = [...prev];
          // Find the matching entry by original file reference or last matching
          const idx = updated.findIndex(
            (r) =>
              r.originalFile === imageFiles[i] && r.status === "compressing"
          );
          if (idx !== -1) {
            // Revoke old preview if we created a temporary one
            if (updated[idx].originalPreview) {
              // keep it; we already have it
            }
            updated[idx] = result;
          }
          return updated;
        });
      }
    },
    [processFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
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
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeResult = (index: number) => {
    setResults((prev) => {
      const item = prev[index];
      if (item.originalPreview) URL.revokeObjectURL(item.originalPreview);
      if (item.compressedPreview) URL.revokeObjectURL(item.compressedPreview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAll = () => {
    results.forEach((r) => {
      if (r.originalPreview) URL.revokeObjectURL(r.originalPreview);
      if (r.compressedPreview) URL.revokeObjectURL(r.compressedPreview);
    });
    setResults([]);
  };

  const downloadFile = (file: File, suggestedName?: string) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName || file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reprocessAll = async () => {
    if (results.length === 0) return;
    const files = results.map((r) => r.originalFile);
    // Clear previous results and re-run
    results.forEach((r) => {
      if (r.originalPreview) URL.revokeObjectURL(r.originalPreview);
      if (r.compressedPreview) URL.revokeObjectURL(r.compressedPreview);
    });
    setResults([]);
    await handleFiles(files);
  };

  return (
    <div className="space-y-8">
      {/* Settings Panel */}
      <div className="card">
        <div className="mb-5 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Compression Preferences
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Quality */}
          <div>
            <label className="label" htmlFor="quality">
              Quality ({Math.round(options.quality * 100)}%)
            </label>
            <input
              id="quality"
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={options.quality}
              onChange={(e) =>
                updateOption("quality", parseFloat(e.target.value))
              }
              className="w-full accent-primary-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Smaller file</span>
              <span>Higher quality</span>
            </div>
          </div>

          {/* Max dimension */}
          <div>
            <label className="label" htmlFor="maxDim">
              Max Width / Height (px)
            </label>
            <input
              id="maxDim"
              type="number"
              min={100}
              max={8000}
              step={50}
              value={options.maxWidthOrHeight}
              onChange={(e) =>
                updateOption(
                  "maxWidthOrHeight",
                  Math.max(100, parseInt(e.target.value, 10) || 1920)
                )
              }
              className="input-field"
            />
          </div>

          {/* Max size MB */}
          <div>
            <label className="label" htmlFor="maxSize">
              Target Max Size (MB)
            </label>
            <input
              id="maxSize"
              type="number"
              min={0.1}
              max={50}
              step={0.1}
              value={options.maxSizeMB}
              onChange={(e) =>
                updateOption(
                  "maxSizeMB",
                  Math.max(0.1, parseFloat(e.target.value) || 1)
                )
              }
              className="input-field"
            />
          </div>

          {/* Output format */}
          <div>
            <label className="label" htmlFor="format">
              Output Format
            </label>
            <select
              id="format"
              value={options.outputFormat}
              onChange={(e) =>
                updateOption("outputFormat", e.target.value as OutputFormat)
              }
              className="input-field"
            >
              <option value="original">Keep original</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>

          {/* Web Worker */}
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={options.useWebWorker}
                onChange={(e) => updateOption("useWebWorker", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Use Web Worker (recommended)
              </span>
            </label>
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
            <button
              type="button"
              onClick={reprocessAll}
              className="btn-secondary gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Re-compress with current settings
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="btn-secondary gap-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <X className="h-4 w-4" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all",
          isDragging
            ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30"
            : "border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-500 dark:hover:bg-slate-800/80"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onFileSelect}
          className="hidden"
        />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
          <Upload className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          Drop images here or click to browse
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Supports JPG, PNG, WebP, GIF, and other common image formats. Multiple
          files allowed.
        </p>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Results ({results.length})
          </h2>

          <div className="grid gap-6">
            {results.map((result, index) => (
              <div
                key={`${result.originalFile.name}-${index}`}
                className="card overflow-hidden"
              >
                <div className="flex flex-col gap-6 lg:flex-row">
                  {/* Previews */}
                  <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Original */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Original
                      </p>
                      <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={result.originalPreview}
                          alt="Original"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {result.originalFile.name}
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatBytes(result.originalSize)}
                      </p>
                    </div>

                    {/* Compressed */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                        Compressed
                      </p>
                      <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                        {result.status === "compressing" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                          </div>
                        )}
                        {result.status === "done" && result.compressedPreview && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={result.compressedPreview}
                            alt="Compressed"
                            className="h-full w-full object-contain"
                          />
                        )}
                        {result.status === "error" && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {result.error}
                            </p>
                          </div>
                        )}
                      </div>
                      {result.status === "done" && result.compressedSize !== null && (
                        <>
                          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                            {formatBytes(result.compressedSize)}
                          </p>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            Saved {getSavingsPercent(result.originalSize, result.compressedSize)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex w-full flex-col justify-between gap-4 lg:w-48">
                    <div className="flex items-center gap-2">
                      {result.status === "compressing" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Processing…
                        </span>
                      )}
                      {result.status === "done" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ready
                        </span>
                      )}
                      {result.status === "error" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Failed
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {result.status === "done" && result.compressedFile && (
                        <button
                          type="button"
                          onClick={() =>
                            downloadFile(
                              result.compressedFile!,
                              `compressed-${result.originalFile.name}`
                            )
                          }
                          className="btn-primary w-full gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeResult(index)}
                        className="btn-secondary w-full gap-2"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state helper */}
      {results.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Adjust the preferences above, then drop or select one or more images
            to begin compression. All processing occurs locally in your browser.
          </p>
        </div>
      )}
    </div>
  );
}

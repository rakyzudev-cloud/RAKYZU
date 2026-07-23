"use client";

import { useCallback, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import {
  Upload,
  Download,
  Video,
  Settings2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OutputFormat = "mp4" | "webm";
type ResolutionPreset = "original" | "1080" | "720" | "480" | "360";

interface VideoOptions {
  format: OutputFormat;
  resolution: ResolutionPreset;
  videoBitrate: string;
  audioBitrate: string;
  crf: number;
  useCRF: boolean;
}

interface VideoResult {
  originalFile: File;
  originalPreview: string;
  compressedBlob: Blob | null;
  compressedPreview: string | null;
  originalSize: number;
  compressedSize: number | null;
  error: string | null;
  status: "idle" | "loading-ffmpeg" | "compressing" | "done" | "error";
  progress: number;
  log: string;
}

const DEFAULT_OPTIONS: VideoOptions = {
  format: "mp4",
  resolution: "720",
  videoBitrate: "1500k",
  audioBitrate: "128k",
  crf: 23,
  useCRF: true,
};

const MAX_INPUT_SIZE = 500 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getSavingsPercent(original: number, compressed: number | null): string {
  if (!compressed || original === 0) return "—";
  const savings = ((original - compressed) / original) * 100;
  return savings.toFixed(1) + "%";
}

function getScaleFilter(resolution: ResolutionPreset): string | null {
  switch (resolution) {
    case "1080": return "scale=-2:1080";
    case "720": return "scale=-2:720";
    case "480": return "scale=-2:480";
    case "360": return "scale=-2:360";
    default: return null;
  }
}

export function VideoCompressor() {
  const [options, setOptions] = useState<VideoOptions>(DEFAULT_OPTIONS);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
const ffmpegPromiseRef = useRef<Promise<FFmpeg> | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);

  const updateOption = <K extends keyof VideoOptions>(key: K, value: VideoOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

    // force rebuild 2026-07-24
    
      const loadFFmpeg = useCallback(async () => {
  if (ffmpegRef.current?.loaded) {
    return ffmpegRef.current;
  }
  if (ffmpegPromiseRef.current) {
    return ffmpegPromiseRef.current;
  }

  ffmpegPromiseRef.current = (async () => {
    setResult((prev) =>
      prev
        ? { ...prev, status: "loading-ffmpeg", log: "Loading video engine…", progress: 0 }
        : prev
    );

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    ffmpeg.on("log", ({ message }) => {
      setResult((prev) => (prev ? { ...prev, log: message } : prev));
    });

    ffmpeg.on("progress", ({ progress }) => {
      setResult((prev) =>
        prev ? { ...prev, progress: Math.min(Math.round(progress * 100), 99) } : prev
      );
    });

    try {
      const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.10/dist/umd";
const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript");
const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm");
const workerURL = await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript");
      await ffmpeg.load({ coreURL, wasmURL, workerURL });
      return ffmpeg;
    } catch (err) {
      ffmpegPromiseRef.current = null;
      ffmpegRef.current = null;
      console.error("FFmpeg load error:", err);
      throw new Error(
        err instanceof Error
          ? `Failed to load video engine: ${err.message}`
          : "Failed to load video engine. Please refresh and try again."
      );
    }
  })();

  return ffmpegPromiseRef.current;
}, []);

  const processVideo = useCallback(
    async (file: File) => {
      if (file.size > MAX_INPUT_SIZE) {
        setResult({
          originalFile: file,
          originalPreview: URL.createObjectURL(file),
          compressedBlob: null,
          compressedPreview: null,
          originalSize: file.size,
          compressedSize: null,
          error: "File exceeds the maximum allowed size of 500 MB (your file is " + formatBytes(file.size) + ").",
          status: "error",
          progress: 0,
          log: "",
        });
        return;
      }

      const originalPreview = URL.createObjectURL(file);
      setResult({
        originalFile: file,
        originalPreview,
        compressedBlob: null,
        compressedPreview: null,
        originalSize: file.size,
        compressedSize: null,
        error: null,
        status: "loading-ffmpeg",
        progress: 0,
        log: "Loading video processing engine…",
      });

      try {
        const ffmpeg = await loadFFmpeg();
        if (!ffmpeg) throw new Error("Failed to load FFmpeg");

        setResult((prev) =>
          prev ? { ...prev, status: "compressing", progress: 0, log: "Starting compression…" } : prev
        );

        const ext = (file.name.match(/\.[^.]+$/) || [".mp4"])[0];
        const inputName = "input" + ext;
        const outputExt = options.format === "webm" ? "webm" : "mp4";
        const outputName = "output." + outputExt;

        await ffmpeg.writeFile(inputName, await fetchFile(file));

        const args: string[] = ["-i", inputName];

        if (options.format === "mp4") {
          args.push("-c:v", "libx264");
          if (options.useCRF) {
            args.push("-crf", String(options.crf), "-preset", "medium");
          } else {
            args.push("-b:v", options.videoBitrate);
          }
          args.push("-c:a", "aac", "-b:a", options.audioBitrate, "-movflags", "+faststart");
        } else {
          args.push("-c:v", "libvpx-vp9");
          if (options.useCRF) {
            args.push("-crf", String(options.crf), "-b:v", "0");
          } else {
            args.push("-b:v", options.videoBitrate);
          }
          args.push("-c:a", "libopus", "-b:a", options.audioBitrate);
        }

        const scale = getScaleFilter(options.resolution);
        if (scale) args.push("-vf", scale);

        args.push("-y", outputName);

const threadCount = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);
args.push("-threads", String(threadCount));

        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const mime = options.format === "webm" ? "video/webm" : "video/mp4";
        // @ts-expect-error Uint8Array buffer
        const blob = new Blob([data.buffer], { type: mime });
        const compressedPreview = URL.createObjectURL(blob);

        setResult((prev) =>
          prev
            ? {
                ...prev,
                compressedBlob: blob,
                compressedPreview,
                compressedSize: blob.size,
                status: "done",
                progress: 100,
                log: "Compression completed successfully.",
              }
            : prev
        );

        try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(outputName);
        } catch {}
      } catch (err) {
        console.error("FFmpeg error:", err);
        let message = "Video compression failed.";
        if (err instanceof Error) {
          message = err.message;
          // Surface common root causes more clearly
          if (message.includes("SharedArrayBuffer") || message.includes("cross-origin") || message.includes("COOP") || message.includes("COEP")) {
            message = "Browser security headers are missing (Cross-Origin Isolation). Please redeploy after the latest next.config.mjs update.";
          } else if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch")) {
            message = "Failed to download the FFmpeg engine. Check your network or try again.";
          } else if (message.includes("Out of memory") || message.includes("memory")) {
            message = "The browser ran out of memory. Try a smaller video or lower resolution settings.";
          }
        }
        setResult((prev) =>
          prev ? { ...prev, status: "error", error: message, progress: 0 } : prev
        );
      }
    },
    [loadFFmpeg, options]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("video/")) {
        setResult({
          originalFile: file,
          originalPreview: "",
          compressedBlob: null,
          compressedPreview: null,
          originalSize: file.size,
          compressedSize: null,
          error: "Please select a valid video file.",
          status: "error",
          progress: 0,
          log: "",
        });
        return;
      }
      if (result?.originalPreview) URL.revokeObjectURL(result.originalPreview);
      if (result?.compressedPreview) URL.revokeObjectURL(result.compressedPreview);
      processVideo(file);
    },
    [processVideo, result]
  );

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
    if (result?.compressedPreview) URL.revokeObjectURL(result.compressedPreview);
    setResult(null);
  };

  const downloadResult = () => {
    if (!result?.compressedBlob) return;
    const url = URL.createObjectURL(result.compressedBlob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = result.originalFile.name.replace(/\.[^.]+$/, "");
    a.download = "compressed-" + baseName + "." + options.format;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isBusy = result?.status === "compressing" || result?.status === "loading-ffmpeg";

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Browser-based video compression</p>
          <p className="mt-1 opacity-90">
            Maximum input size is 500 MB. Processing large videos can take several minutes and is limited by your device memory and CPU. All work stays on your device.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-5 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Compression Preferences</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label" htmlFor="vformat">Output Format</label>
            <select id="vformat" value={options.format} onChange={(e) => updateOption("format", e.target.value as OutputFormat)} className="input-field" disabled={isBusy}>
              <option value="mp4">MP4 (H.264 + AAC)</option>
              <option value="webm">WebM (VP9 + Opus)</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="vres">Resolution</label>
            <select id="vres" value={options.resolution} onChange={(e) => updateOption("resolution", e.target.value as ResolutionPreset)} className="input-field" disabled={isBusy}>
              <option value="original">Keep original</option>
              <option value="1080">1080p</option>
              <option value="720">720p</option>
              <option value="480">480p</option>
              <option value="360">360p</option>
            </select>
          </div>

          <div>
            <label className="label">Quality Mode</label>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={options.useCRF} onChange={() => updateOption("useCRF", true)} disabled={isBusy} />
                CRF (recommended)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={!options.useCRF} onChange={() => updateOption("useCRF", false)} disabled={isBusy} />
                Bitrate
              </label>
            </div>
          </div>

          {options.useCRF ? (
            <div>
              <label className="label" htmlFor="vcrf">CRF Quality ({options.crf}) — lower = better</label>
              <input id="vcrf" type="range" min={18} max={32} step={1} value={options.crf} onChange={(e) => updateOption("crf", parseInt(e.target.value, 10))} className="w-full accent-primary-600" disabled={isBusy} />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>Higher quality</span>
                <span>Smaller file</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="vbitrate">Video Bitrate</label>
              <select id="vbitrate" value={options.videoBitrate} onChange={(e) => updateOption("videoBitrate", e.target.value)} className="input-field" disabled={isBusy}>
                <option value="500k">500 kbps</option>
                <option value="1000k">1 Mbps</option>
                <option value="1500k">1.5 Mbps</option>
                <option value="2500k">2.5 Mbps</option>
                <option value="4000k">4 Mbps</option>
                <option value="6000k">6 Mbps</option>
              </select>
            </div>
          )}

          <div>
            <label className="label" htmlFor="abitrate">Audio Bitrate</label>
            <select id="abitrate" value={options.audioBitrate} onChange={(e) => updateOption("audioBitrate", e.target.value)} className="input-field" disabled={isBusy}>
              <option value="64k">64 kbps</option>
              <option value="96k">96 kbps</option>
              <option value="128k">128 kbps</option>
              <option value="160k">160 kbps</option>
              <option value="192k">192 kbps</option>
            </select>
          </div>
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
          <input ref={fileInputRef} type="file" accept="video/*" onChange={onFileSelect} className="hidden" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
            <Upload className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Drop a video here or click to browse</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Maximum size 500 MB. Supported: MP4, WebM, MOV, AVI, MKV and most common formats.
          </p>
        </div>
      )}

      {result && (
        <div className="card space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {result.status === "loading-ffmpeg" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading engine…
                </span>
              )}
              {result.status === "compressing" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Compressing… {result.progress}%
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

          {(result.status === "compressing" || result.status === "loading-ffmpeg") && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{result.log || "Working…"}</span>
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
                Original — {formatBytes(result.originalSize)}
              </p>
              <div className="overflow-hidden rounded-xl bg-black">
                {result.originalPreview && (
                  <video src={result.originalPreview} controls className="aspect-video w-full" playsInline />
                )}
              </div>
              <p className="mt-2 truncate text-sm text-slate-600 dark:text-slate-400">{result.originalFile.name}</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                Compressed
                {result.compressedSize != null && " — " + formatBytes(result.compressedSize)}
                {result.status === "done" && result.compressedSize != null && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                    (saved {getSavingsPercent(result.originalSize, result.compressedSize)})
                  </span>
                )}
              </p>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                {result.status === "done" && result.compressedPreview ? (
                  <video src={result.compressedPreview} controls className="h-full w-full" playsInline />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {isBusy && <Loader2 className="h-10 w-10 animate-spin text-primary-600" />}
                    {result.status === "error" && <AlertCircle className="h-10 w-10 text-red-500" />}
                  </div>
                )}
              </div>
            </div>
          </div>

          {result.status === "done" && result.compressedBlob && (
            <div className="flex justify-end">
              <button type="button" onClick={downloadResult} className="btn-primary gap-2">
                <Download className="h-4 w-4" /> Download Compressed Video
              </button>
            </div>
          )}
        </div>
      )}

      {!result && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <Video className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Configure the preferences above, then drop or select a video file (max 500 MB). The first run will download the compression engine (~25 MB) and cache it for future use.
          </p>
        </div>
      )}
    </div>
  );
}

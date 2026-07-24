"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Download,
  Eraser,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    SelfieSegmentation: any;
    Module?: any;
  }
}

interface ResultState {
  originalFile: File | null;
  originalPreview: string | null;
  resultPreview: string | null;
  resultBlob: Blob | null;
  status: "idle" | "loading-model" | "processing" | "done" | "error";
  error: string | null;
  progress: number;
}

export function BackgroundRemover() {
  const [state, setState] = useState<ResultState>({
    originalFile: null,
    originalPreview: null,
    resultPreview: null,
    resultBlob: null,
    status: "idle",
    error: null,
    progress: 0,
  });

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selfieSegmentationRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load MediaPipe Selfie Segmentation from CDN
  useEffect(() => {
    const loadMediaPipe = async () => {
      if (typeof window === "undefined") return;
      if (window.SelfieSegmentation) return;

      setState((s) => ({ ...s, status: "loading-model", progress: 10 }));

      // Load the required scripts
      const loadScript = (src: string) =>
        new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.crossOrigin = "anonymous";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        });

      try {
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js");

        setState((s) => ({ ...s, status: "idle", progress: 0 }));
      } catch (err) {
        console.error(err);
        setState((s) => ({
          ...s,
          status: "error",
          error: "Failed to load AI model. Please refresh the page.",
        }));
      }
    };

    loadMediaPipe();
  }, []);

  const processImage = useCallback(async (file: File) => {
    if (!window.SelfieSegmentation) {
      setState((s) => ({
        ...s,
        status: "error",
        error: "AI model is still loading. Please wait a few seconds and try again.",
      }));
      return;
    }

    const originalPreview = URL.createObjectURL(file);
    setState({
      originalFile: file,
      originalPreview,
      resultPreview: null,
      resultBlob: null,
      status: "processing",
      error: null,
      progress: 20,
    });

    try {
      const img = new Image();
      img.src = originalPreview;
      await new Promise((resolve) => (img.onload = resolve));

      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      setState((s) => ({ ...s, progress: 40 }));

      // Initialize Selfie Segmentation
      const selfieSegmentation = new window.SelfieSegmentation({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
      });

      selfieSegmentation.setOptions({
        modelSelection: 1, // 0 = general, 1 = landscape (better quality)
      });

      await new Promise<void>((resolve) => {
        selfieSegmentation.onResults((results: any) => {
          // Create output with transparent background
          const outCanvas = document.createElement("canvas");
          outCanvas.width = img.width;
          outCanvas.height = img.height;
          const outCtx = outCanvas.getContext("2d")!;

          // Draw the segmentation mask
          outCtx.drawImage(results.segmentationMask, 0, 0, outCanvas.width, outCanvas.height);

          // Use the mask to keep only the person
          outCtx.globalCompositeOperation = "source-in";
          outCtx.drawImage(img, 0, 0);

          outCanvas.toBlob(
            (blob) => {
              if (blob) {
                const resultPreview = URL.createObjectURL(blob);
                setState((s) => ({
                  ...s,
                  resultBlob: blob,
                  resultPreview,
                  status: "done",
                  progress: 100,
                }));
              }
              resolve();
            },
            "image/png"
          );
        });

        selfieSegmentation.send({ image: img });
      });
    } catch (err) {
      console.error(err);
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "Background removal failed.",
      }));
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    processImage(file);
  };

  const clear = () => {
    if (state.originalPreview) URL.revokeObjectURL(state.originalPreview);
    if (state.resultPreview) URL.revokeObjectURL(state.resultPreview);
    setState({
      originalFile: null,
      originalPreview: null,
      resultPreview: null,
      resultBlob: null,
      status: "idle",
      error: null,
      progress: 0,
    });
  };

  const download = () => {
    if (!state.resultBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(state.resultBlob);
    a.download = `no-bg-${state.originalFile?.name.replace(/\.[^.]+$/, "") || "image"}.png`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">AI Background Removal (MediaPipe – Open Source)</p>
          <p className="mt-1 opacity-90">
            Uses Google’s MediaPipe Selfie Segmentation model. Best results with photos of people.
            Everything runs locally in your browser.
          </p>
        </div>
      </div>

      {state.status === "idle" && !state.originalPreview && (
        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all",
            isDragging
              ? "border-primary-500 bg-primary-50"
              : "border-slate-300 bg-white hover:border-primary-400 dark:border-slate-600 dark:bg-slate-800"
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Eraser className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Drop an image here or click to browse</h3>
          <p className="mt-2 text-sm text-slate-500">
            Best results with clear photos of people. Output is a transparent PNG.
          </p>
        </div>
      )}

      {(state.status === "loading-model" || state.status === "processing" || state.status === "done" || state.status === "error") && (
        <div className="card space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {state.status === "loading-model" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading AI model…
                </span>
              )}
              {state.status === "processing" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing… {state.progress}%
                </span>
              )}
              {state.status === "done" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                </span>
              )}
              {state.status === "error" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  <AlertCircle className="h-3.5 w-3.5" /> Failed
                </span>
              )}
            </div>
            <button onClick={clear} className="btn-secondary gap-2 text-sm">
              <X className="h-4 w-4" /> Clear
            </button>
          </div>

          {state.status === "error" && state.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Original</p>
              {state.originalPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.originalPreview} alt="Original" className="w-full rounded-xl object-contain bg-slate-100" />
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Background Removed</p>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZWVlIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlZWUiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjY2NjIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==')]">
                {state.resultPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={state.resultPreview} alt="Result" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {(state.status === "processing" || state.status === "loading-model") && (
                      <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {state.status === "done" && state.resultBlob && (
            <div className="flex justify-end">
              <button onClick={download} className="btn-primary gap-2">
                <Download className="h-4 w-4" /> Download PNG (Transparent)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

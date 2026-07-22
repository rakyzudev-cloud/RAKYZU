import type { Metadata } from "next";
import { VideoCompressor } from "@/components/VideoCompressor";

export const metadata: Metadata = {
  title: "Video Compression",
  description:
    "Compress video files up to 500 MB directly in your browser. Control format, resolution, quality (CRF or bitrate), and audio settings. All processing is local and private.",
};

export default function VideoCompressPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Video Compression
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            Compress video files up to 500 MB with full control over format,
            resolution, quality, and audio bitrate. Processing runs entirely in
            your browser using FFmpeg.wasm — no files are uploaded.
          </p>
        </div>

        <VideoCompressor />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { ImageCompressor } from "@/components/ImageCompressor";

export const metadata: Metadata = {
  title: "Image Compression",
  description:
    "Compress images with full control over quality, maximum dimensions, target file size, and output format. All processing runs locally in your browser for complete privacy.",
};

export default function ImageCompressPage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-10 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Image Compression
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            Reduce image file sizes while preserving visual quality. Configure
            quality, maximum dimensions, target size, and output format according
            to your preferences. Every operation executes entirely in your
            browser — no files are uploaded.
          </p>
        </div>

        <ImageCompressor />
      </div>
    </div>
  );
}

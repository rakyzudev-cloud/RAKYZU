import type { Metadata } from "next";
import dynamic from "next/dynamic";

const BackgroundRemover = dynamic(
  () => import("@/components/BackgroundRemover").then((m) => m.BackgroundRemover),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "AI Background Removal",
  description:
    "Remove image backgrounds with high-quality open-source AI. Processing runs entirely in your browser for complete privacy.",
};

export default function BackgroundRemovePage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            AI Background Removal
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            Remove backgrounds from images using open-source AI models that run
            entirely in your browser. No files are uploaded. Download the result
            as a transparent PNG.
          </p>
        </div>

        <BackgroundRemover />
      </div>
    </div>
  );
}

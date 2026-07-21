import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                <span className="text-sm font-bold">R</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Rakyzu Converter
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              A privacy-first, browser-based suite of free tools for image and
              video processing. All conversions and AI operations run locally on
              your device. No files are uploaded to any server.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              Tools
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/image-compress"
                  className="text-sm text-slate-600 transition hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                >
                  Image Compression
                </Link>
              </li>
              <li>
                <Link
                  href="/video-compress"
                  className="text-sm text-slate-600 transition hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                >
                  Video Compression
                </Link>
              </li>
              <li>
                <Link
                  href="/background-remove"
                  className="text-sm text-slate-600 transition hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                >
                  AI Background Removal
                </Link>
              </li>
              <li>
                <Link
                  href="/photo-enhance"
                  className="text-sm text-slate-600 transition hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                >
                  AI Photo Enhancement
                </Link>
              </li>
              <li>
                <Link
                  href="/format-convert"
                  className="text-sm text-slate-600 transition hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                >
                  Format Conversion
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
              About
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>Processing occurs entirely in your browser.</li>
              <li>No account or registration required.</li>
              <li>Open-source AI models for enhancement features.</li>
              <li>Designed for privacy and speed.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            © {currentYear} Rakyzu Converter. All rights reserved. Built for
            local, private media processing.
          </p>
        </div>
      </div>
    </footer>
  );
}

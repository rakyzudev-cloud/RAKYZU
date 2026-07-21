import Link from "next/link";
import {
  Image as ImageIcon,
  Video,
  Eraser,
  Sparkles,
  RefreshCw,
  Shield,
  Zap,
  Lock,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    title: "Image Compression",
    description:
      "Reduce image file size while preserving visual quality. Adjust quality, max dimensions, and output format according to your preferences.",
    href: "/image-compress",
    icon: ImageIcon,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Video Compression",
    description:
      "Compress video files up to 500 MB directly in the browser. Control bitrate, resolution, and format with full user control.",
    href: "/video-compress",
    icon: Video,
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "AI Background Removal",
    description:
      "Remove image backgrounds with high-quality open-source AI models. Processing stays on your device for complete privacy.",
    href: "/background-remove",
    icon: Eraser,
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "AI Photo Enhancement",
    description:
      "Convert blurry or low-resolution photos into sharper, higher-definition images using open-source AI super-resolution techniques.",
    href: "/photo-enhance",
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Format Conversion",
    description:
      "Convert between JPG, PNG, SVG, WebP, and ICO/Favicon formats in either direction. Fast, reliable, and fully local.",
    href: "/format-convert",
    icon: RefreshCw,
    color: "from-rose-500 to-pink-500",
  },
];

const benefits = [
  {
    icon: Lock,
    title: "Privacy First",
    text: "Every operation runs locally in your browser. Your files never leave your device.",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    text: "No upload queues or server delays. Results appear as soon as your device finishes the work.",
  },
  {
    icon: Shield,
    title: "No Registration",
    text: "Use every tool freely without creating an account or providing personal information.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
              <span className="block">Rakyzu Converter</span>
              <span className="mt-2 block bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Free. Private. Powerful.
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              A complete suite of image and video tools that run entirely in your
              browser. Compress media, remove backgrounds with AI, enhance
              photos, and convert formats — without ever uploading a single file.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/image-compress" className="btn-primary gap-2">
                Start Compressing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#features" className="btn-secondary">
                Explore All Tools
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              All Tools in One Place
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Select any tool below to begin. Each feature is designed for
              clarity, control, and complete local processing.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card dark:border-slate-700 dark:bg-slate-800"
                >
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-md`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary-600 dark:text-primary-400">
                    Open tool
                    <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="border-t border-slate-200 bg-gradient-to-r from-primary-600 to-accent-600 py-16 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to process your media?
          </h2>
          <p className="mt-3 text-primary-100">
            Choose a tool and start converting instantly. No sign-up, no
            uploads, no limits beyond your device capabilities.
          </p>
          <Link
            href="/image-compress"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-lg transition hover:bg-primary-50"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

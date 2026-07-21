import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Rakyzu Converter – Free Online Image & Video Tools",
    template: "%s | Rakyzu Converter",
  },
  description:
    "Rakyzu Converter is a free, browser-based toolkit for image compression, video compression, AI background removal, photo enhancement, and multi-format conversion. All processing happens locally in your browser for maximum privacy.",
  keywords: [
    "image compressor",
    "video compressor",
    "background remover",
    "AI photo enhancer",
    "format converter",
    "JPG to PNG",
    "WebP converter",
    "favicon generator",
    "Rakyzu Converter",
  ],
  authors: [{ name: "Rakyzu" }],
  creator: "Rakyzu",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Rakyzu Converter",
    title: "Rakyzu Converter – Free Online Image & Video Tools",
    description:
      "Compress images and videos, remove backgrounds with AI, enhance blurry photos, and convert between formats — all in your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rakyzu Converter",
    description:
      "Free browser-based image & video converter with AI tools. Privacy-first processing.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

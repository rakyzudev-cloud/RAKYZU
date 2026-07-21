import ImageCompressor from "@/components/ImageCompressor";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-white selection:text-black">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold">R</div>
            <span className="font-semibold text-[15px]">XiaoConvert</span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 border border-white/10">V2 RARE • FITUR 1</span>
          </div>
          <div className="hidden md:block text-xs text-white/40">Kompres Gambar • Video 500MB • Remove BG AI • HD AI</div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pt-12 pb-6">
        <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>LIVE REAL CODE - BUKAN MOCKUP</div>
        <h1 className="mt-4 text-5xl md:text-7xl font-bold tracking-tighter leading-[0.85]">Kompres Gambar.<br/>Setting Sesuka Lo.</h1>
        <p className="mt-4 text-white/50 max-w-xl text-[15px]">Quality slider, resize px, ganti format JPG/PNG/WEBP/AVIF. Semua jalan di browser lu, bukan di server gua. Gratis, no limit, file ga pernah ke-upload.</p>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <ImageCompressor />
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-xs text-white/20">© 2026 XiaoConvert V2 • Fitur 1/6 • 100% Client-Side • Built with Next.js + Canvas API</footer>
    </main>
  );
}

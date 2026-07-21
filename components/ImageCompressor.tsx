"use client";
import { useState, useRef, useEffect } from "react";

type FileItem = {
  id: string;
  file: File;
  originalSize: number;
  previewUrl: string;
  compressedUrl?: string;
  compressedSize?: number;
  width?: number;
  height?: number;
  saving?: number;
  status: "idle" | "compressing" | "done";
};

export default function ImageCompressor() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(80);
  const [maxW, setMaxW] = useState(1920);
  const [maxH, setMaxH] = useState(1920);
  const [format, setFormat] = useState<"original"|"jpeg"|"png"|"webp"|"avif">("original");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const compressSingle = (file: File, q: number, w: number, h: number, fmt: string): Promise<{blob: Blob, url: string, size: number, ow: number, oh: number}> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(w / img.width, h / img.height, 1);
        const tw = Math.round(img.width * scale);
        const th = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = tw; canvas.height = th;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, tw, th);
        let mime = fmt === "original" ? file.type : `image/${fmt}`;
        if (mime === "image/jpg") mime = "image/jpeg";
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("blob failed"));
          resolve({ blob, url: URL.createObjectURL(blob), size: blob.size, ow: tw, oh: th });
        }, mime, q/100);
      };
      img.onerror = () => reject(new Error("load failed"));
      img.src = url;
    });
  };

  const handleFiles = (list: FileList) => {
    const newItems: FileItem[] = Array.from(list).filter(f=>f.type.startsWith("image/")).map(f=>({
      id: Math.random().toString(36).slice(2),
      file: f,
      originalSize: f.size,
      previewUrl: URL.createObjectURL(f),
      status: "idle" as const
    }));
    setFiles(prev => [...prev, ...newItems]);
  };

  const recompressAll = async () => {
    if (files.length===0) return;
    setFiles(prev => prev.map(p=>({...p, status:"compressing" as const})));
    const results = await Promise.all(files.map(async (f) => {
      try {
        const r = await compressSingle(f.file, quality, maxW, maxH, format);
        return { ...f, compressedUrl: r.url, compressedSize: r.size, width: r.ow, height: r.oh, saving: Math.round(100 - r.size/f.originalSize*100), status:"done" as const };
      } catch { return { ...f, status:"done" as const }; }
    }));
    setFiles(results);
  };

  useEffect(() => {
    if (files.some(f=>f.status==="idle")) {
      (async () => {
        for (const f of files.filter(x=>x.status==="idle")) {
          setFiles(prev=>prev.map(p=>p.id===f.id?{...p, status:"compressing" as const}:p));
          try {
            const r = await compressSingle(f.file, quality, maxW, maxH, format);
            setFiles(prev=>prev.map(p=>p.id===f.id?{...p, compressedUrl:r.url, compressedSize:r.size, width:r.ow, height:r.oh, saving:Math.round(100-r.size/p.originalSize*100), status:"done" as const}:p));
          } catch {}
        }
      })();
    }
  }, [files.length]);

  useEffect(() => { if(files.length>0) recompressAll(); }, [quality, maxW, maxH, format]);

  const totalOrig = files.reduce((a,b)=>a+b.originalSize,0);
  const totalComp = files.reduce((a,b)=>a+(b.compressedSize||0),0);
  const totalSaving = totalOrig && totalComp ? Math.round(100 - totalComp/totalOrig*100) : 0;

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6">
        <div
          onDragOver={(e)=>{e.preventDefault(); setIsDragging(true)}}
          onDragLeave={()=>setIsDragging(false)}
          onDrop={(e)=>{e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files) handleFiles(e.dataTransfer.files)}}
          onClick={()=>inputRef.current?.click()}
          className={`min-h-[480px] rounded-[24px] border-2 border-dashed p-6 bg-[#0a0a0a] cursor-pointer transition-all ${isDragging ? "border-white bg-white/[0.06]" : "border-white/15 hover:border-white/30"}`}
        >
          <input ref={inputRef} type="file" multiple accept="image/*" hidden onChange={e=>e.target.files && handleFiles(e.target.files)} />
          {files.length===0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center text-2xl mb-4">↑</div>
              <h3 className="text-xl font-semibold">Drop gambar disini</h3>
              <p className="text-white/40 text-sm mt-2 max-w-sm">JPG, PNG, WEBP, AVIF, SVG • Support batch 20 file • Semua proses di browser lu, file ga pernah naik ke server</p>
              <button onClick={e=>{e.stopPropagation(); inputRef.current?.click()}} className="mt-8 px-8 h-12 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition">Pilih Gambar</button>
              <p className="text-[11px] text-white/20 mt-4">100% GRATIS • 100% OFFLINE • NO LIMIT</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="font-medium">{files.length} file • {(totalOrig/1024/1024).toFixed(2)}MB → {(totalComp/1024/1024).toFixed(2)}MB</p>
                <button onClick={e=>{e.stopPropagation(); setFiles([])}} className="text-xs px-3 h-7 rounded-full bg-white/10 hover:bg-white/20">Hapus Semua</button>
              </div>
              <div className="grid md:grid-cols-2 gap-3 max-h-[380px] overflow-auto pr-2">
                {files.map(f=>(
                  <div key={f.id} className="bg-[#111] border border-white/10 rounded-2xl p-3 flex gap-3">
                    <img src={f.previewUrl} className="w-14 h-14 rounded-xl object-cover bg-white/5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{f.file.name}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">{(f.originalSize/1024).toFixed(0)}KB → {f.compressedSize ? (f.compressedSize/1024).toFixed(0)+"KB" : (f.status==="compressing" ? "Kompres..." : "...")}</p>
                      {f.saving !== undefined && <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${f.saving>0 ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{f.saving>0 ? `-${f.saving}%` : `+${Math.abs(f.saving)}%`}{f.width ? ` • ${f.width}x${f.height}` : ""}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={e=>{e.stopPropagation(); inputRef.current?.click()}} className="w-full mt-4 h-11 rounded-full border border-white/15 text-sm hover:bg-white/5">+ Tambah Gambar</button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] bg-[#111] border border-white/10 p-6">
            <h3 className="font-semibold mb-5">Pengaturan Kompres</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2"><label className="text-xs text-white/60">Quality</label><span className="text-xs font-mono bg-white text-black px-2.5 py-1 rounded-full">{quality}%</span></div>
                <input type="range" min={10} max={100} value={quality} onChange={e=>setQuality(parseInt(e.target.value))} className="w-full accent-white h-1" />
                <div className="flex justify-between text-[10px] text-white/30 mt-1"><span>Burik</span><span>HD</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-white/60">Max Width</label><input type="number" value={maxW} onChange={e=>setMaxW(parseInt(e.target.value)||1920)} className="mt-2 w-full h-11 bg-[#0a0a0a] border border-white/10 rounded-xl px-3 text-sm focus:border-white/30 outline-none" /></div>
                <div><label className="text-xs text-white/60">Max Height</label><input type="number" value={maxH} onChange={e=>setMaxH(parseInt(e.target.value)||1920)} className="mt-2 w-full h-11 bg-[#0a0a0a] border border-white/10 rounded-xl px-3 text-sm focus:border-white/30 outline-none" /></div>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-3 block">Format Output</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{id:"original", label:"ORIGINAL"}, {id:"jpeg", label:"JPG"}, {id:"png", label:"PNG"}, {id:"webp", label:"WEBP"}, {id:"avif", label:"AVIF"}].map(o=>(
                    <button key={o.id} onClick={()=>setFormat(o.id as any)} className={`h-11 rounded-full text-xs font-semibold border transition-all ${format===o.id ? "bg-white text-black border-white shadow-lg" : "bg-[#0a0a0a] text-white/60 border-white/10 hover:border-white/20"}`}>{o.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-white text-black p-6">
            <div className="flex justify-between items-center">
              <p className="text-[11px] tracking-widest opacity-60">HASIL AKHIR</p>
              {totalSaving>0 && <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500 text-white">HEMAT {totalSaving}%</span>}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div><p className="text-[11px] opacity-60">Original</p><p className="font-bold text-sm">{(totalOrig/1024).toFixed(0)} KB</p></div>
              <div><p className="text-[11px] opacity-60">Hasil</p><p className="font-bold text-sm">{totalComp ? (totalComp/1024).toFixed(0)+" KB" : "-"}</p></div>
              <div><p className="text-[11px] opacity-60">File</p><p className="font-bold text-sm">{files.length}</p></div>
            </div>
            <div className="mt-5 space-y-2 max-h-[200px] overflow-auto">
              {files.filter(f=>f.compressedUrl).map(f=>(
                <a key={f.id} href={f.compressedUrl} download={`xiaoconvert-${f.file.name}`} className="flex justify-between items-center h-11 px-4 bg-black text-white rounded-full text-[13px] hover:bg-black/80 transition">
                  <span className="truncate pr-3">{f.file.name}</span><span>↓ Download</span>
                </a>
              ))}
              {files.length===0 && <p className="text-xs opacity-50 text-center py-4">Upload gambar dulu</p>}
            </div>
            <p className="text-[10px] opacity-40 mt-4 text-center">✓ 100% di browser • ✓ File tidak pernah diupload • ✓ Real canvas compression</p>
          </div>
        </div>
      </div>
    </div>
  );
}

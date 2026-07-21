"use client";
import { useState, useRef } from "react";

type FileItem = {
  id: string; file: File; originalSize: number;
  compressedBlob?: Blob; compressedSize?: number;
  preview: string; status: "ready" | "compressing" | "done";
};

export default function Page() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(68);
  const [maxW, setMaxW] = useState(1920);
  const [maxH, setMaxH] = useState(1920);
  const [format, setFormat] = useState("ORIGINAL");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (b: number) => b < 1024? `${b} B` : b < 1048576? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(2)} MB`;

  const compressImage = (file: File, q: number, w: number, h: number, fmt: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(w / width, h / height, 1);
        width *= ratio; height *= ratio;
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        let mime = file.type;
        if (fmt!== "ORIGINAL") mime = fmt==="JPG"?"image/jpeg":fmt==="PNG"?"image/png":fmt==="WEBP"?"image/webp":"image/avif";
        canvas.toBlob((b) => b? resolve(b) : reject(), mime, q/100);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFiles = async (list: FileList) => {
    const items: FileItem[] = Array.from(list).slice(0,20).map(f=>({id:Math.random().toString(36).slice(2),file:f,originalSize:f.size,preview:URL.createObjectURL(f),status:"ready" as const}));
    setFiles(p=>[...p,...items]);
    for(const it of items){
      setFiles(p=>p.map(x=>x.id===it.id?{...x,status:"compressing"}:x));
      const blob = await compressImage(it.file, quality, maxW, maxH, format);
      setFiles(p=>p.map(x=>x.id===it.id?{...x,compressedBlob:blob,compressedSize:blob.size,status:"done"}:x));
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <header className="h- border-b border-zinc-100 flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-black rounded- flex items-center justify-center text-white font-black">R</div>
          <span className="font-semibold">XiaoConvert</span>
        </div>
        <div className="flex items-center gap-6 text- text-zinc-500">
          <span>Tools</span><span>Pricing</span><span>About</span>
          <button className="bg-black text-white px-4 py-2 rounded-full">Sign in</button>
        </div>
      </header>

      <main className="max-w- mx-auto px-6 pt-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 text-">● New • Now supports AVIF & WebM</div>
        <h1 className="mt-6 text- md:text- font-[800] tracking-[-0.04em] leading-[0.9]">
          <span className="block">Convert anything,</span>
          <span className="block text-zinc-300">beautifully.</span>
        </h1>
        <p className="mt-5 text- text-zinc-500">Fast, private, runs 100% on your device.<br/>No servers, no limits, no watermarks.</p>

        <div
          onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false); if(e.dataTransfer.files) handleFiles(e.dataTransfer.files)}}
          className={`mx-auto mt-12 w-full max-w- rounded- border p-10 flex flex-col items-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] ${dragOver?"border-black border-dashed":"border-zinc-200"}`}
        >
          <div className="w-12 h-12 bg-black rounded- flex items-center justify-center text-white mb-5">↓</div>
          <h3 className="font-semibold">Drop your files here</h3>
          <p className="text- text-zinc-500 mt-1">JPG, PNG, WEBP, SVG, MP4 • up to 500MB</p>
          <button onClick={()=>inputRef.current?.click()} className="mt-5 bg-black text-white px-5 py-2.5 rounded-full text-">Browse files</button>
          <p className="mt-3 text- text-zinc-400">Files never leave your device</p>
          <input ref={inputRef} type="file" multiple accept="image/*" hidden onChange={e=>e.target.files&&handleFiles(e.target.files)} />
        </div>

        {files.length>0 && (
          <div className="mt-10 max-w- mx-auto text-left">
            <div className="rounded- border p-6 bg-zinc-50/50">
              <div className="flex justify-between"><span className="text- font-medium">Quality {quality}%</span></div>
              <input type="range" min={10} max={100} value={quality} onChange={e=>setQuality(Number(e.target.value))} className="w-full accent-black" />
              <div className="grid grid-cols-5 gap-2 mt-6">
                {["ORIGINAL","JPG","PNG","WEBP","AVIF"].map(f=>(
                  <button key={f} onClick={()=>setFormat(f)} className={`h-10 rounded-full text- border ${format===f?"bg-black text-white border-black":"bg-white"}`}>{f}</button>
                ))}
              </div>
            </div>
            {files.map(f=>(
              <div key={f.id} className="mt-2 flex items-center gap-3 p-3 border rounded-2xl bg-white">
                <img src={f.preview} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 text-left"><p className="text- truncate">{f.file.name}</p><p className="text- text-zinc-500">{formatBytes(f.originalSize)} → {f.compressedSize?formatBytes(f.compressedSize):"..."}</p></div>
                {f.compressedBlob && <a href={URL.createObjectURL(f.compressedBlob)} download={`compressed-${f.file.name}`} className="px-4 py-2 bg-black text-white rounded-full text-">Download</a>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";
import { useState, useRef } from "react";

type Item = { id:string; file:File; size:number; preview:string; blob?:Blob; cSize?:number; status:"ready"|"compressing"|"done" };

export default function Page(){
  const [files,setFiles]=useState<Item[]>([]);
  const [q,setQ]=useState(80);
  const [drag,setDrag]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);
  const fmtBytes=(b:number)=> b<1024?`${b}B`: b<1024*1024?`${(b/1024).toFixed(1)}KB`:`${(b/1024/1024).toFixed(2)}MB`;

  const compress=(file:File,quality:number)=>new Promise<Blob>((res,rej)=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement("canvas");
      c.width=img.width; c.height=img.height;
      c.getContext("2d")!.drawImage(img,0,0);
      c.toBlob(b=>b?res(b):rej(),file.type,quality/100);
    };
    img.src=URL.createObjectURL(file);
  });

  const addFiles=async (list:FileList)=>{
    const newItems:Item[]=Array.from(list).slice(0,20).map(f=>({id:Math.random().toString(36).slice(2),file:f,size:f.size,preview:URL.createObjectURL(f),status:"ready"}));
    setFiles(p=>[...p,...newItems]);
    for(const it of newItems){
      setFiles(p=>p.map(x=>x.id===it.id?{...x,status:"compressing"}:x));
      const blob=await compress(it.file,q);
      setFiles(p=>p.map(x=>x.id===it.id?{...x,blob,cSize:blob.size,status:"done"}:x));
    }
  };

  return(
    <div className="min-h-screen bg-[#fcfcfc] text-zinc-900">
      <header className="h- bg-white border-b border-zinc-100 flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-2.5"><div className="w-8 h-8 bg-black rounded- flex items-center justify-center text-white font-black text-">R</div><span className="font-semibold tracking-tight">XiaoConvert</span></div>
        <div className="flex items-center gap-6 text- text-zinc-500"><span>Tools</span><span>Pricing</span><span>About</span><button className="bg-black text-white px-4 py-2 rounded-full">Sign in</button></div>
      </header>

      <main className="max-w- mx-auto px-6 pt- flex flex-col items-center">
        <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full border border-zinc-200 bg-white text- text-zinc-600">● New • Now supports AVIF & WebM</div>

        <h1 className="mt-6 text-center text- md:text- font-[800] tracking-[-0.04em] leading-[0.95]">
          <span className="block text-black">Convert anything,</span>
          <span className="block text-zinc-300">beautifully.</span>
        </h1>
        <p className="mt-4 text-center text- leading-6 text-zinc-500">Fast, private, runs 100% on your device.<br/>No servers, no limits, no watermarks.</p>

        {/* DROP ZONE YANG BENER - 420px DASHED */}
        <div
          onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);e.dataTransfer.files&&addFiles(e.dataTransfer.files)}}
          className={`group mt-10 w-full max-w- h- rounded- border-[1.5px] border-dashed ${drag?"border-zinc-900 bg-zinc-50":"border-zinc-200 bg-white"} shadow-[0_8px_40px_-16px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center px-6 text-center transition-all hover:border-zinc-300 hover:shadow-[0_12px_48px_-16px_rgba(0,0,0,0.16)]`}
        >
          <div className="w-11 h-11 rounded- bg-zinc-900 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">↓</div>
          <p className="text- font-[600] tracking-[-0.01em]">Drop your files here</p>
          <p className="mt-1 text-[12.5px] text-zinc-500">JPG, PNG, WEBP, SVG, MP4 • up to 100MB</p>
          <button onClick={()=>inputRef.current?.click()} className="mt-5 h-8 px-4 rounded-full bg-zinc-900 text-white text- font-medium">Browse files</button>
          <div className="mt-4 flex items-center gap-1.5 text- text-zinc-400"><span>◒</span> Files never leave your device</div>
          <input ref={inputRef} type="file" multiple accept="image/*" hidden onChange={e=>e.target.files&&addFiles(e.target.files)} />
        </div>

        <div className="mt-7 flex items-center gap-2 flex-wrap justify-center">
          {["No upload","Unlimited","No watermark"].map(t=>(
            <div key={t} className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-white border border-zinc-200 text-[12.5px] text-zinc-600 shadow-[0_1px_1px_rgba(0,0,0,0.02)]">◉ {t}</div>
          ))}
        </div>

        {files.length>0 && (
          <div className="mt-10 w-full max-w-">
            <div className="flex justify-between items-center mb-2"><span className="text- font-medium">Quality {q}%</span><input type="range" min={10} max={100} value={q} onChange={e=>setQ(Number(e.target.value))} className="w-32 accent-black" /></div>
            {files.map(f=>(
              <div key={f.id} className="mt-2 flex items-center gap-3 p-3 rounded- border bg-white">
                <img src={f.preview} className="w-11 h-11 rounded- object-cover bg-zinc-100" />
                <div className="flex-1 text-left"><p className="text- font-medium truncate">{f.file.name}</p><p className="text- text-zinc-500">{fmtBytes(f.size)} → {f.cSize?fmtBytes(f.cSize):"..."}</p></div>
                {f.blob && <a href={URL.createObjectURL(f.blob)} download={f.file.name} className="px-4 py-2 rounded-full bg-black text-white text-">Download</a>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

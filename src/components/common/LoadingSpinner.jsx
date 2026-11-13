import React from 'react';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-14">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-[3px] border-white/60" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-500 border-r-cyan-400 animate-spin" />
        <div className="absolute inset-[7px] rounded-full bg-white/50 backdrop-blur border border-white/80 shadow-inner" />
        <div className="absolute inset-[7px] rounded-full border-2 border-transparent border-b-violet-500 animate-spin [animation-direction:reverse] [animation-duration:1.4s]" />
      </div>
      <p className="text-xs font-bold tracking-wide text-slate-600">{text}</p>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Dumbbell, Activity, Calendar, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  userEmail: string;
}

export default function Header({ userEmail }: HeaderProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-orange-500/20 bg-black text-white px-6 py-4 sticky top-0 z-50 shadow-md shadow-orange-500/5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-600 to-orange-400 rounded-xl shadow-lg shadow-orange-500/20 animate-pulse">
            <Dumbbell className="w-6 h-6 text-black stroke-[2.5]" id="logo-icon" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 font-mono">
              MUSCLEKI <span className="text-orange-500 font-extrabold">AI</span>
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
              Autonomous Physical Scheduling Engine
            </p>
          </div>
        </div>

        {/* Dynamic Telemetry / Status */}
        <div className="flex items-center gap-6 text-xs font-mono">
          <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <span className="text-zinc-400">SYS STATUS:</span>
            <span className="text-orange-500 font-bold">ONLINE</span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
            <Activity className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-zinc-400">TIME:</span>
            <span className="text-white font-semibold">{time || '19:47:47'}</span>
          </div>

          {/* User badge */}
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-zinc-300 hidden sm:inline">USER:</span>
            <span className="text-orange-500 font-bold max-w-[150px] truncate">{userEmail}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

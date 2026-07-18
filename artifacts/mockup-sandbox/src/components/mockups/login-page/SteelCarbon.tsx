import React, { useState } from 'react';

export function SteelCarbon() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-[100dvh] w-full flex bg-[#0f1117] text-white font-['Inter'] selection:bg-[#4a9eff] selection:text-white">
      <style>{`
        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100vh);
          }
        }
        .animate-scan {
          animation: scanline 8s linear infinite;
        }
        
        .carbon-pattern {
          background-color: #0f1117;
          background-image: 
            linear-gradient(30deg, #161821 12%, transparent 12.5%, transparent 87%, #161821 87.5%, #161821),
            linear-gradient(150deg, #161821 12%, transparent 12.5%, transparent 87%, #161821 87.5%, #161821),
            linear-gradient(30deg, #161821 12%, transparent 12.5%, transparent 87%, #161821 87.5%, #161821),
            linear-gradient(150deg, #161821 12%, transparent 12.5%, transparent 87%, #161821 87.5%, #161821),
            linear-gradient(60deg, #1a1d24 25%, transparent 25.5%, transparent 75%, #1a1d24 75%, #1a1d24),
            linear-gradient(60deg, #1a1d24 25%, transparent 25.5%, transparent 75%, #1a1d24 75%, #1a1d24);
          background-size: 80px 140px;
          background-position: 0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px;
        }
      `}</style>
      
      {/* Left side - Decor */}
      <div className="hidden lg:flex flex-col relative w-1/2 overflow-hidden border-r border-[#3a3d45]">
        {/* Carbon / Hex pattern overlay */}
        <div className="absolute inset-0 carbon-pattern opacity-60 mix-blend-screen" />
        
        {/* Scanner line */}
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#4a9eff] opacity-30 shadow-[0_0_20px_5px_#4a9eff] animate-scan pointer-events-none z-10" />

        {/* Content overlaid */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-24 h-24 mb-8 rounded-full border-4 border-[#C5852C] flex items-center justify-center bg-[#0f1117] shadow-[0_0_30px_rgba(197,133,44,0.3)]">
            <span className="text-[#C5852C] text-4xl font-black tracking-tighter">HS</span>
          </div>
          <h1 className="font-['Barlow_Condensed'] text-6xl tracking-widest text-white uppercase font-bold mb-4 drop-shadow-md">
            High Safety<br />
            <span className="text-[#C5852C]">Intl Center</span>
          </h1>
          <p className="text-2xl text-gray-400 mt-2 font-semibold tracking-wide">
            مركز الأمان العالي الدولي
          </p>
          <div className="mt-16 text-sm text-[#4a9eff] uppercase tracking-widest border border-[#3a3d45] px-6 py-2 bg-[#0f1117]/80 backdrop-blur font-mono">
            Authorized Vehicle Inspection System // v2.4.1
          </div>
        </div>
      </div>
      
      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 lg:p-24 bg-[#0f1117] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1d24]/20 to-transparent pointer-events-none" />
        
        <div className="w-full max-w-[420px] bg-[#1a1d24] p-10 border border-[#3a3d45] shadow-2xl relative z-10">
          {/* Subtle industrial corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C5852C]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C5852C]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C5852C]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C5852C]" />

          <div className="mb-10 lg:hidden flex flex-col items-center">
            <div className="w-16 h-16 mb-4 rounded-full border-2 border-[#C5852C] flex items-center justify-center bg-[#0f1117]">
              <span className="text-[#C5852C] text-2xl font-black tracking-tighter">HS</span>
            </div>
            <h2 className="font-['Barlow_Condensed'] text-2xl text-center text-white uppercase font-bold tracking-widest">
              High Safety Center
            </h2>
            <p className="text-sm text-gray-400 mt-1">مركز الأمان العالي الدولي</p>
          </div>

          <h2 className="font-['Barlow_Condensed'] text-3xl font-bold mb-2 uppercase tracking-wider text-white">System Login</h2>
          <p className="text-[#888c96] mb-8 text-sm">Please authenticate to access the inspection portal.</p>
          
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#888c96] uppercase tracking-wider block">
                Technician ID / Email
              </label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#3a3d45] text-white px-4 py-3 focus:outline-none focus:border-[#4a9eff] transition-colors rounded-none placeholder:text-[#3a3d45]"
                placeholder="tech-001@hs.intl"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#888c96] uppercase tracking-wider block">
                  Passcode
                </label>
                <a href="#" className="text-[#4a9eff] text-xs hover:text-white transition-colors uppercase tracking-wider font-semibold">Reset</a>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0f1117] border border-[#3a3d45] text-white px-4 py-3 focus:outline-none focus:border-[#4a9eff] transition-colors rounded-none placeholder:text-[#3a3d45]"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#C5852C] hover:bg-[#d6963d] text-white font-bold py-4 uppercase tracking-widest transition-colors mt-4 shadow-[0_0_15px_rgba(197,133,44,0.15)] focus:outline-none focus:ring-2 focus:ring-[#C5852C] focus:ring-offset-2 focus:ring-offset-[#1a1d24]"
            >
              تسجيل الدخول / Sign In
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#3a3d45] text-center text-xs text-[#888c96] font-mono tracking-widest">
            SECURE ACCESS TERMINAL • PROTOCOL V4.0
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

export function GulfPremium() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // SVG Pattern for background: a delicate repeating diamond/star motif
  const patternSvg = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' stroke='%23C5852C' stroke-width='1' stroke-opacity='0.06'/%3E%3Cpath d='M30 15L45 30L30 45L15 30z' stroke='%23C5852C' stroke-width='1' stroke-opacity='0.04'/%3E%3C/g%3E%3C/svg%3E`;

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 font-['Tajawal']"
      style={{ 
        backgroundColor: '#0C1A28',
        backgroundImage: `url("${patternSvg}")`,
        backgroundSize: '60px 60px'
      }}
      dir="rtl"
    >
      <div 
        className="w-full max-w-md rounded-2xl p-8 flex flex-col relative overflow-hidden"
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(197, 133, 44, 0.25)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Glow effect in the background of the card */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top, #C5852C 0%, transparent 70%)'
          }}
        />

        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-6 relative z-10">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4 relative"
            style={{
              background: 'linear-gradient(135deg, rgba(197,133,44,0.15) 0%, rgba(197,133,44,0.02) 100%)',
              border: '1px solid rgba(197,133,44,0.4)',
              boxShadow: '0 0 20px rgba(197,133,44,0.15)'
            }}
          >
            <div className="absolute inset-0 rounded-full border border-[#C5852C]/20 scale-110"></div>
            <span className="text-[#C5852C] font-['Inter'] font-bold text-xl tracking-wider">HS</span>
          </div>
          <h1 className="text-[#C5852C] text-2xl font-bold mb-1 text-center tracking-wide drop-shadow-sm">
            مركز الأمان العالي الدولي
          </h1>
          <p className="text-white/60 font-['Inter'] text-[11px] tracking-[0.2em] uppercase text-center mt-1">
            High Safety International Center
          </p>
        </div>

        {/* Divider */}
        <div 
          className="w-full h-px mb-8 relative z-10"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(197,133,44,0.4), transparent)' }}
        />

        {/* Form */}
        <form className="flex flex-col gap-5 relative z-10" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-2">
            <label className="text-[#C5852C]/90 text-sm px-1 font-medium">اسم المستخدم</label>
            <div className="relative">
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full h-12 px-4 rounded-md outline-none transition-all duration-300 bg-[#0a1520] text-white placeholder:text-[#C5852C]/30"
                style={{
                  border: '1px solid rgba(197, 133, 44, 0.3)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C5852C';
                  e.target.style.boxShadow = '0 0 0 1px rgba(197, 133, 44, 0.5), inset 0 2px 4px rgba(0,0,0,0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(197, 133, 44, 0.3)';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)';
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[#C5852C]/90 text-sm px-1 font-medium">كلمة المرور</label>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full h-12 px-4 rounded-md outline-none transition-all duration-300 bg-[#0a1520] text-white placeholder:text-[#C5852C]/30"
                style={{
                  border: '1px solid rgba(197, 133, 44, 0.3)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C5852C';
                  e.target.style.boxShadow = '0 0 0 1px rgba(197, 133, 44, 0.5), inset 0 2px 4px rgba(0,0,0,0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(197, 133, 44, 0.3)';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)';
                }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-1 px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="w-4 h-4 rounded border border-[#C5852C]/40 bg-[#0a1520] flex items-center justify-center group-hover:border-[#C5852C] transition-colors">
                <input type="checkbox" className="hidden" />
              </div>
              <span className="text-white/60 text-sm group-hover:text-white/80 transition-colors">تذكرني</span>
            </label>
            <a href="#" className="text-[#C5852C]/80 text-sm hover:text-[#C5852C] transition-colors">
              نسيت كلمة المرور؟
            </a>
          </div>

          <button 
            type="submit"
            className="w-full h-12 mt-2 rounded-md text-white font-bold text-lg hover:opacity-90 transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(to right, #8B5E1A, #C5852C)',
              boxShadow: '0 4px 14px 0 rgba(197, 133, 44, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            تسجيل الدخول
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center relative z-10">
          <p className="text-white/30 text-xs">
            للمستخدمين المصرح لهم فقط
          </p>
        </div>
      </div>
    </div>
  );
}

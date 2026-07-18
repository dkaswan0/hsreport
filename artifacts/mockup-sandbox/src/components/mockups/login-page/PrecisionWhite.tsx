import React from "react";

export function PrecisionWhite() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');
      `}} />
      <div className="flex min-h-screen w-full bg-white font-['DM_Sans'] text-[#0C1A28] overflow-hidden">
      {/* LEFT COLUMN */}
      <div className="w-[38%] min-w-[320px] bg-[#0C1A28] flex flex-col relative text-white">
        {/* Decoration Line */}
        <div className="absolute top-[33%] left-0 w-full h-[1px] bg-[#C5852C]" />

        <div className="flex-1 flex flex-col justify-between p-12 lg:p-16 z-10">
          <div className="flex flex-col items-start pt-12">
            <div className="w-16 h-16 rounded-full border border-[#C5852C] flex items-center justify-center mb-8">
              <span className="font-['DM_Serif_Display'] text-2xl text-[#C5852C] tracking-wider">
                HS
              </span>
            </div>
            
            <h1 className="font-['DM_Serif_Display'] text-4xl lg:text-5xl leading-tight mb-4">
              High Safety <br />
              International Center
            </h1>
            
            <div className="text-white/70 text-lg mb-2" dir="rtl">
              مركز الأمان العالي الدولي
            </div>
            
            <div className="text-white/50 text-sm mt-8" dir="rtl">
              نظام إدارة فحص المركبات
            </div>
          </div>
          
          <div className="text-white/30 text-xs tracking-widest uppercase">
            ISO-9001 Certified System
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="flex-1 flex flex-col justify-between relative p-12 lg:p-16">
        <div className="flex justify-end">
          <div className="text-xs tracking-widest text-gray-400 uppercase">
            System Portal
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-12">
            <div>
              <h2 className="text-3xl font-['DM_Serif_Display'] mb-2">Secure Login</h2>
              <p className="text-gray-500 text-sm tracking-wide">Enter your credentials to access the system.</p>
            </div>

            <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
              <div className="relative group">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  placeholder="Enter your user ID"
                  className="w-full bg-transparent border-0 border-b border-[#0C1A28]/20 focus:border-[#0C1A28] focus:ring-0 text-[#0C1A28] text-lg py-2 transition-colors placeholder:text-[#999] rounded-none focus:outline-none"
                />
              </div>

              <div className="relative group">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent border-0 border-b border-[#0C1A28]/20 focus:border-[#0C1A28] focus:ring-0 text-[#0C1A28] text-lg py-2 transition-colors placeholder:text-[#999] rounded-none focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0C1A28] text-white py-4 mt-4 transition-transform hover:scale-[1.01] active:scale-[0.99] flex flex-col items-center justify-center gap-1 group"
              >
                <span className="text-[14px] uppercase tracking-[0.2em] font-medium">Authenticate</span>
                <span className="text-[10px] text-white/60 tracking-wider">تسجيل الدخول</span>
              </button>
            </form>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="text-xs text-gray-400 hover:text-[#0C1A28] cursor-pointer transition-colors">
            Forgot password?
          </div>
          <div className="text-[10px] text-gray-400 tracking-wide" dir="rtl">
            للمستخدمين المصرح لهم فقط
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

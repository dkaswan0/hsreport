import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock, User, Eye, EyeOff, Shield } from "lucide-react";
import logoPath from "@assets/hs-logo.png";
import hsBannerPath from "@assets/hs-banner.jpeg";

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onLoginSuccess();
        setLocation("/");
      }
    },
    onError: () => {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');
        .login-input {
          width: 100%;
          background: transparent;
          border: 0;
          border-bottom: 1.5px solid rgba(12,26,40,0.2);
          padding: 10px 0;
          font-size: 1rem;
          color: #0C1A28;
          outline: none;
          border-radius: 0;
          transition: border-color 0.2s;
          font-family: 'DM Sans', sans-serif;
          direction: rtl;
        }
        .login-input::placeholder { color: #aaa; }
        .login-input:focus { border-bottom-color: #0C1A28; }
        .login-input-icon-wrapper { position: relative; }
        .login-input-icon {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          color: #C5852C;
          pointer-events: none;
        }
        .login-input-icon-left {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(12,26,40,0.35);
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          display: flex;
          align-items: center;
        }
        .login-input-with-icon { padding-right: 28px; }
        .login-input-with-icon-both { padding-right: 28px; padding-left: 28px; }
        .login-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 6px;
          font-family: 'DM Sans', sans-serif;
        }
      `}} />

      <div className="flex min-h-screen w-full overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ═══ LEFT PANEL — dark navy ═══ */}
        <div
          className="hidden md:flex w-[40%] min-w-[320px] flex-col relative text-white"
          style={{ background: '#0C1A28' }}
        >
          {/* gold decoration line at 40% height */}
          <div className="absolute left-0 w-full" style={{ top: '40%', height: '1px', background: '#C5852C' }} />

          <div className="flex-1 flex flex-col justify-between p-12 lg:p-14 z-10">
            {/* top: banner + logo + name */}
            <div className="flex flex-col items-start pt-8">
              {/* banner strip */}
              <div className="w-full rounded-xl overflow-hidden mb-8" style={{ border: '1px solid rgba(197,133,44,0.3)' }}>
                <img
                  src={hsBannerPath}
                  alt="High Safety International Center"
                  className="w-full object-cover"
                  style={{ height: '80px', objectPosition: 'center' }}
                />
              </div>

              {/* logo */}
              <div className="relative mb-6">
                <div
                  className="absolute -inset-3 rounded-2xl"
                  style={{ background: 'radial-gradient(circle, rgba(197,133,44,0.25) 0%, transparent 70%)', filter: 'blur(12px)' }}
                />
                <img
                  src={logoPath}
                  alt="High Safety"
                  className="relative z-10 rounded-2xl"
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'contain',
                    border: '1.5px solid rgba(197,133,44,0.4)',
                    boxShadow: '0 0 20px rgba(197,133,44,0.25)',
                    background: '#0d1e30',
                  }}
                />
              </div>

              {/* names */}
              <h1
                className="leading-tight mb-3"
                style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)' }}
              >
                High Safety<br />International Center
              </h1>

              <p className="text-white/70 text-base mb-1" dir="rtl">
                مركز الأمان العالي الدولي
              </p>
              <p className="text-white/40 text-xs" dir="rtl">
                للفحص الفني للمركبات والمعدات والآليات
              </p>
            </div>

            {/* bottom: cert tag */}
            <p className="text-white/25 text-[10px] tracking-widest uppercase">
              ISO-9001 Certified System
            </p>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — white ═══ */}
        <div className="flex-1 flex flex-col bg-white">
          {/* top bar */}
          <div className="flex justify-between items-center px-10 py-6">
            {/* mobile-only logo placeholder */}
            <div className="flex md:hidden items-center gap-2">
              <img src={logoPath} alt="HS" className="w-8 h-8 rounded object-contain" style={{ background: '#0C1A28' }} />
              <span className="text-xs font-bold text-[#0C1A28] tracking-wide">HIGH SAFETY</span>
            </div>
            <div className="hidden md:block" />
            <span className="text-[10px] tracking-widest text-gray-400 uppercase">System Portal</span>
          </div>

          {/* center: form */}
          <div className="flex-1 flex items-center justify-center px-8 py-10">
            <div className="w-full max-w-sm space-y-10">
              {/* heading */}
              <div>
                <h2
                  className="mb-1 text-[#0C1A28]"
                  style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.9rem' }}
                >
                  تسجيل الدخول
                </h2>
                <p className="text-gray-400 text-sm" dir="rtl">
                  أدخل بياناتك للوصول إلى النظام
                </p>
              </div>

              {/* form */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* username */}
                <div>
                  <label className="login-label">اسم المستخدم</label>
                  <div className="login-input-icon-wrapper">
                    <span className="login-input-icon" style={{ width: 16, height: 16 }}>
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="اسم المستخدم"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="login-input login-input-with-icon"
                      data-testid="input-username"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* password */}
                <div>
                  <label className="login-label">كلمة المرور</label>
                  <div className="login-input-icon-wrapper">
                    <span className="login-input-icon" style={{ width: 16, height: 16 }}>
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-input login-input-with-icon-both"
                      data-testid="input-password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="login-input-icon-left"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* error */}
                {error && (
                  <div
                    className="rounded-xl p-3 text-sm text-center"
                    dir="rtl"
                    style={{
                      background: 'rgba(220,38,38,0.07)',
                      border: '1px solid rgba(220,38,38,0.2)',
                      color: '#dc2626',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* submit */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                  className="w-full flex flex-col items-center justify-center gap-1 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: '#0C1A28',
                    color: '#fff',
                    padding: '14px 0',
                    border: 'none',
                    cursor: loginMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: loginMutation.isPending ? 0.7 : 1,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {loginMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-[11px] text-white/60 tracking-wider mt-1">جارٍ تسجيل الدخول...</span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-2 text-[13px] uppercase tracking-[0.2em] font-medium">
                        <Shield size={14} />
                        Authenticate
                      </span>
                      <span className="text-[10px] text-white/50 tracking-wider">تسجيل الدخول</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* bottom bar */}
          <div className="flex justify-end px-10 py-6">
            <p className="text-[10px] text-gray-300 tracking-wide" dir="rtl">
              نظام محمي · للمستخدمين المصرح لهم فقط
            </p>
          </div>
        </div>

      </div>
    </>
  );
}

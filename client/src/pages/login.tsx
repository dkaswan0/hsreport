import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock, User, Eye, EyeOff, ShieldCheck } from "lucide-react";
import logoPath from "@assets/hs-logo.png";

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
      } else {
        setError(data.message || "اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    },
    onError: (err: any) => {
      let msg = "اسم المستخدم أو كلمة المرور غير صحيحة";
      if (err?.message) {
        const cleanMsg = err.message.replace(/^\d+:\s*/, '');
        try {
          const parsed = JSON.parse(cleanMsg);
          msg = parsed.message || msg;
        } catch {
          if (!cleanMsg.includes("401")) {
            msg = cleanMsg;
          }
        }
      }
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col justify-between" dir="rtl">
      {/* ═══ 1. Full-Width Top Header with Official Logo ═══ */}
      <div className="w-full bg-zinc-950 border-b border-zinc-800 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center shrink-0">
              <img
                src={logoPath}
                alt="High Safety Logo"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            <div>
              <h2 className="text-white font-black text-xs sm:text-sm font-arabic">
                مركز الأمان العالي الدولي لفحص السيارات
              </h2>
              <p className="text-[9px] text-zinc-400 font-mono tracking-wider uppercase" dir="ltr">
                HIGH SAFETY INTERNATIONAL VEHICLE INSPECTION
              </p>
            </div>
          </div>
          <div className="hidden sm:block text-left text-zinc-400 font-mono text-[10px]" dir="ltr">
            PORTAL v2.0
          </div>
        </div>
      </div>

      {/* ═══ 2. Centered Login Card Container ═══ */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Top Logo Icon */}
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-3">
            <img src={logoPath} alt="High Safety Logo" className="w-full h-full object-contain drop-shadow-lg" />
          </div>

          {/* Subtitle Tag */}
          <p className="text-center text-zinc-500 font-bold text-xs uppercase tracking-widest mb-1 font-mono" dir="ltr">
            HIGH SAFETY · SYSTEM PORTAL
          </p>

          {/* Main Title */}
          <h1 className="text-center text-xl md:text-2xl font-black text-zinc-950 font-arabic mb-1.5">
            تسجيل الدخول إلى النظام
          </h1>

          {/* Description */}
          <p className="text-center text-zinc-500 text-xs font-arabic mb-6">
            أدخل بياناتك للوصول إلى لوحة التحكم والتقارير
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label className="block text-right font-bold text-xs text-zinc-900 mb-1.5 font-arabic">
                اسم المستخدم المصرح به
              </label>
              <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 focus-within:border-zinc-950 focus-within:ring-2 focus-within:ring-zinc-950/10 transition-all">
                <input
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent outline-none text-right text-xs sm:text-sm font-semibold text-zinc-950 placeholder:text-zinc-400 font-arabic"
                  data-testid="input-username"
                  autoComplete="username"
                  required
                />
                <User className="w-4 h-4 text-zinc-400 shrink-0 mr-2" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-right font-bold text-xs text-zinc-900 mb-1.5 font-arabic">
                كلمة المرور
              </label>
              <div className="relative flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 focus-within:border-zinc-950 focus-within:ring-2 focus-within:ring-zinc-950/10 transition-all">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 hover:text-zinc-700 transition-colors p-0.5 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-right text-xs sm:text-sm font-semibold text-zinc-950 placeholder:text-zinc-400 font-arabic mx-2"
                  data-testid="input-password"
                  autoComplete="current-password"
                  required
                />
                <Lock className="w-4 h-4 text-zinc-400 shrink-0 mr-2" />
              </div>
            </div>

            {/* Error Message (if any) */}
            {error && (
              <div
                className="rounded-xl p-2.5 text-xs text-center bg-zinc-100 border border-zinc-300 text-zinc-950 font-bold font-arabic animate-in fade-in"
                dir="rtl"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              data-testid="button-login"
              className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-black active:scale-[0.99] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 border border-zinc-800 cursor-pointer disabled:opacity-70 font-arabic"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>تسجيل الدخول | Authenticate</span>
                </>
              )}
            </button>
          </form>

          {/* Card Inner Footer */}
          <div className="border-t border-zinc-100 pt-4 mt-5 text-center text-[11px] text-zinc-500 font-medium font-arabic flex items-center justify-center gap-1">
            <span>نظام محمي · للمستخدمين المصرح لهم فقط</span>
          </div>
        </div>

        {/* Outer Certification Footer */}
        <div className="mt-5 text-center">
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono" dir="ltr">
            HIGH SAFETY INTERNATIONAL VEHICLE INSPECTION
          </p>
        </div>
      </div>
    </div>
  );
}

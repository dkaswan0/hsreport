import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock, User, Eye, EyeOff, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-between" dir="rtl">
      {/* ═══ 1. Full-Width Top Header Banner ═══ */}
      <div className="w-full bg-[#0C1A28] border-b-4 border-[#C5852C] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center">
          <img
            src={hsBannerPath}
            alt="High Safety International Center Banner"
            className="max-h-[120px] md:max-h-[140px] w-auto object-contain"
          />
        </div>
      </div>

      {/* ═══ 2. Centered Login Card Container ═══ */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-lg bg-white rounded-3xl border-t-4 border-[#C5852C] border-x border-b border-slate-200 shadow-2xl overflow-hidden p-6 md:p-10 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Top Dark Navy Lock Icon Circle */}
          <div className="w-14 h-14 rounded-full bg-[#0C1A28] border-2 border-[#C5852C]/40 shadow-lg flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>

          {/* Subtitle Tag */}
          <p className="text-center text-[#C5852C] font-bold text-xs uppercase tracking-widest mb-1 font-arabic">
            HIGH SAFETY · System Portal
          </p>

          {/* Main Title */}
          <h1 className="text-center text-2xl md:text-3xl font-extrabold text-[#0C1A28] font-arabic mb-2">
            تسجيل الدخول الي النظام
          </h1>

          {/* Description */}
          <p className="text-center text-slate-500 text-sm font-arabic mb-8">
            أدخل بياناتك للوصول إلى السيستم كامل
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username Input */}
            <div>
              <label className="block text-right font-bold text-sm text-[#0C1A28] mb-2 font-arabic">
                الاسم المصرح به
              </label>
              <div className="relative flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 focus-within:border-[#C5852C] focus-within:ring-2 focus-within:ring-[#C5852C]/20 transition-all">
                <input
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent outline-none text-right text-sm font-semibold text-[#0C1A28] placeholder:text-slate-400 font-arabic"
                  data-testid="input-username"
                  autoComplete="username"
                  required
                />
                <User className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-right font-bold text-sm text-[#0C1A28] mb-2 font-arabic">
                كلمة المرور الخاصة بالمركز
              </label>
              <div className="relative flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-4 py-3.5 focus-within:border-[#C5852C] focus-within:ring-2 focus-within:ring-[#C5852C]/20 transition-all">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-right text-sm font-semibold text-[#0C1A28] placeholder:text-slate-400 font-arabic mx-2"
                  data-testid="input-password"
                  autoComplete="current-password"
                  required
                />
                <Lock className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
              </div>
            </div>

            {/* Error Message (if any) */}
            {error && (
              <div
                className="rounded-2xl p-3 text-sm text-center bg-red-50 border border-red-200 text-red-600 font-arabic animate-in fade-in"
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
              className="w-full py-4 rounded-2xl bg-[#0C1A28] hover:bg-[#07101B] active:scale-[0.99] text-white font-bold text-base transition-all shadow-xl flex items-center justify-center gap-3 border border-[#C5852C]/40 cursor-pointer disabled:opacity-70 font-arabic"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-[#C5852C]" />
                  <span>تسجيل الدخول | Authenticate</span>
                </>
              )}
            </button>
          </form>

          {/* Card Inner Footer */}
          <div className="border-t border-slate-100 pt-5 mt-6 text-center text-xs text-slate-500 font-medium font-arabic flex items-center justify-center gap-1.5">
            <span>🔒 نظام محمي · للمستخدمين المصرح لهم فقط</span>
          </div>
        </div>

        {/* Outer ISO Certification Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            ISO-9001 Certified System
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg, #060e16 0%, #0C1A28 40%, #0f2035 70%, #0C1A28 100%)" }}
    >
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C5852C]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#C5852C]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid rgba(197,133,44,0.25)', background: 'rgba(12,26,40,0.97)' }}
        >
          {/* Company Banner */}
          <div className="relative overflow-hidden">
            <img
              src={hsBannerPath}
              alt="High Safety International Center"
              className="w-full object-cover"
              style={{ height: '100px', objectPosition: 'center' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0C1A28]/80" />
          </div>

          {/* Logo Section */}
          <div className="flex flex-col items-center pt-6 pb-4 px-8">
            <div className="relative -mt-16 mb-4">
              {/* Outer animated glow */}
              <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-yellow-400/30 via-[#C5852C]/25 to-yellow-600/30 blur-xl animate-pulse" />
              {/* Border ring */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-[#C5852C] via-yellow-400 to-[#C5852C] opacity-60" />
              <img
                src={logoPath}
                alt="High Safety"
                className="relative z-10 rounded-2xl object-cover"
                style={{
                  width: '120px',
                  height: '120px',
                  filter: 'drop-shadow(0 0 16px rgba(197,133,44,0.6))',
                }}
              />
            </div>

            {/* Company Name */}
            <div className="text-center space-y-1">
              <h1 className="text-xl font-black text-white font-arabic leading-tight">
                مركز الأمان العالي الدولي
              </h1>
              <p className="text-[#C5852C] text-xs font-bold tracking-widest uppercase">
                HIGH SAFETY INTERNATIONAL CENTER L.L.C
              </p>
              <p className="text-white/40 text-xs font-arabic">
                للفحص الفني للمركبات والمعدات والآليات
              </p>
            </div>

            {/* Golden Divider */}
            <div className="flex items-center gap-3 w-full mt-5 mb-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C5852C]/60 to-transparent" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C5852C]" />
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#C5852C]/60 to-transparent" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C5852C]" />
                <Input
                  type="text"
                  placeholder="اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#C5852C] text-right font-arabic h-12 rounded-xl"
                  data-testid="input-username"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C5852C]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#C5852C] text-right font-arabic h-12 rounded-xl"
                  data-testid="input-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#C5852C] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center font-arabic">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 font-bold font-arabic text-base rounded-xl shadow-lg shadow-[#C5852C]/20"
                style={{ background: 'linear-gradient(135deg, #C5852C 0%, #d4943b 50%, #C5852C 100%)', color: '#ffffff' }}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جارٍ تسجيل الدخول...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>تسجيل الدخول</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 pb-2 text-center">
              <p className="text-white/25 text-xs font-arabic">
                نظام محمي · للمستخدمين المصرح لهم فقط
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

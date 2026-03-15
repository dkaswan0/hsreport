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
      style={{ background: "linear-gradient(160deg, #050d15 0%, #0C1A28 50%, #0a1620 100%)" }}
    >
      <div className="w-full max-w-sm relative z-10">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid rgba(180,140,50,0.3)', background: '#0d1e2d' }}
        >
          {/* Banner — full width, no overlap */}
          <div className="w-full overflow-hidden" style={{ borderBottom: '2px solid rgba(180,140,50,0.4)' }}>
            <img
              src={hsBannerPath}
              alt="High Safety International Center"
              className="w-full object-cover"
              style={{ height: '88px', objectPosition: 'center' }}
            />
          </div>

          {/* Logo + Name — separate section below banner */}
          <div className="flex flex-col items-center pt-6 pb-5 px-7">
            <div className="relative mb-4">
              <div
                className="absolute -inset-2 rounded-2xl blur-xl"
                style={{ background: 'radial-gradient(circle, rgba(180,140,50,0.35) 0%, transparent 70%)' }}
              />
              <img
                src={logoPath}
                alt="High Safety"
                className="relative z-10 rounded-2xl"
                style={{
                  width: '148px',
                  height: '148px',
                  objectFit: 'contain',
                  display: 'block',
                  border: '1.5px solid rgba(180,140,50,0.4)',
                  boxShadow: '0 0 24px rgba(180,140,50,0.3), 0 6px 20px rgba(0,0,0,0.6)',
                  background: '#0d1e30',
                }}
              />
            </div>

            {/* Company Name */}
            <h1 className="text-lg font-black text-white font-arabic text-center leading-snug mb-1">
              مركز الأمان العالي الدولي
            </h1>
            <p className="text-xs font-semibold text-center tracking-widest mb-1"
               style={{ color: '#b48c32' }}>
              HIGH SAFETY INTERNATIONAL CENTER
            </p>
            <p className="text-xs text-center font-arabic" style={{ color: 'rgba(255,255,255,0.35)' }}>
              للفحص الفني للمركبات والمعدات والآليات
            </p>

            {/* Divider */}
            <div className="w-full mt-5 mb-5" style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(180,140,50,0.4), transparent)' }} />

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-3">
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#b48c32' }} />
                <Input
                  type="text"
                  placeholder="اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-10 text-right font-arabic h-11 rounded-xl text-white placeholder:text-white/30"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  data-testid="input-username"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#b48c32' }} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10 text-right font-arabic h-11 rounded-xl text-white placeholder:text-white/30"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  data-testid="input-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <div className="rounded-xl p-3 text-sm text-center font-arabic"
                     style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                data-testid="button-login"
                className="w-full h-11 font-bold font-arabic text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #8a6420 0%, #b48c32 50%, #8a6420 100%)',
                  color: '#fff8e8',
                  border: '1px solid rgba(180,140,50,0.5)',
                  boxShadow: '0 2px 12px rgba(140,100,20,0.3)',
                  opacity: loginMutation.isPending ? 0.7 : 1,
                }}
              >
                {loginMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جارٍ تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-xs font-arabic" style={{ color: 'rgba(255,255,255,0.2)' }}>
              نظام محمي · للمستخدمين المصرح لهم فقط
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

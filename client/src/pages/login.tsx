import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock, User, Eye, EyeOff, Shield } from "lucide-react";
import logoPath from "@assets/logo_1767706304085.png";

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
      style={{
        background: "linear-gradient(135deg, #0C1A28 0%, #1a2d3d 50%, #0C1A28 100%)"
      }}
    >
      <Card className="w-full max-w-md border-[#C5852C]/30 bg-[#0C1A28]/95 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#C5852C]/20 rounded-full blur-2xl" />
              <img 
                src={logoPath} 
                alt="High Safety" 
                className="h-24 w-24 object-contain relative z-10"
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-arabic">
              نظام فحص المركبات
            </h1>
            <p className="text-[#C5852C] font-bold mt-1">HIGH SAFETY</p>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C5852C]" />
                <Input
                  type="text"
                  placeholder="اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#C5852C] text-right font-arabic h-12"
                  data-testid="input-username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#C5852C]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11 pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-[#C5852C] text-right font-arabic h-12"
                  data-testid="input-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center font-arabic">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-12 bg-[#C5852C] hover:bg-[#d4943b] text-white font-bold font-arabic text-lg"
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الدخول...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/40 text-xs font-arabic">
              نظام محمي - للمستخدمين المصرح لهم فقط
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

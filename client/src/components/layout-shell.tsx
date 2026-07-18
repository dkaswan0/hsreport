import { Link, useLocation } from "wouter";
import {
  Car,
  ClipboardList,
  Settings,
  LayoutDashboard,
  Database,
  LogOut,
  KeyRound,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import logoPath from "@assets/hs-logo.png";

interface LayoutShellProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const NAV = [
  { href: "/",              key: "nav.dashboard",   icon: LayoutDashboard, labelAr: "الرئيسية"    },
  { href: "/inspections",   key: "nav.inspections", icon: ClipboardList,   labelAr: "الفحوصات"    },
  { href: "/fault-library", key: "nav.faultLibrary",icon: Car,             labelAr: "مكتبة الأعطال"},
  { href: "/vehicle-data",  key: "nav.vehicleData", icon: Database,        labelAr: "بيانات المركبات"},
  { href: "/api-keys",      key: "api-keys",        icon: KeyRound,        labelAr: "مفاتيح API"  },
  { href: "/settings",      key: "nav.settings",    icon: Settings,        labelAr: "الإعدادات"   },
];

export default function LayoutShell({ children, onLogout }: LayoutShellProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const isRtl = lang === "ar";

  return (
    <div
      className="min-h-screen flex"
      dir={isRtl ? "rtl" : "ltr"}
      style={{ background: "#F7F6F3" }}
    >
      {/* ══ RAIL SIDEBAR (icon-only) ══ */}
      <aside
        className="hidden md:flex flex-col items-center shrink-0 z-20"
        style={{
          width: 60,
          background: "#0C1A28",
          borderInlineEnd: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* logo */}
        <div className="w-full flex items-center justify-center py-4 border-b border-white/5">
          <img
            src={logoPath}
            alt="HS"
            className="w-8 h-8 rounded-lg object-contain"
            style={{ border: "1px solid rgba(197,133,44,0.35)", background: "#0d1e30" }}
          />
        </div>

        {/* nav */}
        <nav className="flex-1 flex flex-col items-center gap-0.5 py-4 w-full">
          {NAV.map((item) => {
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isRtl ? item.labelAr : t(item.key)}
                className={cn(
                  "group relative w-full flex items-center justify-center h-10 transition-colors",
                  active ? "text-[#C5852C]" : "text-white/35 hover:text-white/70"
                )}
              >
                {active && (
                  <span
                    className="absolute inset-y-1 rounded-full w-0.5"
                    style={{
                      [isRtl ? "right" : "left"]: 0,
                      background: "#C5852C",
                    }}
                  />
                )}
                <item.icon className="w-4 h-4" />
                {/* tooltip */}
                <span
                  className="pointer-events-none absolute hidden group-hover:flex items-center px-2 py-1 rounded text-[11px] font-medium bg-[#0C1A28] text-white whitespace-nowrap z-50 shadow-xl border border-white/10"
                  style={{ [isRtl ? "left" : "right"]: "calc(100% + 8px)" }}
                >
                  {isRtl ? item.labelAr : t(item.key)}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* footer */}
        <div className="flex flex-col items-center gap-1 pb-4 w-full border-t border-white/5 pt-3">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            title={lang === "ar" ? "Switch to English" : "تبديل للعربية"}
            className="w-full h-9 flex items-center justify-center text-[11px] font-bold text-white/30 hover:text-white/60 transition-colors"
          >
            {lang === "ar" ? "EN" : "ع"}
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              title={isRtl ? "خروج" : "Logout"}
              className="w-full h-9 flex items-center justify-center text-white/25 hover:text-red-400 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-4 h-12 border-b"
          style={{ background: "#0C1A28", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <img src={logoPath} alt="HS" className="w-7 h-7 rounded object-contain" style={{ background: "#0d1e30" }} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white/60 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* page */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8">
          {children}
        </div>
      </div>

      {/* ══ Mobile Drawer ══ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute top-0 h-full w-56 flex flex-col"
            style={{
              [isRtl ? "right" : "left"]: 0,
              background: "#0C1A28",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-12 flex items-center px-5 border-b border-white/5">
              <span className="text-xs font-bold tracking-widest" style={{ color: "#C5852C" }}>
                HIGH SAFETY
              </span>
            </div>
            <nav className="flex-1 flex flex-col py-3 px-2 gap-0.5">
              {NAV.map((item) => {
                const active = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      active ? "text-[#C5852C] bg-white/5" : "text-white/45 hover:text-white/80 hover:bg-white/5"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{isRtl ? item.labelAr : t(item.key)}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-white/5 flex gap-2">
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="flex-1 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
              >
                {lang === "ar" ? "English" : "عربي"}
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex-1 py-2 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1"
                  data-testid="button-logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isRtl ? "خروج" : "Logout"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

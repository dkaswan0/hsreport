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
      className="min-h-screen flex bg-zinc-100 text-zinc-950"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* ══ RAIL SIDEBAR (icon-only) ══ */}
      <aside
        className="hidden md:flex flex-col items-center shrink-0 z-20 bg-zinc-950 border-inline-end border-zinc-800"
        style={{
          width: 60,
        }}
      >
        {/* logo */}
        <div className="w-full flex items-center justify-center py-4 border-b border-zinc-800">
          <img
            src={logoPath}
            alt="High Safety"
            className="w-10 h-10 object-contain drop-shadow-md"
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
                  active ? "text-white bg-zinc-900" : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                )}
              >
                {active && (
                  <span
                    className="absolute inset-y-1 rounded-full w-0.5 bg-white"
                    style={{
                      [isRtl ? "right" : "left"]: 0,
                    }}
                  />
                )}
                <item.icon className="w-4 h-4" />
                {/* tooltip */}
                <span
                  className="pointer-events-none absolute hidden group-hover:flex items-center px-2 py-1 rounded text-[11px] font-medium bg-zinc-900 text-white whitespace-nowrap z-50 shadow-xl border border-zinc-800"
                  style={{ [isRtl ? "left" : "right"]: "calc(100% + 8px)" }}
                >
                  {isRtl ? item.labelAr : t(item.key)}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* footer */}
        <div className="flex flex-col items-center gap-1 pb-4 w-full border-t border-zinc-800 pt-3">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            title={lang === "ar" ? "Switch to English" : "تبديل للعربية"}
            className="w-full h-9 flex items-center justify-center text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
          >
            {lang === "ar" ? "EN" : "ع"}
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              title={isRtl ? "خروج" : "Logout"}
              className="w-full h-9 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
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
          className="md:hidden flex items-center justify-between px-4 h-12 bg-zinc-950 border-b border-zinc-800"
        >
          <img src={logoPath} alt="High Safety" className="w-8 h-8 object-contain drop-shadow-md" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-zinc-400 hover:text-white"
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div
            className="absolute top-0 h-full w-56 flex flex-col bg-zinc-950 border-zinc-800"
            style={{
              [isRtl ? "right" : "left"]: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-12 flex items-center px-5 border-b border-zinc-800">
              <span className="text-xs font-black tracking-widest text-white">
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
                      active ? "text-white bg-zinc-900 font-bold" : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{isRtl ? item.labelAr : t(item.key)}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-zinc-800 flex gap-2">
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="flex-1 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                {lang === "ar" ? "English" : "عربي"}
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex-1 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center justify-center gap-1"
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

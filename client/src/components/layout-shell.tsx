import { Link, useLocation } from "wouter";
import {
  Car,
  ClipboardList,
  Settings,
  LayoutDashboard,
  Menu,
  X,
  Database,
  LogOut,
  KeyRound,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import logoPath from "@assets/hs-logo.png";

interface LayoutShellProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export default function LayoutShell({ children, onLogout }: LayoutShellProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const navItems = [
    { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/inspections", label: t("nav.inspections"), icon: ClipboardList },
    { href: "/fault-library", label: t("nav.faultLibrary"), icon: Car },
    { href: "/vehicle-data", label: t("nav.vehicleData"), icon: Database },
    { href: "/api-keys", label: "مفاتيح API", icon: KeyRound },
    { href: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const toggleLang = () => setLang(lang === "ar" ? "en" : "ar");

  const SidebarNav = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative",
              isActive
                ? "text-[#C5852C] bg-white/5 font-semibold"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            )}
          >
            {isActive && (
              <span
                className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                style={{ background: "#C5852C" }}
              />
            )}
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#f5f5f4" }}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex w-56 shrink-0 flex-col"
        style={{ background: "#0C1A28" }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/5">
          <img
            src={logoPath}
            alt="HS"
            className="h-8 w-8 rounded-lg object-contain"
            style={{ background: "#0d1e30", border: "1px solid rgba(197,133,44,0.3)" }}
          />
          <div className="leading-none">
            <div
              className="text-xs font-bold tracking-widest"
              style={{ color: "#C5852C" }}
            >
              HIGH SAFETY
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">
              {lang === "ar" ? "مركز الأمان" : "Int'l Center"}
            </div>
          </div>
        </div>

        <SidebarNav />

        {/* Footer */}
        <div className="p-3 border-t border-white/5 space-y-1">
          <button
            onClick={toggleLang}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <span>{lang === "ar" ? "English" : "عربي"}</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t("nav.logout")}</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-6 bg-white border-b border-stone-200/60"
          style={{ backdropFilter: "blur(4px)" }}
        >
          <button
            className="md:hidden p-1.5 text-stone-500 hover:text-stone-800 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* breadcrumb hint */}
          <div className="hidden md:block text-xs text-stone-400 tracking-wide uppercase">
            {navItems.find((n) => n.href === location)?.label || ""}
          </div>

          <div className="flex items-center gap-3 mr-auto md:mr-0">
            <button
              onClick={toggleLang}
              className="px-2.5 py-1 rounded text-xs font-medium text-stone-500 hover:text-stone-800 border border-stone-200 hover:border-stone-400 transition-colors"
            >
              {lang === "ar" ? "EN" : "ع"}
            </button>
          </div>
        </header>

        {/* Page */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8">{children}</div>
      </div>

      {/* ── Mobile Drawer ── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute top-0 right-0 h-full w-56 flex flex-col"
            style={{ background: "#0C1A28" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
              <span className="text-xs font-bold tracking-widest" style={{ color: "#C5852C" }}>
                HIGH SAFETY
              </span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarNav onItemClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

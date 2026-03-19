import { Link, useLocation } from "wouter";
import { 
  Car, 
  ClipboardList, 
  Settings, 
  LayoutDashboard, 
  Menu,
  X,
  Search,
  Bell,
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
    { href: "/", label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: "/inspections", label: t('nav.inspections'), icon: ClipboardList },
    { href: "/fault-library", label: t('nav.faultLibrary'), icon: Car },
    { href: "/vehicle-data", label: t('nav.vehicleData'), icon: Database },
    { href: "/api-keys", label: "مفاتيح API", icon: KeyRound },
    { href: "/settings", label: t('nav.settings'), icon: Settings },
  ];

  const toggleLang = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white shadow-2xl z-20">
        <div className="h-16 flex items-center px-4 border-b border-slate-700 gap-3">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-yellow-400/30 via-[#C5852C]/20 to-yellow-600/30 blur-md" />
            <img 
              src={logoPath} 
              alt="High Safety Logo" 
              className="h-12 w-12 object-contain relative z-10 rounded-xl"
              style={{ 
                filter: 'drop-shadow(0 0 6px rgba(180,140,50,0.7))',
                border: '1px solid rgba(180,140,50,0.35)',
                background: '#0d1e30',
              }}
            />
          </div>
          <div className="leading-tight">
            <div className="font-display font-black text-sm tracking-wider text-[#C5852C]">HIGH SAFETY</div>
            <div className="text-white/40 text-xs font-arabic">مركز الأمان العالي</div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-accent text-slate-900 font-bold shadow-lg shadow-accent/20" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}>
                <item.icon className={cn("w-5 h-5 mx-3", isActive ? "text-slate-900" : "text-slate-400 group-hover:text-white")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-3">
          <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C5852C] flex items-center justify-center text-white font-bold">
              HS
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">High Safety</p>
              <p className="text-xs text-slate-400 truncate">مسجل الدخول</p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">{t('nav.logout')}</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 z-10">
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>

          <div className="flex-1 max-w-xl mx-4 hidden md:block relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rtl:left-3 rtl:right-auto" />
            <input 
              className="w-full pl-4 pr-10 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 border-transparent focus:bg-white focus:border-accent focus:ring-0 transition-all text-sm rtl:pr-4 rtl:pl-10"
              placeholder={t('inspections.search')}
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-slate-900 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <span className="font-display font-bold text-lg text-accent">HIGH SAFETY</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white"><X /></button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={cn(
                  "flex items-center px-4 py-3 rounded-xl transition-all",
                  location === item.href ? "bg-accent text-slate-900" : "text-slate-300"
                )}>
                  <item.icon className="w-5 h-5 mx-3" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

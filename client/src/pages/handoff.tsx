import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  FileDown, 
  MonitorSmartphone, 
  ShieldCheck, 
  Car,
  Loader2,
  XCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import newLogoPath from "@assets/2d686a58-6e3c-4416-ab74-162301834ccb_1768145790398.jpg";
import type { Inspection, InspectionItem } from "@shared/schema";

type InspectionWithItems = Inspection & { items: InspectionItem[] };

const BRAND = {
  navy: '#0C1A28',
  gold: '#C5852C',
  goldLight: '#FFD700'
};

export default function HandoffPage() {
  const [, params] = useRoute("/handoff/:token");
  const [, setLocation] = useLocation();
  const token = params?.token;
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: inspection, isLoading, error } = useQuery<InspectionWithItems>({
    queryKey: ['/api/public/report', token],
    queryFn: async () => {
      const res = await fetch(`/api/public/report/${token}`);
      if (!res.ok) throw new Error('Report not found');
      return res.json();
    },
    enabled: !!token
  });

  const handleViewOnline = () => {
    setLocation(`/view/${token}`);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/inspections/${inspection?.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inspection-report-${inspection?.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setLocation(`/view/${token}`);
      }
    } catch (err) {
      setLocation(`/view/${token}`);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1a2d3d 50%, ${BRAND.navy} 100%)` }}
      >
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" style={{ color: BRAND.gold }} />
          <p className="text-white/70 font-arabic text-lg">جارِ تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1a2d3d 50%, ${BRAND.navy} 100%)` }}
      >
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-3xl p-12 max-w-md">
          <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2 font-arabic">التقرير غير موجود</h1>
          <p className="text-white/60 font-arabic">الرابط غير صحيح أو انتهت صلاحيته</p>
        </div>
      </div>
    );
  }

  const items = inspection.items || [];
  const failCount = items.filter(i => i.status === 'fail').length;
  const warningCount = items.filter(i => i.status === 'warning').length;
  const passCount = items.filter(i => i.status === 'pass').length;

  const getStatusInfo = () => {
    if (failCount > 0) return { 
      label: 'يحتاج متابعة', 
      labelEn: 'Needs Attention',
      color: 'text-red-400', 
      bg: 'bg-red-500/20', 
      icon: XCircle 
    };
    if (warningCount > 0) return { 
      label: 'جيد مع ملاحظات', 
      labelEn: 'Good with Notes',
      color: 'text-amber-400', 
      bg: 'bg-amber-500/20', 
      icon: AlertCircle 
    };
    return { 
      label: 'ممتاز', 
      labelEn: 'Excellent',
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/20', 
      icon: CheckCircle2 
    };
  };

  const status = getStatusInfo();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1a2d3d 50%, ${BRAND.navy} 100%)` }}
      dir="rtl"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10"
          style={{ 
            background: `radial-gradient(circle, ${BRAND.gold} 0%, transparent 70%)`,
            top: '-20%',
            right: '-10%'
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full opacity-10"
          style={{ 
            background: `radial-gradient(circle, ${BRAND.gold} 0%, transparent 70%)`,
            bottom: '-10%',
            left: '-5%'
          }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.1, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div 
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo and Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative inline-block mb-4">
            <motion.div
              className="absolute -inset-4 rounded-full"
              style={{ 
                background: `radial-gradient(circle, ${BRAND.gold}40 0%, transparent 70%)` 
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <img 
              src={newLogoPath} 
              alt="High Safety" 
              className="w-24 h-24 rounded-full object-cover shadow-2xl relative z-10"
              style={{ boxShadow: `0 0 40px ${BRAND.gold}50` }}
            />
          </div>
          
          <h1 className="text-2xl font-black text-white font-arabic mb-1">
            مركز الأمان العالي
          </h1>
          <p className="text-sm tracking-widest" style={{ color: BRAND.gold }}>
            HIGH SAFETY CENTER
          </p>
          
          <div 
            className="mt-4 h-0.5 w-32 mx-auto"
            style={{ background: `linear-gradient(90deg, transparent, ${BRAND.gold}, transparent)` }}
          />
        </motion.div>

        {/* Vehicle Info Card */}
        <motion.div 
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${BRAND.gold}20` }}
            >
              <Car className="w-7 h-7" style={{ color: BRAND.gold }} />
            </div>
            <div className="flex-1 text-right">
              <h2 className="text-xl font-bold text-white">
                {inspection.make} {inspection.model}
              </h2>
              <p className="text-white/60 text-sm">{inspection.year}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center justify-center gap-3 py-3 rounded-xl ${status.bg}`}>
            <status.icon className={`w-6 h-6 ${status.color}`} />
            <div className="text-center">
              <span className={`text-lg font-bold font-arabic ${status.color}`}>
                {status.label}
              </span>
              <span className={`text-xs block ${status.color} opacity-70`}>
                {status.labelEn}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center p-3 rounded-xl bg-emerald-500/10">
              <div className="text-2xl font-bold text-emerald-400">{passCount}</div>
              <div className="text-xs text-white/60 font-arabic">سليم</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-500/10">
              <div className="text-2xl font-bold text-amber-400">{warningCount}</div>
              <div className="text-xs text-white/60 font-arabic">تحذير</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-red-500/10">
              <div className="text-2xl font-bold text-red-400">{failCount}</div>
              <div className="text-xs text-white/60 font-arabic">خطير</div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* View Online Button */}
          <Button
            onClick={handleViewOnline}
            className="w-full h-16 text-lg font-bold rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02]"
            style={{ 
              background: `linear-gradient(135deg, ${BRAND.gold} 0%, #a06b20 100%)`,
              color: BRAND.navy
            }}
            data-testid="button-view-online"
          >
            <MonitorSmartphone className="w-6 h-6 ml-3" />
            <div className="text-right flex-1">
              <div className="font-arabic">التقرير الإلكتروني التفاعلي</div>
              <div className="text-xs opacity-80">Interactive Online Report</div>
            </div>
          </Button>

          {/* Download PDF Button */}
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            variant="outline"
            className="w-full h-16 text-lg font-bold rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]"
            style={{ 
              borderColor: BRAND.gold,
              color: BRAND.gold,
              background: 'transparent'
            }}
            data-testid="button-download-pdf"
          >
            {isDownloading ? (
              <Loader2 className="w-6 h-6 ml-3 animate-spin" />
            ) : (
              <FileDown className="w-6 h-6 ml-3" />
            )}
            <div className="text-right flex-1">
              <div className="font-arabic">تحميل التقرير PDF</div>
              <div className="text-xs opacity-80">Download PDF Report</div>
            </div>
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4" style={{ color: BRAND.gold }} />
            <span className="text-white/50 text-xs font-arabic">الذي تثق به</span>
          </div>
          <p className="text-white/30 text-xs">
            Report #{inspection.id} • {new Date().getFullYear()}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

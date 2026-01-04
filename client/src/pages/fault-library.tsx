import { Car } from "lucide-react";

export default function FaultLibrary() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <Car className="w-10 h-10 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">مكتبة الأعطال الذكية</h2>
      <p className="text-slate-500 max-w-md">
        يتم بناء قاعدة البيانات هذه تلقائياً باستخدام الذكاء الاصطناعي أثناء عمليات الفحص لتقديم اقتراحات أدق في المستقبل.
      </p>
    </div>
  );
}

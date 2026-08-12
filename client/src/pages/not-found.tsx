import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 text-gray-900">
      <div className="text-center">
        <div className="inline-flex p-4 rounded-full bg-zinc-100 text-zinc-900 mb-4">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold mb-4">404 - الصفحة غير موجودة</h1>
        <p className="text-gray-600 mb-8">عذراً، الصفحة التي تبحث عنها غير متوفرة</p>
        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

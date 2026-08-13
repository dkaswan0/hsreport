import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhosphorIcon } from "@/components/phosphor-icon";
import { Loader2, Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { InspectionSection, InspectionCategory } from "@shared/schema";

interface AddEditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { label: string; labelEn?: string; icon?: string }) => Promise<any>;
  initialData?: InspectionSection | null;
  mode?: "add" | "edit";
}

export const AddEditSectionModal: React.FC<AddEditSectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = "add",
}) => {
  const [label, setLabel] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData && mode === "edit") {
      setLabel(initialData.label || "");
      setLabelEn(initialData.labelEn || "");
    } else {
      setLabel("");
      setLabelEn("");
    }
    setError("");
  }, [initialData, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError("يرجى إدخال اسم القسم");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSave({
        label: label.trim(),
        labelEn: labelEn.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ القسم");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md font-arabic bg-white text-zinc-950 rounded-2xl border border-zinc-200 shadow-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              {mode === "add" ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </div>
            <span>{mode === "add" ? "إضافة قسم رئيسي جديد للفحص" : "تعديل بيانات القسم الرئيسي"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-300 text-xs font-bold text-zinc-900">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sec-label" className="text-xs font-bold text-zinc-700">
              اسم القسم بالعربية <span className="text-zinc-500">*</span>
            </Label>
            <Input
              id="sec-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: نظام التكييف والتبريد، أنظمة ADAS، فحص الهايبرد..."
              className="font-arabic text-sm h-10 border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sec-label-en" className="text-xs font-bold text-zinc-700">
              الاسم بالإنجليزية (اختياري)
            </Label>
            <Input
              id="sec-label-en"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              placeholder="e.g. AC & Cooling System, ADAS..."
              className="font-mono text-sm h-10 border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              dir="ltr"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-start">
            <Button
              type="submit"
              disabled={isSubmitting || !label.trim()}
              className="bg-zinc-950 hover:bg-black text-white font-bold text-xs h-9 px-5 rounded-xl shadow-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin ml-1" />
              ) : mode === "add" ? (
                "حفظ وإضافة القسم"
              ) : (
                "حفظ التعديل"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="font-arabic text-xs h-9 border-zinc-300 rounded-xl"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface AddEditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { sectionId: string; label: string; labelEn?: string }) => Promise<any>;
  sectionId: string;
  sectionLabel: string;
  initialData?: InspectionCategory | null;
  mode?: "add" | "edit";
}

export const AddEditCategoryModal: React.FC<AddEditCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  sectionId,
  sectionLabel,
  initialData,
  mode = "add",
}) => {
  const [label, setLabel] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData && mode === "edit") {
      setLabel(initialData.label || "");
      setLabelEn(initialData.labelEn || "");
    } else {
      setLabel("");
      setLabelEn("");
    }
    setError("");
  }, [initialData, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError("يرجى إدخال اسم الفئة");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSave({
        sectionId,
        label: label.trim(),
        labelEn: labelEn.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ الفئة");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md font-arabic bg-white text-zinc-950 rounded-2xl border border-zinc-200 shadow-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              {mode === "add" ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </div>
            <span>{mode === "add" ? `إضافة فئة جديدة تحت: ${sectionLabel}` : "تعديل بيانات الفئة"}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-300 text-xs font-bold text-zinc-900">
              {error}
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-center gap-2">
            <span className="font-bold text-zinc-900">القسم التابع له:</span>
            <span className="bg-zinc-200 px-2 py-0.5 rounded font-mono font-bold text-zinc-900">{sectionLabel}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-label" className="text-xs font-bold text-zinc-700">
              اسم الفئة بالعربية <span className="text-zinc-500">*</span>
            </Label>
            <Input
              id="cat-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: مضخة المياه، تيل الفرامل الخلفي، حساس الأكسجين..."
              className="font-arabic text-sm h-10 border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-label-en" className="text-xs font-bold text-zinc-700">
              الاسم بالإنجليزية (اختياري)
            </Label>
            <Input
              id="cat-label-en"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              placeholder="e.g. Water Pump, Rear Brake Pads..."
              className="font-mono text-sm h-10 border-zinc-300 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              dir="ltr"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-start">
            <Button
              type="submit"
              disabled={isSubmitting || !label.trim()}
              className="bg-zinc-950 hover:bg-black text-white font-bold text-xs h-9 px-5 rounded-xl shadow-xs"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin ml-1" />
              ) : mode === "add" ? (
                "حفظ وإضافة الفئة"
              ) : (
                "حفظ التعديل"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="font-arabic text-xs h-9 border-zinc-300 rounded-xl"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

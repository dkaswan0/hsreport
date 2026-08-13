import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MAIN_SECTIONS, INSPECTION_CATEGORIES, getCategoryLabel as getFallbackCategoryLabel } from "@shared/categories";
import type { InspectionSection, InspectionCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useInspectionStructure() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 1. Fetch Sections
  const { data: serverSections, isLoading: isLoadingSections } = useQuery<InspectionSection[]>({
    queryKey: ["/api/inspection-sections"],
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // 2. Fetch Categories
  const { data: serverCategories, isLoading: isLoadingCategories } = useQuery<InspectionCategory[]>({
    queryKey: ["/api/inspection-categories"],
    staleTime: 1000 * 60 * 5,
  });

  // Merge server with fallback defaults
  const sections = (serverSections && serverSections.length > 0)
    ? serverSections.filter(s => s.isActive !== false)
    : MAIN_SECTIONS.map((s, idx) => ({
        id: s.id,
        label: s.label,
        labelEn: s.labelEn,
        icon: "wrench",
        sortOrder: idx + 1,
        isDefault: true,
        isActive: true,
        createdAt: null,
      }));

  const allCategories = (serverCategories && serverCategories.length > 0)
    ? serverCategories.filter(c => c.isActive !== false)
    : INSPECTION_CATEGORIES.map((c, idx) => ({
        id: c.id,
        sectionId: c.section,
        label: c.label,
        labelEn: c.labelEn || null,
        icon: null,
        sortOrder: idx + 1,
        isDefault: true,
        isActive: true,
        createdAt: null,
      }));

  const getCategoriesForSection = (sectionId: string) => {
    return allCategories.filter(c => c.sectionId === sectionId);
  };

  const getCategoryLabel = (id: string): string => {
    const found = allCategories.find(c => c.id === id);
    if (found) return found.label;
    return getFallbackCategoryLabel(id);
  };

  const getSectionLabel = (id: string): string => {
    const found = sections.find(s => s.id === id);
    if (found) return found.label;
    const fallback = MAIN_SECTIONS.find(s => s.id === id);
    return fallback?.label || id;
  };

  // Safe error parser helper
  const parseResponseError = async (res: Response, defaultMessage: string): Promise<string> => {
    try {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return json.message || defaultMessage;
      } catch {
        return text || res.statusText || defaultMessage;
      }
    } catch {
      return res.statusText || defaultMessage;
    }
  };

  // === Mutations for Sections ===

  const createSectionMutation = useMutation({
    mutationFn: async (newSection: { label: string; labelEn?: string; icon?: string }) => {
      const res = await fetch("/api/inspection-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSection),
      });
      if (!res.ok) {
        const errorMsg = await parseResponseError(res, "فشل إنشاء القسم");
        throw new Error(errorMsg);
      }
      return await res.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/inspection-sections"] });
      await queryClient.refetchQueries({ queryKey: ["/api/inspection-sections"] });
      toast({
        title: "تم إنشاء القسم بنجاح",
        description: `تمت إضافة قسم "${data.label}" مباشرة`,
      });
    },
    onError: (err: any) => {
      console.error("Create section error:", err);
      toast({
        title: "خطأ في إنشاء القسم",
        description: err.message || "تعذر إنشاء القسم، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InspectionSection> }) => {
      const res = await fetch(`/api/inspection-sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const errorMsg = await parseResponseError(res, "فشل تعديل القسم");
        throw new Error(errorMsg);
      }
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/inspection-sections"] });
      await queryClient.refetchQueries({ queryKey: ["/api/inspection-sections"] });
      toast({ title: "تم تحديث القسم بنجاح" });
    },
    onError: (err: any) => {
      console.error("Update section error:", err);
      toast({
        title: "خطأ في تحديث القسم",
        description: err.message || "تعذر تحديث القسم",
        variant: "destructive",
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inspection-sections/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorMsg = await parseResponseError(res, "فشل حذف القسم");
        throw new Error(errorMsg);
      }
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/inspection-sections"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/inspection-categories"] });
      await queryClient.refetchQueries({ queryKey: ["/api/inspection-sections"] });
      toast({ title: "تم حذف القسم بنجاح" });
    },
    onError: (err: any) => {
      console.error("Delete section error:", err);
      toast({
        title: "خطأ في حذف القسم",
        description: err.message || "تعذر حذف القسم",
        variant: "destructive",
      });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/inspection-sections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const errorMsg = await parseResponseError(res, "فشل حفظ ترتيب الأقسام");
        throw new Error(errorMsg);
      }
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/inspection-sections"] });
    },
    onError: (err: any) => {
      console.error("Reorder sections error:", err);
      toast({
        title: "خطأ في إعادة الترتيب",
        description: err.message || "تعذر حفظ الترتيب الجديد",
        variant: "destructive",
      });
    },
  });

  // === Mutations for Categories ===

  const createCategoryMutation = useMutation({
    mutationFn: async (newCat: { sectionId: string; label: string; labelEn?: string; icon?: string }) => {
      const res = await fetch("/api/inspection-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCat),
      });
      if (!res.ok) {
        const errorMsg = await parseResponseError(res, "فشل إنشاء الفئة");
        throw new Error(errorMsg);
      }
      return await res.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/inspection-categories"] });
      await queryClient.refetchQueries({ queryKey: ["/api/inspection-categories"] });
      toast({
        title: "تم إنشاء الفئة بنجاح",
        description: `تمت إضافة فئة "${data.label}"`,
      });
    },
    onError: (err: any) => {
      console.error("Create category error:", err);
      toast({
        title: "خطأ في إنشاء الفئة",
        description: err.message || "تعذر إنشاء الفئة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InspectionCategory> }) => {
      const res = await fetch(`/api/inspection-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const errorMsg = await parseResponseError(res, "فشل تعديل الفئة");
        throw new Error(errorMsg);
      }
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/inspection-categories"] });
      await queryClient.refetchQueries({ queryKey: ["/api/inspection-categories"] });
      toast({ title: "تم تحديث الفئة بنجاح" });
    },
    onError: (err: any) => {
      console.error("Update category error:", err);
      toast({
        title: "خطأ في تحديث الفئة",
        description: err.message || "تعذر تحديث الفئة",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inspection-categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorMsg = await parseResponseError(res, "فشل حذف الفئة");
        throw new Error(errorMsg);
      }
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/inspection-categories"] });
      await queryClient.refetchQueries({ queryKey: ["/api/inspection-categories"] });
      toast({ title: "تم حذف الفئة بنجاح" });
    },
    onError: (err: any) => {
      console.error("Delete category error:", err);
      toast({
        title: "خطأ في حذف الفئة",
        description: err.message || "تعذر حذف الفئة",
        variant: "destructive",
      });
    },
  });

  const reorderCategoriesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/inspection-categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const errorMsg = await parseResponseError(res, "فشل حفظ ترتيب الفئات");
        throw new Error(errorMsg);
      }
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/inspection-categories"] });
    },
    onError: (err: any) => {
      console.error("Reorder categories error:", err);
      toast({
        title: "خطأ في إعادة الترتيب",
        description: err.message || "تعذر حفظ الترتيب الجديد",
        variant: "destructive",
      });
    },
  });

  return {
    sections,
    allCategories,
    isLoading: isLoadingSections || isLoadingCategories,
    getCategoriesForSection,
    getCategoryLabel,
    getSectionLabel,
    // Actions
    createSection: createSectionMutation.mutateAsync,
    updateSection: updateSectionMutation.mutateAsync,
    deleteSection: deleteSectionMutation.mutateAsync,
    reorderSections: reorderSectionsMutation.mutateAsync,
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    reorderCategories: reorderCategoriesMutation.mutateAsync,
    isCreatingSection: createSectionMutation.isPending,
    isCreatingCategory: createCategoryMutation.isPending,
  };
}

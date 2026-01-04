import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateInspectionRequest, type UpdateInspectionRequest, type CreateInspectionItemRequest, type UpdateInspectionItemRequest } from "@shared/routes";

// ============================================
// INSPECTIONS
// ============================================

export function useInspections(params?: { search?: string; status?: string }) {
  const queryString = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  return useQuery({
    queryKey: [api.inspections.list.path, params],
    queryFn: async () => {
      const res = await fetch(api.inspections.list.path + queryString, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch inspections');
      return api.inspections.list.responses[200].parse(await res.json());
    },
  });
}

export function useInspection(id: number) {
  return useQuery({
    queryKey: [api.inspections.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.inspections.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch inspection');
      return api.inspections.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInspectionRequest) => {
      const validated = api.inspections.create.input.parse(data);
      const res = await fetch(api.inspections.create.path, {
        method: api.inspections.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.inspections.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create inspection');
      }
      return api.inspections.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.inspections.list.path] }),
  });
}

export function useUpdateInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & UpdateInspectionRequest) => {
      const validated = api.inspections.update.input.parse(updates);
      const url = buildUrl(api.inspections.update.path, { id });
      const res = await fetch(url, {
        method: api.inspections.update.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to update inspection');
      return api.inspections.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.inspections.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.inspections.get.path, data.id] });
    },
  });
}

export function useDeleteInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.inspections.delete.path, { id });
      const res = await fetch(url, { method: api.inspections.delete.method, credentials: "include" });
      if (!res.ok) throw new Error('Failed to delete inspection');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.inspections.list.path] }),
  });
}

// ============================================
// INSPECTION ITEMS
// ============================================

export function useCreateInspectionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inspectionId, ...data }: CreateInspectionItemRequest) => {
      // Note: route excludes inspectionId from input body, implies it from URL
      const url = buildUrl(api.inspectionItems.create.path, { id: inspectionId });
      const res = await fetch(url, {
        method: api.inspectionItems.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to add item');
      return api.inspectionItems.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.inspections.get.path, variables.inspectionId] });
    },
  });
}

export function useUpdateInspectionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, inspectionId, ...updates }: { id: number, inspectionId: number } & UpdateInspectionItemRequest) => {
      const url = buildUrl(api.inspectionItems.update.path, { id });
      const res = await fetch(url, {
        method: api.inspectionItems.update.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to update item');
      return api.inspectionItems.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.inspections.get.path, variables.inspectionId] });
    },
  });
}

export function useDeleteInspectionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number, inspectionId: number }) => {
      const url = buildUrl(api.inspectionItems.delete.path, { id });
      const res = await fetch(url, { method: api.inspectionItems.delete.method, credentials: "include" });
      if (!res.ok) throw new Error('Failed to delete item');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.inspections.get.path, variables.inspectionId] });
    },
  });
}

// ============================================
// UTILS: VIN & FAULTS
// ============================================

export function useVinDecoder(vin: string) {
  return useQuery({
    queryKey: [api.vin.decode.path, vin],
    queryFn: async () => {
      if (vin.length !== 17) return null;
      const url = buildUrl(api.vin.decode.path, { vin });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return null;
      return api.vin.decode.responses[200].parse(await res.json());
    },
    enabled: vin.length === 17,
    retry: false,
  });
}

export function useFaultSuggestions() {
  return useMutation({
    mutationFn: async (query: string) => {
      const res = await fetch(api.faultLibrary.suggest.path, {
        method: api.faultLibrary.suggest.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to get suggestions');
      return api.faultLibrary.suggest.responses[200].parse(await res.json());
    }
  });
}

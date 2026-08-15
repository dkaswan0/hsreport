// ==============================================================================
// Offline Queue & Background Auto-Sync Service
// High Safety International Center - Technical Inspection System
// ==============================================================================

export interface OfflineInspectionDraft {
  localId: string;
  data: any;
  createdAt: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
}

const OFFLINE_STORAGE_KEY = 'hs_offline_inspections_queue';

export class OfflineSyncService {
  private static listeners: Array<(isOnline: boolean, queueCount: number) => void> = [];

  public static init(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.notifyListeners();
      this.syncPendingQueue();
    });

    window.addEventListener('offline', () => {
      this.notifyListeners();
    });

    // Auto-sync on startup if online
    if (navigator.onLine) {
      setTimeout(() => this.syncPendingQueue(), 3000);
    }
  }

  public static isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public static getQueue(): OfflineInspectionDraft[] {
    try {
      const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static saveToQueue(inspectionData: any): string {
    const queue = this.getQueue();
    const localId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const draft: OfflineInspectionDraft = {
      localId,
      data: inspectionData,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };

    queue.push(draft);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(queue));
    this.notifyListeners();
    return localId;
  }

  public static removeDraft(localId: string): void {
    let queue = this.getQueue();
    queue = queue.filter(item => item.localId !== localId);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(queue));
    this.notifyListeners();
  }

  public static async syncPendingQueue(): Promise<{ syncedCount: number; failedCount: number }> {
    if (!this.isOnline()) return { syncedCount: 0, failedCount: 0 };

    const queue = this.getQueue();
    if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

    let syncedCount = 0;
    let failedCount = 0;

    for (const draft of queue) {
      if (draft.status === 'syncing') continue;

      draft.status = 'syncing';
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(queue));

      try {
        const response = await fetch('/api/inspections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft.data)
        });

        if (response.ok) {
          syncedCount++;
          this.removeDraft(draft.localId);
        } else {
          draft.status = 'failed';
          draft.retryCount++;
          failedCount++;
        }
      } catch (err) {
        draft.status = 'failed';
        draft.retryCount++;
        failedCount++;
      }
    }

    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(this.getQueue()));
    this.notifyListeners();
    return { syncedCount, failedCount };
  }

  public static subscribe(listener: (isOnline: boolean, queueCount: number) => void): () => void {
    this.listeners.push(listener);
    listener(this.isOnline(), this.getQueue().length);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(): void {
    const online = this.isOnline();
    const count = this.getQueue().length;
    this.listeners.forEach(l => l(online, count));
  }
}

// Auto-initialize
OfflineSyncService.init();

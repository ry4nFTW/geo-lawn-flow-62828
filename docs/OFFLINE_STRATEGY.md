# Offline-First Architecture & Sync Strategy

## Offline Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                Mobile PWA Frontend                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │Service      │  │ Local       │  │ Sync        │     │
│  │Worker       │  │ Database    │  │ Manager     │     │
│  │             │  │ (Dexie.js)  │  │             │     │
│  │• Cache API  │  │             │  │• Queue jobs │     │
│  │• Background │  │• Jobs       │  │• Retry logic│     │
│  │  sync       │  │• Visits     │  │• Conflict   │     │
│  │• Offline    │  │• Photos     │  │  resolution │     │
│  │  detection  │  │• Messages   │  │• Progress   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              React Application                      │ │
│  │  • Optimistic UI updates                           │ │
│  │  • Offline indicators                              │ │
│  │  • Progressive enhancement                         │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
                              │
                              │ Network Available
                              ▼
┌─────────────────────────────────────────────────────────┐
│                 Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│ • PostgreSQL with conflict-free data types              │
│ • Real-time subscriptions for online users             │
│ • Conflict resolution at database level                │
│ • Audit trails for all changes                         │
└─────────────────────────────────────────────────────────┘
```

## Local Storage Strategy

### 1. IndexedDB Schema (via Dexie.js)
```typescript
import Dexie, { Table } from 'dexie';

interface LocalJob {
  id: string;
  customer_id: string;
  title: string;
  address: string;
  location: { lat: number; lng: number };
  scheduled_date: Date;
  status: 'scheduled' | 'in_progress' | 'completed';
  synced: boolean;
  last_modified: Date;
  version: number;
}

interface LocalVisit {
  id: string;
  job_id: string;
  crew_id: string;
  check_in_time?: Date;
  check_out_time?: Date;
  actual_start_time?: Date;
  actual_end_time?: Date;
  notes: string;
  photos: string[]; // Local file paths
  synced: boolean;
  conflict: boolean;
  last_modified: Date;
}

interface LocalPhoto {
  id: string;
  visit_id: string;
  local_path: string;
  type: 'before' | 'after' | 'progress';
  captured_at: Date;
  location: { lat: number; lng: number };
  checksum: string;
  uploaded: boolean;
  upload_url?: string;
  file_size: number;
}

interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  record_id: string;
  data: any;
  created_at: Date;
  retry_count: number;
  last_error?: string;
}

class OfflineDatabase extends Dexie {
  jobs!: Table<LocalJob>;
  visits!: Table<LocalVisit>;
  photos!: Table<LocalPhoto>;
  sync_queue!: Table<SyncOperation>;
  customers!: Table<LocalCustomer>;
  chat_messages!: Table<LocalChatMessage>;

  constructor() {
    super('LandscapeAppDB');
    
    this.version(1).stores({
      jobs: 'id, customer_id, scheduled_date, synced, last_modified',
      visits: 'id, job_id, crew_id, synced, conflict, last_modified',
      photos: 'id, visit_id, uploaded, captured_at',
      sync_queue: 'id, table, created_at, retry_count',
      customers: 'id, name, synced, last_modified',
      chat_messages: 'id, customer_id, created_at, synced'
    });
  }
}

export const db = new OfflineDatabase();
```

### 2. Service Worker Caching
```typescript
// service-worker.ts
const CACHE_NAME = 'landscape-app-v1';
const OFFLINE_CACHE_NAME = 'landscape-app-offline-v1';

const STATIC_ASSETS = [
  '/',
  '/app.js',
  '/app.css',
  '/manifest.json',
  '/offline.html'
];

const API_CACHE_PATTERNS = [
  '/api/jobs',
  '/api/customers', 
  '/api/crews'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => 
        cache.addAll(STATIC_ASSETS)
      ),
      // Pre-cache essential API endpoints
      caches.open(OFFLINE_CACHE_NAME).then(cache =>
        cache.addAll(API_CACHE_PATTERNS.map(pattern => 
          `/api/offline-data${pattern}`
        ))
      )
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  if (request.method !== 'GET') {
    // Queue non-GET requests for later sync
    event.respondWith(handleOfflineWrite(request));
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then(fetchResponse => {
            // Cache successful API responses
            if (isAPIRequest(request) && fetchResponse.ok) {
              const responseClone = fetchResponse.clone();
              caches.open(OFFLINE_CACHE_NAME)
                .then(cache => cache.put(request, responseClone));
            }
            return fetchResponse;
          })
          .catch(() => {
            // Return cached version or offline page
            return caches.match('/offline.html');
          });
      })
  );
});
```

## Sync Manager Implementation

### 1. Sync Queue Processing
```typescript
interface SyncConfig {
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
  conflictResolution: 'server_wins' | 'client_wins' | 'manual';
}

class SyncManager {
  private config: SyncConfig = {
    maxRetries: 3,
    retryDelayMs: 5000,
    batchSize: 10,
    conflictResolution: 'server_wins'
  };

  async startSync(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return { success: false, reason: 'offline' };
    }

    const operations = await db.sync_queue
      .where('retry_count')
      .below(this.config.maxRetries)
      .limit(this.config.batchSize)
      .toArray();

    if (operations.length === 0) {
      return { success: true, operations_synced: 0 };
    }

    const results = await Promise.allSettled(
      operations.map(op => this.processSyncOperation(op))
    );

    let successCount = 0;
    let errorCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
        this.removeFromSyncQueue(operations[index].id);
      } else {
        errorCount++;
        this.handleSyncFailure(operations[index], result.reason);
      }
    });

    return {
      success: errorCount === 0,
      operations_synced: successCount,
      operations_failed: errorCount
    };
  }

  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    switch (operation.operation) {
      case 'create':
        return this.syncCreate(operation);
      case 'update':
        return this.syncUpdate(operation);
      case 'delete':
        return this.syncDelete(operation);
    }
  }

  private async syncCreate(operation: SyncOperation): Promise<void> {
    const { table, data } = operation;
    
    try {
      const response = await fetch(`/api/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const serverData = await response.json();
      
      // Update local record with server response
      await this.updateLocalRecord(table, operation.record_id, {
        ...serverData,
        synced: true,
        conflict: false
      });

    } catch (error) {
      throw new Error(`Create sync failed: ${error.message}`);
    }
  }

  private async syncUpdate(operation: SyncOperation): Promise<void> {
    const { table, record_id, data } = operation;
    
    try {
      // Check for conflicts by comparing versions
      const serverVersion = await this.getServerVersion(table, record_id);
      const localVersion = data.version;

      if (serverVersion > localVersion) {
        // Conflict detected
        await this.handleConflict(table, record_id, data, serverVersion);
        return;
      }

      const response = await fetch(`/api/${table}/${record_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          ...data,
          version: localVersion
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedData = await response.json();
      
      await this.updateLocalRecord(table, record_id, {
        ...updatedData,
        synced: true,
        conflict: false
      });

    } catch (error) {
      throw new Error(`Update sync failed: ${error.message}`);
    }
  }
}
```

### 2. Conflict Resolution
```typescript
interface ConflictResolution {
  resolution: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  merged_data?: any;
  requires_user_input?: boolean;
}

class ConflictResolver {
  async resolveConflict(
    table: string,
    recordId: string,
    localData: any,
    serverData: any
  ): Promise<ConflictResolution> {
    
    // Automatic resolution rules
    if (table === 'visits' && this.isTimingConflict(localData, serverData)) {
      return this.resolveTimingConflict(localData, serverData);
    }

    if (table === 'jobs' && this.isPricingConflict(localData, serverData)) {
      return this.resolvePricingConflict(localData, serverData);
    }

    // Default to server wins for most conflicts
    return {
      resolution: 'server_wins',
      requires_user_input: false
    };
  }

  private resolveTimingConflict(local: any, server: any): ConflictResolution {
    // For timing data, prefer more recent timestamps
    const localTime = new Date(local.last_modified);
    const serverTime = new Date(server.last_modified);

    if (localTime > serverTime) {
      return {
        resolution: 'client_wins',
        requires_user_input: false
      };
    }

    return {
      resolution: 'server_wins', 
      requires_user_input: false
    };
  }

  private resolvePricingConflict(local: any, server: any): ConflictResolution {
    // For pricing conflicts, require manual resolution
    return {
      resolution: 'manual',
      requires_user_input: true,
      merged_data: {
        local_price: local.actual_price,
        server_price: server.actual_price,
        suggested_resolution: local.actual_price > server.actual_price ? 'client_wins' : 'server_wins'
      }
    };
  }
}
```

### 3. Photo Upload with Resumability
```typescript
class PhotoUploader {
  private uploadQueue: Map<string, UploadProgress> = new Map();

  async queuePhotoUpload(photo: LocalPhoto): Promise<void> {
    if (this.uploadQueue.has(photo.id)) {
      return; // Already queued
    }

    this.uploadQueue.set(photo.id, {
      photo_id: photo.id,
      progress: 0,
      status: 'queued',
      retry_count: 0
    });

    // Start upload if online
    if (navigator.onLine) {
      this.processUploadQueue();
    }
  }

  private async processUploadQueue(): Promise<void> {
    const queuedUploads = Array.from(this.uploadQueue.values())
      .filter(upload => upload.status === 'queued')
      .slice(0, 3); // Max 3 concurrent uploads

    await Promise.all(
      queuedUploads.map(upload => this.uploadPhoto(upload))
    );
  }

  private async uploadPhoto(uploadProgress: UploadProgress): Promise<void> {
    const photo = await db.photos.get(uploadProgress.photo_id);
    if (!photo) return;

    try {
      uploadProgress.status = 'uploading';
      
      // Check if upload was previously started
      const resumePosition = await this.getResumePosition(photo.id);
      
      const file = await this.getLocalFile(photo.local_path);
      const chunk = file.slice(resumePosition);

      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('photo_id', photo.id);
      formData.append('resume_position', resumePosition.toString());
      formData.append('total_size', file.size.toString());

      const response = await fetch(`/api/photos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Update photo record
      await db.photos.update(photo.id, {
        uploaded: true,
        upload_url: result.url,
        synced: true
      });

      uploadProgress.status = 'completed';
      uploadProgress.progress = 100;

      // Clean up local file
      await this.cleanupLocalFile(photo.local_path);

    } catch (error) {
      uploadProgress.retry_count++;
      
      if (uploadProgress.retry_count >= 3) {
        uploadProgress.status = 'failed';
      } else {
        uploadProgress.status = 'queued';
        // Retry after delay
        setTimeout(() => {
          this.processUploadQueue();
        }, 5000 * uploadProgress.retry_count);
      }
    }
  }
}
```

## UI Patterns for Offline Sync

### 1. Sync Status Indicators
```typescript
interface SyncStatus {
  online: boolean;
  sync_in_progress: boolean;
  pending_operations: number;
  last_sync: Date | null;
  conflicts: ConflictItem[];
}

const SyncStatusBar: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>();

  return (
    <div className="sync-status-bar">
      {!syncStatus?.online && (
        <div className="offline-indicator">
          📡 Offline - Changes will sync when connected
        </div>
      )}
      
      {syncStatus?.sync_in_progress && (
        <div className="sync-progress">
          🔄 Syncing {syncStatus.pending_operations} items...
        </div>
      )}
      
      {syncStatus?.conflicts.length > 0 && (
        <div className="conflict-indicator" onClick={showConflictResolution}>
          ⚠️ {syncStatus.conflicts.length} conflicts need attention
        </div>
      )}
      
      {syncStatus?.online && !syncStatus.sync_in_progress && (
        <div className="sync-complete">
          ✅ Last synced: {formatDistanceToNow(syncStatus.last_sync)}
        </div>
      )}
    </div>
  );
};
```

### 2. Optimistic UI Updates
```typescript
const useOptimisticUpdate = () => {
  const [pendingOperations, setPendingOperations] = useState<Map<string, any>>(new Map());

  const optimisticUpdate = async <T>(
    operation: () => Promise<T>,
    optimisticData: T,
    rollbackData?: T
  ): Promise<T> => {
    const operationId = generateId();
    
    // Apply optimistic update immediately
    setPendingOperations(prev => new Map(prev.set(operationId, optimisticData)));
    
    try {
      const result = await operation();
      
      // Remove from pending on success
      setPendingOperations(prev => {
        const next = new Map(prev);
        next.delete(operationId);
        return next;
      });
      
      return result;
    } catch (error) {
      // Rollback on failure
      if (rollbackData) {
        setPendingOperations(prev => new Map(prev.set(operationId, rollbackData)));
      } else {
        setPendingOperations(prev => {
          const next = new Map(prev);
          next.delete(operationId);
          return next;
        });
      }
      
      throw error;
    }
  };

  return { optimisticUpdate, pendingOperations };
};
```

### 3. Conflict Resolution UI
```typescript
const ConflictResolutionModal: React.FC<{ conflicts: ConflictItem[] }> = ({ conflicts }) => {
  const [selectedResolutions, setSelectedResolutions] = useState<Map<string, string>>(new Map());

  const resolveConflicts = async () => {
    const resolutions = Array.from(selectedResolutions.entries()).map(([conflictId, resolution]) => ({
      conflict_id: conflictId,
      resolution
    }));

    await syncManager.resolveConflicts(resolutions);
  };

  return (
    <Modal title="Resolve Sync Conflicts">
      {conflicts.map(conflict => (
        <div key={conflict.id} className="conflict-item">
          <h3>{conflict.table} - {conflict.record_id}</h3>
          
          <div className="conflict-options">
            <div className="local-data">
              <h4>Your Changes:</h4>
              <pre>{JSON.stringify(conflict.local_data, null, 2)}</pre>
              <button onClick={() => setSelectedResolutions(prev => 
                new Map(prev.set(conflict.id, 'client_wins'))
              )}>
                Keep My Changes
              </button>
            </div>
            
            <div className="server-data">
              <h4>Server Version:</h4>
              <pre>{JSON.stringify(conflict.server_data, null, 2)}</pre>
              <button onClick={() => setSelectedResolutions(prev => 
                new Map(prev.set(conflict.id, 'server_wins'))
              )}>
                Use Server Version
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <button onClick={resolveConflicts} disabled={selectedResolutions.size !== conflicts.length}>
        Resolve All Conflicts
      </button>
    </Modal>
  );
};
```

## Network Detection & Auto-Sync

### 1. Connection Monitoring
```typescript
class ConnectionMonitor {
  private syncManager: SyncManager;
  private retryTimeout?: number;

  constructor(syncManager: SyncManager) {
    this.syncManager = syncManager;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Additional connection quality monitoring
    this.monitorConnectionQuality();
  }

  private async handleOnline() {
    console.log('Connection restored, starting sync...');
    
    // Wait a moment for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (navigator.onLine) {
      await this.syncManager.startSync();
    }
  }

  private handleOffline() {
    console.log('Connection lost, queuing operations locally');
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private monitorConnectionQuality() {
    // Use Network Information API if available
    const connection = (navigator as any).connection;
    
    if (connection) {
      connection.addEventListener('change', () => {
        const { effectiveType, downlink, rtt } = connection;
        
        if (effectiveType === 'slow-2g' || downlink < 0.5 || rtt > 2000) {
          // Poor connection - reduce sync frequency
          this.syncManager.setConfig({ 
            batchSize: 5,
            retryDelayMs: 10000 
          });
        } else {
          // Good connection - normal sync frequency
          this.syncManager.setConfig({ 
            batchSize: 10,
            retryDelayMs: 5000 
          });
        }
      });
    }
  }
}
```
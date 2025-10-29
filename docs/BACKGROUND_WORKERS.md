# Background Workers & Job Processing

## Worker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Background Job Queue                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Sync      │  │   Media     │  │  Analytics  │     │
│  │  Worker     │  │   Worker    │  │   Worker    │     │
│  │             │  │             │  │             │     │
│  │ • Offline   │  │ • Upload    │  │ • Daily     │     │
│  │   data sync │  │   photos    │  │   summaries │     │
│  │ • Conflict  │  │ • Compress  │  │ • Revenue   │     │
│  │   resolution│  │   images    │  │   reports   │     │
│  │ • Retry     │  │ • Generate  │  │ • Duration  │     │
│  │   failed ops│  │   checksums │  │   averages  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Export    │  │   Route     │  │    ML       │     │
│  │   Worker    │  │ Optimizer   │  │  Worker     │     │
│  │             │  │             │  │             │     │
│  │ • QB CSV    │  │ • Daily     │  │ • Train     │     │
│  │   generation│  │ • route opt │  │   models    │     │
│  │ • Email     │  │ • Traffic   │  │ • Generate  │     │
│  │   reports   │  │   data      │  │   predictions│     │
│  │ • Archive   │  │ • Crew      │  │ • Update    │     │
│  │   old data  │  │   efficiency│  │   confidence │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 1. Offline Sync Worker

### Purpose
Handle synchronization of offline data when connection is restored.

### Job Types
```typescript
interface SyncJob {
  id: string;
  type: 'check_in' | 'check_out' | 'photo_upload' | 'job_update';
  data: any;
  created_at: Date;
  retry_count: number;
  last_error?: string;
}
```

### Processing Logic
```typescript
class SyncWorker {
  async processSyncQueue() {
    const pendingJobs = await this.getPendingJobs();
    
    for (const job of pendingJobs) {
      try {
        await this.processJob(job);
        await this.markJobCompleted(job.id);
      } catch (error) {
        await this.handleJobFailure(job, error);
      }
    }
  }

  private async processJob(job: SyncJob) {
    switch (job.type) {
      case 'check_in':
        return await this.syncCheckIn(job.data);
      case 'photo_upload':
        return await this.syncPhotoUpload(job.data);
      // ... other job types
    }
  }

  private async handleJobFailure(job: SyncJob, error: Error) {
    const maxRetries = 3;
    if (job.retry_count < maxRetries) {
      await this.scheduleRetry(job, error);
    } else {
      await this.moveToDeadLetterQueue(job, error);
    }
  }
}
```

### Conflict Resolution
```typescript
interface ConflictResolution {
  strategy: 'server_wins' | 'client_wins' | 'merge' | 'manual';
  audit_trail: AuditLog[];
}

async function resolveConflict(
  localData: any,
  serverData: any,
  conflictType: string
): Promise<ConflictResolution> {
  
  // Server-wins for most conflicts
  if (conflictType === 'concurrent_update') {
    return {
      strategy: 'server_wins',
      audit_trail: [{
        action: 'conflict_resolution',
        resolution: 'server_data_preserved',
        local_data: localData,
        server_data: serverData,
        timestamp: new Date()
      }]
    };
  }
  
  // Manual resolution for critical data
  if (conflictType === 'payment_discrepancy') {
    return {
      strategy: 'manual',
      audit_trail: []
    };
  }
}
```

## 2. Media Processing Worker

### Image Compression & Upload
```typescript
class MediaWorker {
  async processMediaUpload(job: MediaUploadJob) {
    const { file_path, visit_id, type } = job.data;
    
    // 1. Compress image
    const compressedImage = await this.compressImage(file_path);
    
    // 2. Generate checksum
    const checksum = await this.generateChecksum(compressedImage);
    
    // 3. Upload to storage
    const storageUrl = await this.uploadToStorage(compressedImage, visit_id);
    
    // 4. Update database record
    await this.updateMediaRecord({
      visit_id,
      file_path: storageUrl,
      checksum,
      file_size: compressedImage.size,
      uploaded_at: new Date()
    });
    
    // 5. Clean up local file
    await this.cleanupLocalFile(file_path);
  }

  private async compressImage(filePath: string): Promise<Blob> {
    const maxWidth = 1920;
    const maxHeight = 1080;
    const quality = 0.85;
    
    // Use canvas compression or WebAssembly-based compression
    return await compressImageToBlob(filePath, {
      maxWidth,
      maxHeight,
      quality
    });
  }
}
```

### Batch Processing
```typescript
interface BatchUploadJob {
  visit_id: string;
  photos: {
    type: 'before' | 'after' | 'progress';
    local_path: string;
    captured_at: Date;
    location: { lat: number; lng: number };
  }[];
}

async function processBatchUpload(job: BatchUploadJob) {
  const uploadPromises = job.photos.map(photo => 
    this.processMediaUpload({
      data: {
        file_path: photo.local_path,
        visit_id: job.visit_id,
        type: photo.type,
        captured_at: photo.captured_at,
        location: photo.location
      }
    })
  );
  
  await Promise.allSettled(uploadPromises);
}
```

## 3. Analytics Aggregation Worker

### Daily Summary Generation
```typescript
class AnalyticsWorker {
  async generateDailySummary(date: Date) {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const summary = await this.calculateMetrics(dayStart, dayEnd);
    
    await this.saveDailySummary({
      date,
      total_revenue: summary.revenue,
      job_count: summary.jobCount,
      average_duration: summary.avgDuration,
      crew_utilization: summary.crewUtilization,
      generated_at: new Date()
    });
  }

  private async calculateMetrics(start: Date, end: Date) {
    const visits = await this.getCompletedVisits(start, end);
    
    return {
      revenue: visits.reduce((sum, v) => sum + v.job.actual_price, 0),
      jobCount: visits.length,
      avgDuration: this.calculateAverageDuration(visits),
      crewUtilization: await this.calculateCrewUtilization(start, end)
    };
  }
}
```

### Historical Analysis
```typescript
interface HistoricalAnalysis {
  customer_id: string;
  average_job_price: number;
  average_duration: number;
  seasonal_patterns: {
    month: number;
    typical_frequency: number;
    price_variance: number;
  }[];
  crew_preferences: {
    crew_id: string;
    performance_score: number;
  }[];
}

async function analyzeCustomerHistory(customerId: string): Promise<HistoricalAnalysis> {
  const visits = await this.getCustomerVisits(customerId);
  
  return {
    customer_id: customerId,
    average_job_price: this.calculateAveragePrice(visits),
    average_duration: this.calculateAverageDuration(visits),
    seasonal_patterns: this.analyzeSeasonalPatterns(visits),
    crew_preferences: this.analyzeCrewPerformance(visits)
  };
}
```

## 4. Export Generation Worker

### QuickBooks CSV Export
```typescript
class ExportWorker {
  async generateDailyExport(date: Date) {
    const journalEntries = await this.buildJournalEntries(date);
    const csvContent = this.generateCSV(journalEntries);
    
    // Save to storage
    const fileName = `journal_entry_${format(date, 'yyyyMMdd')}.csv`;
    const filePath = await this.saveExportFile(fileName, csvContent);
    
    // Record export
    await this.recordExport({
      type: 'journal_entry',
      date_range_start: date,
      date_range_end: date,
      file_path: filePath,
      record_count: journalEntries.length
    });
    
    // Email to accountant
    await this.emailExport(filePath);
  }

  private async buildJournalEntries(date: Date): Promise<JournalEntry[]> {
    const visits = await this.getCompletedVisits(date);
    const payments = await this.getPayments(date);
    
    const entries: JournalEntry[] = [];
    
    // Revenue entry
    const totalRevenue = visits.reduce((sum, v) => sum + v.job.actual_price, 0);
    entries.push({
      date: format(date, 'yyyy-MM-dd'),
      account: 'Revenue - Lawn Care',
      credit: totalRevenue,
      description: 'Daily Revenue Summary',
      memo: `${visits.length} jobs completed`
    });
    
    // Processing fees
    const processingFees = this.calculateProcessingFees(payments);
    entries.push({
      date: format(date, 'yyyy-MM-dd'),
      account: 'Processing Fees',
      debit: processingFees,
      description: 'Payment processor fees'
    });
    
    return entries;
  }
}
```

## 5. Route Optimization Worker

### Daily Route Calculation
```typescript
class RouteOptimizer {
  async optimizeDailyRoutes(date: Date) {
    const crews = await this.getActiveCrews();
    const scheduledJobs = await this.getScheduledJobs(date);
    
    for (const crew of crews) {
      const crewJobs = this.assignJobsToCrew(scheduledJobs, crew);
      const optimizedRoute = await this.calculateOptimalRoute(crewJobs, crew.current_location);
      
      await this.updateCrewRoute(crew.id, optimizedRoute);
    }
  }

  private async calculateOptimalRoute(
    jobs: Job[],
    startLocation: Location
  ): Promise<OptimizedRoute> {
    
    // Simple nearest neighbor + 2-opt improvement
    let route = this.nearestNeighborTSP(jobs, startLocation);
    route = this.twoOptImprove(route);
    
    return {
      job_order: route.map(job => job.id),
      total_distance: this.calculateTotalDistance(route),
      estimated_time: this.calculateTotalTime(route)
    };
  }
}
```

## 6. Machine Learning Worker

### Auto-Population Model Training
```typescript
class MLWorker {
  async trainPricingModel() {
    const trainingData = await this.getHistoricalJobData();
    
    const features = trainingData.map(job => ({
      property_size: job.estimated_square_feet,
      service_type: job.service_type_id,
      season: getMonth(job.created_at),
      crew_efficiency: job.crew_performance_score,
      location_premium: job.location_price_factor
    }));
    
    const targets = trainingData.map(job => job.actual_price);
    
    // Train simple linear regression model
    const model = await this.trainLinearRegression(features, targets);
    
    // Save model for prediction
    await this.saveModel('pricing_model_v1', model);
  }

  async generatePricePrediction(job: JobInput): Promise<PricePrediction> {
    const model = await this.loadModel('pricing_model_v1');
    const features = this.extractFeatures(job);
    
    const prediction = model.predict(features);
    const confidence = this.calculateConfidence(prediction, features);
    
    return {
      suggested_price: Math.round(prediction * 100) / 100,
      confidence_score: Math.round(confidence * 100),
      factors: this.explainPrediction(features, prediction)
    };
  }
}
```

## Job Scheduling & Monitoring

### Cron Schedule Configuration
```typescript
const jobSchedules = {
  // Every 5 minutes - sync worker
  '*/5 * * * *': () => syncWorker.processSyncQueue(),
  
  // Every 30 minutes - media processing  
  '*/30 * * * *': () => mediaWorker.processUploadQueue(),
  
  // Daily at 11:30 PM - daily exports
  '30 23 * * *': () => exportWorker.generateDailyExport(new Date()),
  
  // Daily at 1:00 AM - analytics aggregation
  '0 1 * * *': () => analyticsWorker.generateDailySummary(subDays(new Date(), 1)),
  
  // Daily at 6:00 AM - route optimization
  '0 6 * * *': () => routeOptimizer.optimizeDailyRoutes(new Date()),
  
  // Weekly on Sunday - ML model retraining
  '0 2 * * 0': () => mlWorker.trainModels()
};
```

### Error Handling & Monitoring
```typescript
interface JobMetrics {
  job_type: string;
  success_count: number;
  failure_count: number;
  average_duration: number;
  last_success: Date;
  last_failure: Date;
}

class JobMonitor {
  async recordJobExecution(jobType: string, duration: number, success: boolean) {
    await this.updateMetrics(jobType, { duration, success });
    
    if (!success) {
      await this.sendAlert(`Job ${jobType} failed`, {
        timestamp: new Date(),
        duration,
        recent_failures: await this.getRecentFailures(jobType)
      });
    }
  }

  async getHealthCheck(): Promise<HealthStatus> {
    const metrics = await this.getAllJobMetrics();
    
    return {
      overall_health: this.calculateOverallHealth(metrics),
      individual_jobs: metrics,
      alerts: await this.getActiveAlerts()
    };
  }
}
```

# Deployment & Operations Blueprint

## Infrastructure Architecture

### Cloud Environment (Google Cloud Platform)

```
┌─────────────────────────────────────────────────────────┐
│                     Production Setup                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   Cloud CDN     │    │        Load Balancer        │ │
│  │   (Global)      │    │     (HTTPS Termination)     │ │
│  │                 │    │                             │ │
│  │ • Static assets │    │ • SSL certificates          │ │
│  │ • Image caching │    │ • Health checks             │ │
│  │ • Edge locations│    │ • Auto-scaling triggers     │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│           │                           │                 │
│           └───────────────┐           │                 │
│                           ▼           ▼                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Cloud Run Services                     │ │
│  │                                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│ │
│  │  │   Frontend   │  │   Backend    │  │   Worker   ││ │
│  │  │   (PWA)      │  │   (API)      │  │  Services  ││ │
│  │  │              │  │              │  │            ││ │
│  │  │ • React app  │  │ • Supabase   │  │ • Sync     ││ │
│  │  │ • Service    │  │   proxy      │  │ • Media    ││ │
│  │  │   worker     │  │ • Auth       │  │ • Analytics││ │
│  │  │ • Offline    │  │ • Business   │  │ • Exports  ││ │
│  │  │   caching    │  │   logic      │  │ • Routes   ││ │
│  │  └──────────────┘  └──────────────┘  └────────────┘│ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                             │
│                           ▼                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               Supabase (Managed)                    │ │
│  │                                                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │ PostgreSQL  │  │  Storage    │  │ Edge        │ │ │
│  │  │ + PostGIS   │  │   Bucket    │  │ Functions   │ │ │
│  │  │             │  │             │  │             │ │ │
│  │  │ • Job data  │  │ • Photos    │  │ • ML models │ │ │
│  │  │ • User mgmt │  │ • Documents │  │ • Webhooks  │ │ │
│  │  │ • Analytics │  │ • Exports   │  │ • Integr.   │ │ │
│  │  │ • Audit logs│  │ • Backups   │  │ • Cron jobs │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘

External Services:
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Google Maps   │  │     Stripe      │  │   SendGrid      │
│   • Geocoding   │  │   • Payments    │  │   • Email       │
│   • Routing     │  │   • Invoicing   │  │   • SMS         │
│   • Traffic     │  │   • Webhooks    │  │   • Notifications│
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Container Configuration

### 1. Frontend Dockerfile
```dockerfile
# Frontend PWA Container
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# Service Worker support
COPY --from=builder /app/dist/sw.js /usr/share/nginx/html/
COPY --from=builder /app/dist/manifest.json /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. API Gateway Dockerfile  
```dockerfile
# API Gateway for Supabase integration
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY tsconfig.json ./

RUN npm run build

USER node
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### 3. Worker Services Dockerfile
```dockerfile
# Background job processing
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Install system dependencies for image processing
RUN apk add --no-cache \
    imagemagick \
    vips-dev

COPY workers/ ./workers/
COPY shared/ ./shared/

RUN npm run build:workers

CMD ["node", "workers/dist/index.js"]
```

## Kubernetes Manifests

### 1. Frontend Deployment
```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: landscape-frontend
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: landscape-frontend
  template:
    metadata:
      labels:
        app: landscape-frontend
    spec:
      containers:
      - name: frontend
        image: gcr.io/landscape-app/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi" 
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: landscape-frontend-service
spec:
  selector:
    app: landscape-frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

### 2. Background Workers
```yaml
# workers-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: landscape-workers
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: landscape-workers
  template:
    metadata:
      labels:
        app: landscape-workers
    spec:
      containers:
      - name: sync-worker
        image: gcr.io/landscape-app/workers:latest
        env:
        - name: WORKER_TYPE
          value: "sync"
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: supabase-config
              key: url
        - name: SUPABASE_SERVICE_KEY
          valueFrom:
            secretKeyRef:
              name: supabase-config  
              key: service-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "400m"
      - name: media-worker
        image: gcr.io/landscape-app/workers:latest
        env:
        - name: WORKER_TYPE
          value: "media"
        resources:
          requests:
            memory: "512Mi"
            cpu: "300m"
          limits:
            memory: "1Gi"
            cpu: "600m"
```

### 3. Ingress Configuration
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: landscape-app-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - app.landscapeorganizer.com
    secretName: landscape-app-tls
  rules:
  - host: app.landscapeorganizer.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: landscape-frontend-service
            port:
              number: 80
      - path: /api/
        pathType: Prefix
        backend:
          service:
            name: landscape-api-service
            port:
              number: 3000
```

## CI/CD Pipeline

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
      
    - name: Run type checking
      run: npm run type-check
      
    - name: Run linting
      run: npm run lint
      
    - name: Run unit tests
      run: npm run test
      
    - name: Run integration tests
      run: npm run test:integration
      env:
        TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: ${{ secrets.GCP_PROJECT_ID }}
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        
    - name: Configure Docker
      run: gcloud auth configure-docker
      
    - name: Build Frontend
      run: |
        docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/landscape-frontend:${{ github.sha }} .
        docker tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/landscape-frontend:${{ github.sha }} \
                   gcr.io/${{ secrets.GCP_PROJECT_ID }}/landscape-frontend:latest
        
    - name: Push Images
      run: |
        docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/landscape-frontend:${{ github.sha }}
        docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/landscape-frontend:latest
        
    - name: Deploy to GKE
      run: |
        gcloud container clusters get-credentials production-cluster \
          --zone us-central1-a
        kubectl set image deployment/landscape-frontend \
          frontend=gcr.io/${{ secrets.GCP_PROJECT_ID }}/landscape-frontend:${{ github.sha }}
        kubectl rollout status deployment/landscape-frontend
        
    - name: Run smoke tests
      run: |
        npm run test:smoke
      env:
        SMOKE_TEST_URL: https://app.landscapeorganizer.com
```

### 2. Database Migrations
```yaml
# .github/workflows/migrate.yml  
name: Database Migration

on:
  push:
    paths: ['supabase/migrations/**']
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Install Supabase CLI
      run: |
        curl -sSL https://github.com/supabase/cli/releases/download/v1.0.0/supabase_linux_amd64.tar.gz | tar -xz
        sudo mv supabase /usr/local/bin/
        
    - name: Run migrations
      run: |
        supabase db push --db-url ${{ secrets.DATABASE_URL }}
      env:
        SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        
    - name: Generate types
      run: |
        supabase gen types typescript --db-url ${{ secrets.DATABASE_URL }} > src/types/supabase.ts
        
    - name: Commit updated types
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add src/types/supabase.ts
        git diff --staged --quiet || git commit -m "Update Supabase types"
        git push
```

## Environment Configuration

### 1. Production Environment Variables
```bash
# Production .env
NODE_ENV=production
LOG_LEVEL=info

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# External API Keys
GOOGLE_MAPS_API_KEY=your-google-maps-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-public
SENDGRID_API_KEY=your-sendgrid-key

# Storage Configuration  
GCS_BUCKET_NAME=landscape-app-media
GCS_PROJECT_ID=landscape-app-production

# Redis Configuration (for caching)
REDIS_URL=redis://production-redis:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Security
JWT_SECRET=your-jwt-secret-256-bit
ENCRYPTION_KEY=your-encryption-key
```

### 2. Staging Environment
```bash
# Staging .env
NODE_ENV=staging
LOG_LEVEL=debug

# Supabase Staging
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_ANON_KEY=staging-anon-key

# Test API Keys
STRIPE_SECRET_KEY=sk_test_your-test-key
GOOGLE_MAPS_API_KEY=your-test-maps-key

# Reduced resources
WORKER_CONCURRENCY=2
CACHE_TTL=300
```

## Monitoring & Observability

### 1. Health Checks
```typescript
// health-check.ts
import { createClient } from '@supabase/supabase-js';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: {
    database: boolean;
    storage: boolean;
    external_apis: boolean;
    workers: boolean;
  };
  timestamp: string;
  version: string;
}

export async function healthCheck(): Promise<HealthStatus> {
  const checks = {
    database: await checkDatabase(),
    storage: await checkStorage(),
    external_apis: await checkExternalAPIs(),
    workers: await checkWorkers()
  };

  const allHealthy = Object.values(checks).every(check => check);
  const anyHealthy = Object.values(checks).some(check => check);

  return {
    status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'unknown'
  };
}

async function checkDatabase(): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data, error } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}
```

### 2. Metrics Collection
```typescript
// metrics.ts
import { createPrometheusMetrics } from '@prometheus/client';

// Business metrics
export const jobCompletionTime = new Histogram({
  name: 'job_completion_duration_seconds',
  help: 'Time taken to complete landscape jobs',
  labelNames: ['crew_id', 'job_type']
});

export const photoUploadSize = new Histogram({
  name: 'photo_upload_size_bytes',
  help: 'Size of uploaded photos',
  buckets: [100000, 500000, 1000000, 5000000] // 100KB to 5MB
});

export const syncOperations = new Counter({
  name: 'sync_operations_total',
  help: 'Total number of offline sync operations',
  labelNames: ['operation_type', 'status']
});

export const revenueGenerated = new Gauge({
  name: 'daily_revenue_dollars',
  help: 'Daily revenue generated in USD'
});

// Technical metrics
export const apiRequestDuration = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration',
  labelNames: ['method', 'endpoint', 'status']
});

export const activeUsers = new Gauge({
  name: 'active_users_current',
  help: 'Currently active users by role',
  labelNames: ['role']
});
```

### 3. Alerting Rules
```yaml
# alerting-rules.yml
groups:
- name: landscape-app
  rules:
  - alert: HighErrorRate
    expr: rate(api_request_duration_seconds_count{status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High API error rate detected"
      description: "Error rate is {{ $value }} errors per second"

  - alert: DatabaseConnectionFailure
    expr: up{job="landscape-database"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database connection lost"
      
  - alert: PhotoUploadBacklog
    expr: sync_operations_total{operation_type="photo_upload",status="pending"} > 100
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Photo upload backlog building up"
      
  - alert: LowDailyRevenue
    expr: daily_revenue_dollars < 500
    for: 1d
    labels:
      severity: warning
    annotations:
      summary: "Daily revenue below target"
      description: "Revenue today: ${{ $value }}"
```

## Security Configuration

### 1. Network Security
```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: landscape-app-network-policy
spec:
  podSelector:
    matchLabels:
      app: landscape-frontend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 80
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: supabase
    ports:
    - protocol: TCP
      port: 443
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

### 2. Pod Security Policy
```yaml
# pod-security-policy.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: landscape-app-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

## Backup & Disaster Recovery

### 1. Database Backups
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="landscape_backup_${DATE}.sql"

# Full database backup
pg_dump $DATABASE_URL > /backups/$BACKUP_FILE

# Compress backup
gzip /backups/$BACKUP_FILE

# Upload to Cloud Storage
gsutil cp /backups/${BACKUP_FILE}.gz gs://landscape-app-backups/

# Cleanup local files older than 7 days
find /backups -name "*.gz" -mtime +7 -delete

# Test backup integrity
gunzip -c /backups/${BACKUP_FILE}.gz | head -n 20
```

### 2. Disaster Recovery Runbook
```markdown
# Disaster Recovery Procedures

## Service Outage Response

### 1. Assessment (0-5 minutes)
- [ ] Check health endpoints: https://app.landscapeorganizer.com/health
- [ ] Verify Supabase status: https://status.supabase.com
- [ ] Check GCP status: https://status.cloud.google.com
- [ ] Review monitoring dashboards for error spikes

### 2. Communication (5-10 minutes)
- [ ] Post status update: "Investigating service disruption"
- [ ] Notify stakeholders via Slack #incidents channel
- [ ] Update status page if customer-facing impact

### 3. Investigation (10-30 minutes)
- [ ] Check recent deployments in GitHub Actions
- [ ] Review application logs: `kubectl logs -f deployment/landscape-frontend`
- [ ] Check database connections and slow queries
- [ ] Verify external API status (Google Maps, Stripe)

### 4. Mitigation Actions
- [ ] Rollback recent deployment if suspect: `kubectl rollout undo deployment/landscape-frontend`
- [ ] Scale up resources if performance issue: `kubectl scale deployment landscape-frontend --replicas=6`
- [ ] Restart unhealthy pods: `kubectl delete pod -l app=landscape-frontend`
- [ ] Enable maintenance mode if needed

### 5. Recovery Validation (30-45 minutes)
- [ ] Verify all health checks pass
- [ ] Test critical user flows (check-in, photo upload, payments)
- [ ] Confirm data integrity with sample queries
- [ ] Monitor error rates return to baseline

### 6. Post-Incident (1-4 hours)
- [ ] Document incident timeline and root cause
- [ ] Schedule blameless post-mortem meeting
- [ ] Identify prevention/detection improvements
- [ ] Update runbooks and monitoring based on learnings

## Data Recovery Scenarios

### Database Corruption
1. Stop all write operations
2. Restore from latest backup: `pg_restore landscape_backup_latest.sql`
3. Replay transaction logs if available
4. Validate data integrity before resuming service

### Complete Infrastructure Loss  
1. Provision new GKE cluster in different region
2. Restore Supabase project from backup
3. Deploy application from last known good commit
4. Update DNS to point to new infrastructure
5. Verify all integrations reconnect properly

Recovery Time Objectives:
- Service restoration: < 4 hours
- Data loss tolerance: < 15 minutes
- Communication updates: < 30 minutes
```

This deployment blueprint provides production-ready infrastructure with proper monitoring, security, and disaster recovery capabilities for the landscape job organizer application.
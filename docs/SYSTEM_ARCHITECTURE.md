# Landscape Job Organizer - System Architecture Blueprint

## Overview
Mobile-first internal application for landscape job organization with offline-first design, real-time sync, and comprehensive audit trails.

## Architecture Components

### 1. Frontend Layer (PWA - React/TypeScript)
```
┌─────────────────────────────────────────────────┐
│                 PWA Frontend                    │
├─────────────────────────────────────────────────┤
│ • React + TypeScript + Vite                    │
│ • Tailwind CSS + shadcn/ui components          │
│ • Service Worker for offline support           │
│ • Local SQLite cache (via Dexie.js)           │
│ • Geolocation API + Camera API                 │
│ • Push notifications                            │
└─────────────────────────────────────────────────┘
```

### 2. Backend Layer (Supabase)
```
┌─────────────────────────────────────────────────┐
│                 Supabase Backend                │
├─────────────────────────────────────────────────┤
│ • PostgreSQL + PostGIS for geospatial data     │
│ • Row Level Security (RLS) policies            │
│ • Real-time subscriptions                      │
│ • Storage for media files                      │
│ • Edge Functions for business logic            │
│ • Auth with Google Workspace integration       │
└─────────────────────────────────────────────────┘
```

### 3. Integration Layer
```
┌─────────────────────────────────────────────────┐
│              External Integrations              │
├─────────────────────────────────────────────────┤
│ • Google Maps/Mapbox (route optimization)      │
│ • PayPal/Stripe (payment processing)           │
│ • QuickBooks API (optional future)             │
│ • Google Workspace (auth & calendar)           │
│ • SMS/Email notifications                       │
└─────────────────────────────────────────────────┘
```

## Component Rationale

### PWA Choice over Native
- **Single Codebase**: One codebase for iOS/Android/Desktop
- **Instant Updates**: No app store approval process
- **Offline First**: Service workers provide robust offline capabilities
- **Camera/GPS Access**: Modern PWA APIs support all required hardware features
- **Lower Cost**: Faster development and maintenance

### Supabase Backend Benefits
- **Real-time**: Built-in real-time subscriptions for live updates
- **Geospatial**: PostGIS extension for geofence calculations
- **Security**: Row Level Security for role-based access
- **Scalability**: Managed PostgreSQL with automatic scaling
- **Edge Functions**: Serverless functions for business logic

### Offline-First Design
- **Local SQLite Cache**: Dexie.js for structured offline storage
- **Conflict Resolution**: Server-wins strategy with audit trails
- **Sync Indicators**: Clear UI feedback for sync status
- **Background Sync**: Service worker handles sync when online

## Security Architecture

### Authentication Flow
```
User Login → Google OAuth → JWT Token → RLS Policies → Data Access
```

### Role-Based Access Control
- **crew**: Limited to own check-ins, photos, timers
- **manager**: Full dispatch, overrides, customer chat
- **accountant**: Payment reconciliation, export access
- **customer**: Order placement, payments, chat

### Data Encryption
- **In Transit**: TLS 1.3 for all communications
- **At Rest**: Supabase transparent encryption
- **Media Files**: Encrypted storage with signed URLs

## Performance Considerations

### Offline Performance
- **Lazy Loading**: Route-based code splitting
- **Image Compression**: Client-side before upload
- **Background Sync**: Queue operations for later sync
- **Optimistic UI**: Immediate feedback with rollback capability

### Real-time Performance
- **Selective Subscriptions**: Only subscribe to relevant data
- **Debounced Updates**: Batch rapid changes
- **Connection Resilience**: Automatic reconnection logic

## Scalability Design

### Horizontal Scaling
- **Stateless Edge Functions**: Auto-scaling serverless functions
- **CDN Media Delivery**: Global edge caching for images
- **Database Read Replicas**: For analytics and reporting queries
- **Connection Pooling**: Efficient database connection management

### Data Partitioning Strategy
- **Geographic Partitioning**: Jobs by service area
- **Temporal Partitioning**: Historical data archival
- **Media Optimization**: Progressive image loading and compression
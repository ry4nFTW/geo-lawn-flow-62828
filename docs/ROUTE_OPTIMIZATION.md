# Route Optimization Design

## Algorithm Overview

### Multi-Level Optimization Strategy
```
┌─────────────────────────────────────────────────────────┐
│                Route Optimization Pipeline              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Job Assignment Phase                               │
│     ┌─────────────────────────────────────────┐        │
│     │ • Crew availability analysis            │        │
│     │ • Skill matching (lawn vs landscaping) │        │
│     │ • Equipment requirements                │        │
│     │ • Customer preferences                  │        │
│     └─────────────────────────────────────────┘        │
│                          │                             │
│  2. Geographic Clustering                              │
│     ┌─────────────────────────────────────────┐        │
│     │ • K-means clustering by service area    │        │
│     │ • Balance cluster sizes by crew capacity│        │
│     │ • Account for travel time between areas │        │
│     └─────────────────────────────────────────┘        │
│                          │                             │
│  3. Route Sequencing                                   │
│     ┌─────────────────────────────────────────┐        │
│     │ • Nearest Neighbor TSP approximation    │        │
│     │ • 2-Opt local improvement               │        │
│     │ • Time window constraints               │        │
│     └─────────────────────────────────────────┘        │
│                          │                             │
│  4. Real-time Optimization                             │
│     ┌─────────────────────────────────────────┐        │
│     │ • Traffic-aware routing (optional)      │        │
│     │ • Dynamic re-routing for delays         │        │
│     │ • Customer cancellation handling        │        │
│     └─────────────────────────────────────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Core Algorithm Implementation

### 1. Nearest Neighbor TSP
```typescript
interface Location {
  id: string;
  latitude: number;
  longitude: number;
  estimated_duration: number;
  time_window_start?: Date;
  time_window_end?: Date;
}

class RouteOptimizer {
  nearestNeighborTSP(jobs: Job[], startLocation: Location): Job[] {
    const unvisited = [...jobs];
    const route: Job[] = [];
    let currentLocation = startLocation;
    
    while (unvisited.length > 0) {
      // Find nearest unvisited job
      let nearestIndex = 0;
      let minDistance = this.calculateDistance(currentLocation, unvisited[0].location);
      
      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(currentLocation, unvisited[i].location);
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      
      // Add to route and remove from unvisited
      const selectedJob = unvisited.splice(nearestIndex, 1)[0];
      route.push(selectedJob);
      currentLocation = selectedJob.location;
    }
    
    return route;
  }

  private calculateDistance(loc1: Location, loc2: Location): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(loc1.latitude)) * 
              Math.cos(this.toRadians(loc2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
```

### 2. 2-Opt Route Improvement
```typescript
class RouteOptimizer {
  twoOptImprove(route: Job[]): Job[] {
    let improved = true;
    let bestRoute = [...route];
    
    while (improved) {
      improved = false;
      
      for (let i = 1; i < bestRoute.length - 1; i++) {
        for (let j = i + 1; j < bestRoute.length; j++) {
          // Create new route by reversing segment between i and j
          const newRoute = [...bestRoute];
          newRoute.splice(i, j - i, ...bestRoute.slice(i, j).reverse());
          
          if (this.calculateRouteDistance(newRoute) < this.calculateRouteDistance(bestRoute)) {
            bestRoute = newRoute;
            improved = true;
          }
        }
      }
    }
    
    return bestRoute;
  }

  private calculateRouteDistance(route: Job[]): number {
    let totalDistance = 0;
    
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += this.calculateDistance(route[i].location, route[i + 1].location);
    }
    
    return totalDistance;
  }
}
```

### 3. Time Window Constraints
```typescript
interface TimeWindow {
  start: Date;
  end: Date;
}

class RouteOptimizer {
  validateTimeWindows(route: Job[], startTime: Date): RouteValidation {
    let currentTime = new Date(startTime);
    const violations: TimeViolation[] = [];
    
    for (const job of route) {
      // Add travel time to current location
      const travelTime = this.estimateTravelTime(
        currentTime, 
        job.location
      );
      
      currentTime.setMinutes(currentTime.getMinutes() + travelTime);
      
      // Check if we arrive within time window
      if (job.time_window_start && currentTime < job.time_window_start) {
        // Wait until window opens
        currentTime = new Date(job.time_window_start);
      } else if (job.time_window_end && currentTime > job.time_window_end) {
        // Time window violation
        violations.push({
          job_id: job.id,
          scheduled_arrival: currentTime,
          window_end: job.time_window_end,
          violation_minutes: this.minutesBetween(job.time_window_end, currentTime)
        });
      }
      
      // Add job duration
      currentTime.setMinutes(currentTime.getMinutes() + job.estimated_duration);
    }
    
    return {
      is_valid: violations.length === 0,
      violations,
      total_time: this.minutesBetween(startTime, currentTime)
    };
  }
}
```

## Advanced Optimization Features

### 1. Geographic Clustering
```typescript
interface ServiceArea {
  id: string;
  center: Location;
  radius: number;
  typical_crew_count: number;
}

class GeographicOptimizer {
  clusterJobsByArea(jobs: Job[], crews: Crew[]): CrewAssignment[] {
    // Use K-means clustering based on crew count
    const clusters = this.kMeansCluster(
      jobs.map(j => j.location), 
      crews.length
    );
    
    const assignments: CrewAssignment[] = [];
    
    for (let i = 0; i < clusters.length; i++) {
      const clusterJobs = jobs.filter(job => 
        clusters[i].includes(job.location)
      );
      
      assignments.push({
        crew: crews[i],
        jobs: clusterJobs,
        estimated_travel_time: this.calculateClusterTravelTime(clusterJobs),
        workload_balance: this.calculateWorkloadBalance(clusterJobs)
      });
    }
    
    return this.balanceWorkloads(assignments);
  }

  private balanceWorkloads(assignments: CrewAssignment[]): CrewAssignment[] {
    // Reassign jobs to balance workload if needed
    const avgWorkload = assignments.reduce((sum, a) => 
      sum + a.jobs.length, 0) / assignments.length;
    
    // Move jobs from overloaded crews to underloaded ones
    for (const assignment of assignments) {
      if (assignment.jobs.length > avgWorkload * 1.2) {
        const excess = assignment.jobs.splice(Math.floor(avgWorkload));
        this.redistributeJobs(excess, assignments);
      }
    }
    
    return assignments;
  }
}
```

### 2. Real-time Traffic Integration (Optional)
```typescript
interface TrafficData {
  from: Location;
  to: Location;
  duration_minutes: number;
  traffic_factor: number; // 1.0 = normal, 1.5 = heavy traffic
}

class TrafficAwareOptimizer {
  async getTrafficAwareRoute(
    jobs: Job[], 
    startTime: Date
  ): Promise<OptimizedRoute> {
    
    // Get traffic data from external API
    const trafficMatrix = await this.fetchTrafficData(
      jobs.map(j => j.location),
      startTime
    );
    
    // Adjust distance calculations with traffic data
    const adjustedRoute = this.optimizeWithTraffic(jobs, trafficMatrix);
    
    return adjustedRoute;
  }

  private async fetchTrafficData(
    locations: Location[], 
    startTime: Date
  ): Promise<TrafficData[][]> {
    
    // Integration with Google Maps or Mapbox Traffic API
    const response = await fetch(`https://api.mapbox.com/directions-matrix/v1/mapbox/driving`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MAPBOX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates: locations.map(loc => [loc.longitude, loc.latitude]),
        depart_at: startTime.toISOString(),
        annotations: ['duration', 'distance']
      })
    });
    
    const data = await response.json();
    return this.parseTrafficMatrix(data);
  }
}
```

### 3. Dynamic Re-routing
```typescript
interface RouteUpdate {
  type: 'delay' | 'cancellation' | 'emergency' | 'new_job';
  affected_job_id?: string;
  new_job?: Job;
  delay_minutes?: number;
  reason: string;
}

class DynamicRouter {
  async handleRouteUpdate(
    crewId: string, 
    update: RouteUpdate
  ): Promise<UpdatedRoute> {
    
    const currentRoute = await this.getCurrentRoute(crewId);
    const crewPosition = await this.getCrewPosition(crewId);
    
    switch (update.type) {
      case 'delay':
        return this.handleDelay(currentRoute, update, crewPosition);
        
      case 'cancellation':
        return this.handleCancellation(currentRoute, update);
        
      case 'new_job':
        return this.insertNewJob(currentRoute, update.new_job!, crewPosition);
        
      default:
        return currentRoute;
    }
  }

  private async handleDelay(
    route: CrewRoute,
    update: RouteUpdate,
    position: Location
  ): Promise<UpdatedRoute> {
    
    // Find remaining jobs after current position
    const remainingJobs = route.jobs.filter(job => 
      !job.completed && this.isAfterCurrentPosition(job, position)
    );
    
    // Re-optimize remaining route with updated timing
    const newStartTime = new Date();
    newStartTime.setMinutes(newStartTime.getMinutes() + update.delay_minutes!);
    
    const optimizedRoute = await this.optimizeRoute(remainingJobs, position, newStartTime);
    
    // Notify affected customers of delays
    await this.notifyCustomersOfDelays(optimizedRoute, update.delay_minutes!);
    
    return {
      ...route,
      jobs: [...route.jobs.filter(j => j.completed), ...optimizedRoute.jobs],
      updated_at: new Date(),
      update_reason: update.reason
    };
  }
}
```

## Performance Optimization

### 1. Caching Strategy
```typescript
class RouteCache {
  private cache = new Map<string, OptimizedRoute>();
  private readonly TTL = 3600000; // 1 hour
  
  getCachedRoute(cacheKey: string): OptimizedRoute | null {
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isValidCache(cached)) {
      return cached;
    }
    
    this.cache.delete(cacheKey);
    return null;
  }
  
  setCachedRoute(key: string, route: OptimizedRoute): void {
    route.cached_at = new Date();
    this.cache.set(key, route);
  }
  
  private generateCacheKey(
    jobs: Job[], 
    crewId: string, 
    date: Date
  ): string {
    const jobIds = jobs.map(j => j.id).sort().join(',');
    const dateStr = date.toISOString().split('T')[0];
    return `route:${crewId}:${dateStr}:${this.hashJobIds(jobIds)}`;
  }
}
```

### 2. Parallel Processing
```typescript
class ParallelRouteOptimizer {
  async optimizeAllCrewRoutes(date: Date): Promise<CrewRoute[]> {
    const crews = await this.getActiveCrews();
    const jobs = await this.getScheduledJobs(date);
    
    // Assign jobs to crews in parallel
    const assignmentPromises = crews.map(crew =>
      this.optimizeCrewRoute(crew, jobs, date)
    );
    
    const routes = await Promise.all(assignmentPromises);
    
    // Post-process for global optimization
    return this.globalOptimizationPass(routes);
  }

  private async optimizeCrewRoute(
    crew: Crew,
    allJobs: Job[],
    date: Date
  ): Promise<CrewRoute> {
    
    // Filter jobs appropriate for this crew
    const crewJobs = this.filterJobsForCrew(allJobs, crew);
    
    // Generate cache key and check cache
    const cacheKey = this.generateCacheKey(crewJobs, crew.id, date);
    const cached = this.routeCache.getCachedRoute(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Optimize route
    const optimizedRoute = await this.calculateOptimalRoute(crewJobs, crew);
    
    // Cache result
    this.routeCache.setCachedRoute(cacheKey, optimizedRoute);
    
    return optimizedRoute;
  }
}
```

## Integration Points

### 1. External APIs
```typescript
interface ExternalRouteAPI {
  provider: 'google' | 'mapbox' | 'here';
  endpoint: string;
  apiKey: string;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

class ExternalRouteIntegration {
  async getOptimizedRoute(
    waypoints: Location[],
    options: RouteOptions
  ): Promise<ExternalRoute> {
    
    try {
      // Try external API first
      return await this.callExternalAPI(waypoints, options);
    } catch (error) {
      // Fallback to internal optimization
      console.warn('External API failed, using internal optimization:', error);
      return this.fallbackToInternal(waypoints, options);
    }
  }

  private async callExternalAPI(
    waypoints: Location[],
    options: RouteOptions
  ): Promise<ExternalRoute> {
    
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates: waypoints.map(w => [w.longitude, w.latitude]),
        roundtrip: false,
        source: 'first',
        destination: 'last',
        annotations: ['duration', 'distance']
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return this.parseExternalResponse(await response.json());
  }
}
```

### 2. Mobile App Integration
```typescript
// Mobile app receives optimized routes
interface MobileRouteUpdate {
  crew_id: string;
  route_version: number;
  jobs: {
    id: string;
    sequence: number;
    customer_name: string;
    address: string;
    estimated_arrival: Date;
    estimated_duration: number;
    navigation_url: string;
  }[];
  total_distance: number;
  estimated_completion: Date;
}

class MobileRouteSync {
  async pushRouteToMobile(crewId: string, route: OptimizedRoute) {
    const mobileUpdate: MobileRouteUpdate = {
      crew_id: crewId,
      route_version: route.version,
      jobs: route.jobs.map((job, index) => ({
        id: job.id,
        sequence: index + 1,
        customer_name: job.customer.name,
        address: job.address,
        estimated_arrival: this.calculateArrivalTime(route, index),
        estimated_duration: job.estimated_duration,
        navigation_url: this.generateNavigationUrl(job.location)
      })),
      total_distance: route.total_distance,
      estimated_completion: route.estimated_completion
    };

    // Push to mobile devices via WebSocket or push notification
    await this.sendToMobileDevices(crewId, mobileUpdate);
  }
}
```
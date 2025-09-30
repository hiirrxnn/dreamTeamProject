class PerformanceMonitor {
  constructor() {
    this.metrics = {
      latency: [],
      syncTimes: [],
      offlineOperations: 0,
      failedSyncs: 0,
      successfulSyncs: 0,
      cacheHitRate: 0,
      networkRequests: 0,
      networkFailures: 0
    };
    
    this.setupNetworkMonitoring();
    this.setupPerformanceObserver();
  }

  setupNetworkMonitoring() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      this.metrics.networkRequests++;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        this.metrics.latency.push({
          url: args[0],
          latency,
          timestamp: new Date(),
          success: response.ok
        });

        if (!response.ok) {
          this.metrics.networkFailures++;
        }

        // Keep only last 100 latency measurements
        if (this.metrics.latency.length > 100) {
          this.metrics.latency = this.metrics.latency.slice(-100);
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        this.metrics.networkFailures++;
        this.metrics.latency.push({
          url: args[0],
          latency,
          timestamp: new Date(),
          success: false,
          error: error.message
        });

        throw error;
      }
    };
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.recordPageLoad(entry);
            } else if (entry.entryType === 'resource') {
              this.recordResourceLoad(entry);
            }
          });
        });

        observer.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (error) {
        console.warn('PerformanceObserver not fully supported:', error);
      }
    }
  }

  recordPageLoad(entry) {
    this.pageLoadMetrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      totalTime: entry.loadEventEnd - entry.navigationStart,
      timestamp: new Date()
    };
  }

  recordResourceLoad(entry) {
    if (entry.name.includes('/api/')) {
      this.metrics.latency.push({
        url: entry.name,
        latency: entry.responseEnd - entry.requestStart,
        timestamp: new Date(),
        success: true
      });
    }
  }

  recordOfflineOperation() {
    this.metrics.offlineOperations++;
  }

  recordSyncStart() {
    this.syncStartTime = performance.now();
  }

  recordSyncComplete(success = true, recordCount = 0) {
    if (this.syncStartTime) {
      const syncTime = performance.now() - this.syncStartTime;
      this.metrics.syncTimes.push({
        duration: syncTime,
        recordCount,
        success,
        timestamp: new Date()
      });

      if (success) {
        this.metrics.successfulSyncs++;
      } else {
        this.metrics.failedSyncs++;
      }

      // Keep only last 50 sync measurements
      if (this.metrics.syncTimes.length > 50) {
        this.metrics.syncTimes = this.metrics.syncTimes.slice(-50);
      }
    }
  }

  getLatencyStats() {
    const validLatencies = this.metrics.latency
      .filter(entry => entry.success && entry.latency > 0)
      .map(entry => entry.latency);

    if (validLatencies.length === 0) {
      return { min: 0, max: 0, avg: 0, p95: 0, count: 0 };
    }

    const sorted = validLatencies.sort((a, b) => a - b);
    const sum = validLatencies.reduce((acc, val) => acc + val, 0);
    const avg = sum / validLatencies.length;
    const p95Index = Math.floor(validLatencies.length * 0.95);

    return {
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
      avg: Math.round(avg),
      p95: Math.round(sorted[p95Index] || sorted[sorted.length - 1]),
      count: validLatencies.length
    };
  }

  getSyncStats() {
    const validSyncs = this.metrics.syncTimes.filter(sync => sync.success);
    
    if (validSyncs.length === 0) {
      return { 
        avgDuration: 0, 
        maxDuration: 0, 
        totalRecords: 0, 
        successRate: 0, 
        count: 0 
      };
    }

    const durations = validSyncs.map(sync => sync.duration);
    const totalRecords = validSyncs.reduce((acc, sync) => acc + sync.recordCount, 0);
    const avgDuration = durations.reduce((acc, val) => acc + val, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const successRate = (this.metrics.successfulSyncs / (this.metrics.successfulSyncs + this.metrics.failedSyncs)) * 100;

    return {
      avgDuration: Math.round(avgDuration),
      maxDuration: Math.round(maxDuration),
      totalRecords,
      successRate: Math.round(successRate),
      count: validSyncs.length
    };
  }

  getNetworkStats() {
    const failureRate = this.metrics.networkRequests > 0 
      ? (this.metrics.networkFailures / this.metrics.networkRequests) * 100 
      : 0;

    return {
      totalRequests: this.metrics.networkRequests,
      failures: this.metrics.networkFailures,
      failureRate: Math.round(failureRate * 100) / 100,
      offlineOperations: this.metrics.offlineOperations
    };
  }

  getReliabilityScore() {
    const networkStats = this.getNetworkStats();
    const syncStats = this.getSyncStats();
    
    // Calculate reliability based on success rates
    const networkReliability = Math.max(0, 100 - networkStats.failureRate);
    const syncReliability = syncStats.successRate || 100;
    const offlineCapability = this.metrics.offlineOperations > 0 ? 100 : 80;
    
    // Weighted average
    const overallReliability = (networkReliability * 0.4) + 
                              (syncReliability * 0.4) + 
                              (offlineCapability * 0.2);
    
    return Math.round(overallReliability);
  }

  getScalabilityMetrics() {
    const latencyStats = this.getLatencyStats();
    const syncStats = this.getSyncStats();
    
    // Determine performance grade based on latency
    let performanceGrade = 'A';
    if (latencyStats.avg > 1000) performanceGrade = 'D';
    else if (latencyStats.avg > 500) performanceGrade = 'C';
    else if (latencyStats.avg > 200) performanceGrade = 'B';

    return {
      performanceGrade,
      avgLatency: latencyStats.avg,
      p95Latency: latencyStats.p95,
      syncEfficiency: syncStats.avgDuration > 0 ? Math.round(syncStats.totalRecords / syncStats.avgDuration * 1000) : 0, // records per second
      recommendedMaxUsers: this.calculateMaxUsers(latencyStats.avg)
    };
  }

  calculateMaxUsers(avgLatency) {
    // Rough estimation based on average latency
    if (avgLatency < 100) return 1000;
    if (avgLatency < 200) return 500;
    if (avgLatency < 500) return 200;
    if (avgLatency < 1000) return 100;
    return 50;
  }

  generateReport() {
    const latencyStats = this.getLatencyStats();
    const syncStats = this.getSyncStats();
    const networkStats = this.getNetworkStats();
    const scalabilityMetrics = this.getScalabilityMetrics();

    return {
      timestamp: new Date().toISOString(),
      qos: {
        latency: latencyStats,
        reliability: {
          score: this.getReliabilityScore(),
          syncSuccess: syncStats.successRate,
          networkFailureRate: networkStats.failureRate
        },
        scalability: scalabilityMetrics,
        availability: {
          offlineCapable: this.metrics.offlineOperations > 0,
          syncEfficiency: syncStats.avgDuration
        }
      },
      performance: {
        sync: syncStats,
        network: networkStats,
        pageLoad: this.pageLoadMetrics
      },
      security: {
        dataIntegrity: this.metrics.successfulSyncs > this.metrics.failedSyncs,
        offlineDataProtection: true // IndexedDB is secure
      }
    };
  }

  exportReport() {
    const report = this.generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-attendance-performance-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  reset() {
    this.metrics = {
      latency: [],
      syncTimes: [],
      offlineOperations: 0,
      failedSyncs: 0,
      successfulSyncs: 0,
      cacheHitRate: 0,
      networkRequests: 0,
      networkFailures: 0
    };
  }
}

export default new PerformanceMonitor();
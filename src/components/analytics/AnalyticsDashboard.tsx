import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  BarChart3,
  Calendar,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  totalRevenue: number;
  totalJobs: number;
  averageJobValue: number;
  completionRate: number;
  revenueGrowth: number;
  topPerformingCrew: string;
  averageJobDuration: number;
  recurringCustomers: number;
}

interface RevenueByPeriod {
  period: string;
  revenue: number;
  jobs: number;
}

export const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueByPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    fetchAnalytics();
    fetchRevenueByPeriod();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Calculate date range based on selection
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      // Fetch jobs data
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          status,
          suggested_price,
          actual_price,
          created_at,
          customer_id,
          visits (
            duration_minutes
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (jobsError) throw jobsError;

      // Calculate analytics
      const completedJobs = jobs?.filter(job => job.status === 'completed') || [];
      const totalRevenue = completedJobs.reduce((sum, job) => 
        sum + (job.actual_price || job.suggested_price || 0), 0
      );
      
      const totalJobs = jobs?.length || 0;
      const averageJobValue = totalJobs > 0 ? totalRevenue / completedJobs.length : 0;
      const completionRate = totalJobs > 0 ? (completedJobs.length / totalJobs) * 100 : 0;

      // Calculate average job duration
      const jobsWithDuration = completedJobs.filter(job => 
        job.visits && job.visits.length > 0 && job.visits[0].duration_minutes
      );
      const averageJobDuration = jobsWithDuration.length > 0
        ? jobsWithDuration.reduce((sum, job) => sum + (job.visits[0].duration_minutes || 0), 0) / jobsWithDuration.length
        : 0;

      // Count unique customers (recurring indicator)
      const uniqueCustomers = new Set(jobs?.map(job => job.customer_id) || []).size;

      setAnalytics({
        totalRevenue,
        totalJobs,
        averageJobValue,
        completionRate,
        revenueGrowth: 12.5, // Placeholder - would need historical comparison
        topPerformingCrew: "Crew Alpha", // Placeholder - would need crew performance data
        averageJobDuration: Math.round(averageJobDuration),
        recurringCustomers: uniqueCustomers
      });
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRevenueByPeriod = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 6); // Last 6 months

      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('actual_price, suggested_price, created_at, status')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Group by month
      const monthlyData: { [key: string]: { revenue: number; jobs: number } } = {};
      
      jobs?.forEach(job => {
        const date = new Date(job.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, jobs: 0 };
        }
        
        monthlyData[monthKey].revenue += job.actual_price || job.suggested_price || 0;
        monthlyData[monthKey].jobs += 1;
      });

      const formattedData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, data]) => ({
          period: new Date(period + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          ...data
        }));

      setRevenueData(formattedData);
    } catch (error: any) {
      console.error("Error fetching revenue data:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'quarter'] as const).map((range) => (
          <Badge
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            className="cursor-pointer capitalize"
            onClick={() => setTimeRange(range)}
          >
            {range}
          </Badge>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">+{analytics.revenueGrowth}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalJobs}</p>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.completionRate.toFixed(1)}% completion rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <BarChart3 className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(analytics.averageJobValue)}</p>
                <p className="text-sm text-muted-foreground">Avg Job Value</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.averageJobDuration}min avg duration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.recurringCustomers}</p>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Top crew: {analytics.topPerformingCrew}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <div className="space-y-4">
              {revenueData.map((item, index) => {
                const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
                const percentage = (item.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium">{item.period}</div>
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <div className="font-semibold">{formatCurrency(item.revenue)}</div>
                      <div className="text-xs text-muted-foreground">{item.jobs} jobs</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No revenue data available</p>
              <p className="text-muted-foreground">Complete some jobs to see revenue trends</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
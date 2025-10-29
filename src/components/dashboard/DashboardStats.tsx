import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users, MapPin, DollarSign, TrendingUp } from "lucide-react";

interface Job {
  id: string;
  status: string;
  suggested_price: number | null;
  actual_price: number | null;
}

interface DashboardStatsProps {
  jobs: Job[];
}

export const DashboardStats = ({ jobs }: DashboardStatsProps) => {
  const scheduledJobs = jobs.filter(j => j.status === 'scheduled').length;
  const inProgressJobs = jobs.filter(j => j.status === 'in_progress').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  
  const totalRevenue = jobs
    .filter(j => j.status === 'completed')
    .reduce((sum, job) => sum + (job.actual_price || job.suggested_price || 0), 0);
    
  const pendingRevenue = jobs
    .filter(j => j.status !== 'completed' && j.status !== 'cancelled')
    .reduce((sum, job) => sum + (job.suggested_price || 0), 0);

  const stats = [
    {
      title: "Scheduled",
      value: scheduledJobs,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "In Progress",
      value: inProgressJobs,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Completed",
      value: completedJobs,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total Jobs",
      value: jobs.length,
      icon: MapPin,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Revenue",
      value: `$${totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Pending",
      value: `$${pendingRevenue.toFixed(0)}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground truncate">{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
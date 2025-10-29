import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckInOut } from "./CheckInOut";
import { Camera, MapPin, Clock, Users } from "lucide-react";

interface Job {
  id: string;
  title: string;
  address: string;
  estimated_duration: number | null;
  scheduled_date: string | null;
  customer_name?: string;
}

interface CrewInfo {
  id: string;
  name: string;
  status: string;
}

interface CrewDashboardProps {
  username: string;
}

export const CrewDashboard = ({ username }: CrewDashboardProps) => {
  const [crew, setCrew] = useState<CrewInfo | null>(null);
  const [todayJobs, setTodayJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock crew data
    const mockCrew: CrewInfo = {
      id: '1',
      name: `${username}'s Crew`,
      status: 'available'
    };

    // Mock today's jobs
    const mockJobs: Job[] = [
      {
        id: '1',
        title: 'Lawn Mowing - Smith Residence',
        address: '123 Main St',
        estimated_duration: 60,
        scheduled_date: new Date().toISOString().split('T')[0],
        customer_name: 'John Smith'
      },
      {
        id: '2',
        title: 'Garden Cleanup - Johnson House',
        address: '456 Oak Ave',
        estimated_duration: 120,
        scheduled_date: new Date().toISOString().split('T')[0],
        customer_name: 'Sarah Johnson'
      }
    ];

    setCrew(mockCrew);
    setTodayJobs(mockJobs);
    setIsLoading(false);
  }, [username]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success text-success-foreground';
      case 'on_job': return 'bg-warning text-warning-foreground';
      case 'off_duty': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-success/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading crew dashboard...</p>
        </div>
      </div>
    );
  }

  if (!crew) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-success/5">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Not Assigned to Crew</h2>
            <p className="text-muted-foreground">
              Contact your manager to be assigned to a crew before you can start checking in to jobs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {crew.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">Crew Member Dashboard</p>
              </div>
              <Badge className={getStatusColor(crew.status)}>
                {crew.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayJobs.length}</p>
                  <p className="text-sm text-muted-foreground">Jobs Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Clock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {todayJobs.reduce((sum, job) => sum + (job.estimated_duration || 0), 0)}m
                  </p>
                  <p className="text-sm text-muted-foreground">Est. Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Camera className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Photos Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check In/Out System */}
        <CheckInOut crewId={crew.id} jobs={todayJobs} />
      </div>
    </div>
  );
};
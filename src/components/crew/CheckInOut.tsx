import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Camera, CheckCircle, XCircle, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  title: string;
  address: string;
  customer_name?: string;
  estimated_duration: number | null;
}

interface CheckInOutProps {
  crewId: string;
  jobs: Job[];
}

interface ActiveVisit {
  id: string;
  job_id: string;
  check_in_time: string;
  job: Job;
}

export const CheckInOut = ({ crewId, jobs }: CheckInOutProps) => {
  const [activeVisit, setActiveVisit] = useState<ActiveVisit | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setLocationError("Unable to get location. Please enable location services.");
          console.error("Location error:", error);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  // Load active visit from localStorage
  useEffect(() => {
    const savedVisit = localStorage.getItem(`activeVisit_${crewId}`);
    if (savedVisit) {
      try {
        setActiveVisit(JSON.parse(savedVisit));
      } catch (error) {
        console.error('Error loading active visit:', error);
      }
    }
  }, [crewId]);

  const handleCheckIn = (job: Job) => {
    if (!location) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please enable location services to check in.",
      });
      return;
    }

    const visit: ActiveVisit = {
      id: `visit_${Date.now()}`,
      job_id: job.id,
      check_in_time: new Date().toISOString(),
      job
    };

    setActiveVisit(visit);
    localStorage.setItem(`activeVisit_${crewId}`, JSON.stringify(visit));

    toast({
      title: "Checked In Successfully",
      description: `You've checked in to ${job.title}`,
    });
  };

  const handleCheckOut = () => {
    if (!activeVisit) return;

    // Calculate duration
    const checkInTime = new Date(activeVisit.check_in_time);
    const checkOutTime = new Date();
    const durationMs = checkOutTime.getTime() - checkInTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    // Clear active visit
    setActiveVisit(null);
    localStorage.removeItem(`activeVisit_${crewId}`);

    toast({
      title: "Checked Out Successfully",
      description: `Job completed in ${durationMinutes} minutes`,
    });
  };

  const getJobStatusBadge = (job: Job) => {
    if (activeVisit?.job_id === job.id) {
      return <Badge className="bg-success text-success-foreground">In Progress</Badge>;
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locationError ? (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">{locationError}</span>
            </div>
          ) : location ? (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Location services enabled</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4 animate-spin" />
              <span className="text-sm">Getting location...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Visit */}
      {activeVisit && (
        <Card className="border-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <Clock className="h-5 w-5" />
              Currently Working
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">{activeVisit.job.title}</h3>
              <p className="text-sm text-muted-foreground">{activeVisit.job.address}</p>
              <p className="text-sm text-muted-foreground">Customer: {activeVisit.job.customer_name}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Duration: </span>
                <span className="text-success font-mono">
                  {formatDuration(activeVisit.check_in_time)}
                </span>
              </div>
              <Button 
                onClick={handleCheckOut}
                className="bg-success hover:bg-success/90"
              >
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No jobs scheduled for today
            </p>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{job.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Customer: {job.customer_name}
                      </p>
                      {job.estimated_duration && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Est. {job.estimated_duration}min
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getJobStatusBadge(job)}
                      {!activeVisit && (
                        <Button
                          onClick={() => handleCheckIn(job)}
                          size="sm"
                          disabled={isLoading || !location}
                        >
                          Check In
                        </Button>
                      )}
                      {activeVisit?.job_id !== job.id && activeVisit && (
                        <Button size="sm" variant="outline" disabled>
                          Complete Current Job First
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
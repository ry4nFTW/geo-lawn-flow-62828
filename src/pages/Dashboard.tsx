import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { JobsList } from "@/components/dashboard/JobsList";
import { CrewDashboard } from "@/components/crew/CrewDashboard";
import { CustomerPortal } from "@/components/customer/CustomerPortal";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  address: string;
  estimated_duration: number | null;
  suggested_price: number | null;
  actual_price: number | null;
  status: string;
  scheduled_date: string | null;
  auto_populated_confidence: number;
  customer_name?: string;
}

const Dashboard = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for username in localStorage
    const savedUsername = localStorage.getItem('username');
    const savedRole = localStorage.getItem('role') || 'manager';

    if (!savedUsername) {
      navigate("/auth");
      return;
    }
    
    setUsername(savedUsername);
    
    // Create a mock profile for the user (respect stored role)
    setProfile({
      id: '1',
      user_id: '1',
      display_name: savedUsername,
      avatar_url: null,
      role: savedRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // If the stored role is 'customer', redirect them to the customer portal
    if (savedRole === 'customer') {
      navigate('/customer');
      return;
    }
    
    setIsLoading(false);
  }, [navigate]);

  // Mock jobs data for demo
  useEffect(() => {
    const mockJobs: Job[] = [
      {
        id: '1',
        title: 'Lawn Mowing - Smith Residence',
        description: 'Weekly lawn maintenance',
        address: '123 Main St',
        estimated_duration: 60,
        suggested_price: 50,
        actual_price: null,
        status: 'scheduled',
        scheduled_date: new Date().toISOString().split('T')[0],
        auto_populated_confidence: 85,
        customer_name: 'John Smith'
      },
      {
        id: '2',
        title: 'Garden Cleanup - Johnson House',
        description: 'Fall cleanup and leaf removal',
        address: '456 Oak Ave',
        estimated_duration: 120,
        suggested_price: 100,
        actual_price: null,
        status: 'in_progress',
        scheduled_date: new Date().toISOString().split('T')[0],
        auto_populated_confidence: 75,
        customer_name: 'Sarah Johnson'
      }
    ];
    
    setJobs(mockJobs);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/auth');
  };

  const canEdit = profile?.role === 'manager' || profile?.role === 'accountant';

  // Route to appropriate dashboard based on role
  if (profile && profile.role === 'crew') {
    return <CrewDashboard username={username || 'User'} />;
  }

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <DashboardHeader
        profile={profile}
        userEmail={username}
        onSignOut={handleSignOut}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <DashboardStats jobs={jobs} />
        
        {profile?.role === 'manager' ? (
          <AnalyticsDashboard />
        ) : (
          <JobsList jobs={jobs} canEdit={canEdit} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;

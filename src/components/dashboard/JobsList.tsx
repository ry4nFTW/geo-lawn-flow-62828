import { useState } from "react";
import { JobEditor } from "@/components/job/JobEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobCard } from "./JobCard";

interface Job {
  id: string;
  title: string;
  description: string | null;
  address: string;
  estimated_duration: number | null;
  suggested_price: number | null;
  status: string;
  scheduled_date: string | null;
  auto_populated_confidence: number;
  customer_name?: string;
}

interface JobsListProps {
  jobs: Job[];
  canEdit: boolean;
}

export const JobsList = ({ jobs, canEdit }: JobsListProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [showJobEditor, setShowJobEditor] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // trigger refetch after save
    const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: jobs.length,
    scheduled: jobs.filter(j => j.status === 'scheduled').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    cancelled: jobs.filter(j => j.status === 'cancelled').length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Jobs Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage your landscape jobs
            </p>
          </div>
          {canEdit && (
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                setEditingJobId(null); // ensure new job mode
                setShowJobEditor(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          )}
          
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search jobs, customers, or addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Jobs ({statusCounts.all})
              </SelectItem>
              <SelectItem value="scheduled">
                Scheduled ({statusCounts.scheduled})
              </SelectItem>
              <SelectItem value="in_progress">
                In Progress ({statusCounts.in_progress})
              </SelectItem>
              <SelectItem value="completed">
                Completed ({statusCounts.completed})
              </SelectItem>
              <SelectItem value="cancelled">
                Cancelled ({statusCounts.cancelled})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">
              {searchTerm || statusFilter !== "all" ? "No jobs match your filters" : "No jobs scheduled"}
            </p>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Jobs will appear here when they are created"
              }
            </p>
            {canEdit && !searchTerm && statusFilter === "all" && (
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create First Job
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} canEdit={canEdit} />
            ))}
          </div>
        )}
      </CardContent>
          {showJobEditor && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded shadow-lg w-full max-w-2xl z-60">
                <div className="flex justify-between items-center p-3 border-b">
                  <h4 className="font-semibold">Create New Job</h4>
                  <Button variant="ghost" onClick={() => setShowJobEditor(false)}>
                    Close
                  </Button>
                </div>

                <div className="p-4">
                  <JobEditor
                    jobId={null}
                    onSaved={() => {
                      setShowJobEditor(false);
                      setRefreshKey((prev) => prev + 1); // trigger re-fetch
                    }}
                    onCancel={() => setShowJobEditor(false)}
                  />
                </div>
              </div>
            </div>
          )}
          {showJobEditor && (
            <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
              <div className="bg-white rounded shadow-lg w-full max-w-2xl z-50">
                <div className="flex justify-between items-center p-3 border-b">
                  <h4 className="font-semibold">
                    {editingJobId ? "Edit Job" : "Create New Job"}
                  </h4>
                  <Button variant="ghost" onClick={() => setShowJobEditor(false)}>Close</Button>
                </div>

                {/* 👇 Hook in your JobEditor component here */}
                <JobEditor
                  jobId={editingJobId}
                  customerId={null} // or supply a selected customer if you have one
                  onSaved={() => {
                    setShowJobEditor(false);
                    setEditingJobId(null);
                    setRefreshKey(prev => prev + 1); // ✅ trigger re-fetch
                  }}
                  onCancel={() => {
                    setShowJobEditor(false);
                    setEditingJobId(null);
                  }}
                />
              </div>
            </div>
          )}
    </Card>
  );
};

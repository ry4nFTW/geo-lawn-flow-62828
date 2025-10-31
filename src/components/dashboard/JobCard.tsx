import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign } from "lucide-react";
import JobEditor from "@/components/job/JobEditor";

interface Job {
  id: string;
  title: string;
  description?: string | null;
  address: string;
  estimated_duration?: number | null;
  suggested_price?: number | null;
  actual_price?: number | null;
  status: string;
  scheduled_date?: string | null;
  auto_populated_confidence: number;
  customer_name?: string;
}

export const JobCard = ({ job, onRefresh }: { job: Job; onRefresh?: () => void }) => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="p-4 border rounded shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{job.title}</h3>
            <Badge variant="secondary" className="text-xs">{job.status}</Badge>
            {job.auto_populated_confidence > 0 && (
              <Badge variant="outline" className="text-xs">AI: {job.auto_populated_confidence}%</Badge>
            )}
          </div>
          {job.customer_name && <p className="text-sm text-muted-foreground">{job.customer_name}</p>}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{job.address}</span>
          </div>
          {job.description && <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-sm font-medium">
            <DollarSign className="h-4 w-4 text-green-600 inline" />{" "}
            <span>{job.suggested_price ? `$${job.suggested_price.toFixed(2)}` : "-"}</span>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => setEditing(true)}>Edit</Button>
            {/* Keep any existing actions like view/details here */}
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl z-50">
            <div className="flex justify-between items-center p-3 border-b">
              <h4 className="font-semibold">Edit Job</h4>
              <Button variant="ghost" onClick={() => setEditing(false)}>Close</Button>
            </div>
            <div>
              <JobEditor jobId={job.id} onSaved={() => { setEditing(false); onRefresh?.(); }} onCancel={() => setEditing(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;

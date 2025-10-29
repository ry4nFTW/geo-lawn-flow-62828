import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, DollarSign, Calendar, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface JobCardProps {
  job: Job;
  canEdit: boolean;
}

export const JobCard = ({ job, canEdit }: JobCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'TBD';
    return `$${price.toFixed(2)}`;
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'TBD';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
              <Badge className={`${getStatusColor(job.status)} font-medium`}>
                {job.status.replace('_', ' ')}
              </Badge>
              {job.auto_populated_confidence > 0 && (
                <Badge variant="outline" className="text-xs">
                  AI: {job.auto_populated_confidence}%
                </Badge>
              )}
            </div>
            
            {job.customer_name && (
              <p className="text-sm font-medium text-muted-foreground">
                {job.customer_name}
              </p>
            )}
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{job.address}</span>
            </div>
            
            {job.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {job.description}
              </p>
            )}
          </div>
          
          <div className="flex items-start gap-2">
            <div className="text-right space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>{formatPrice(job.suggested_price)}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(job.estimated_duration)}</span>
              </div>
              {job.scheduled_date && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(job.scheduled_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit Job</DropdownMenuItem>
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Cancel Job</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
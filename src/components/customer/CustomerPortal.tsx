import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  CreditCard, 
  MessageCircle, 
  History, 
  Scissors,
  TreePine,
  Flower,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "./ImageUpload";
import { LawnHeightSelector } from "./LawnHeightSelector";

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  icon: React.ElementType;
}

const serviceOptions: ServiceOption[] = [
  {
    id: 'lawn-cut',
    name: 'Lawn Cutting',
    description: 'Professional grass cutting service',
    basePrice: 45,
    icon: Scissors
  },
  {
    id: 'tree-trim',
    name: 'Tree Trimming',
    description: 'Tree pruning and maintenance',
    basePrice: 85,
    icon: TreePine
  },
  {
    id: 'garden-care',
    name: 'Garden Care',
    description: 'Flower bed maintenance and care',
    basePrice: 65,
    icon: Flower
  }
];

interface CustomerPortalProps {
  customerInfo?: {
    id: string;
    name: string;
    email: string;
    address: string;
  };
}

export const CustomerPortal = ({ customerInfo }: CustomerPortalProps) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [specialNotes, setSpecialNotes] = useState("");
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [customerJobs, setCustomerJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [selectedLawnHeight, setSelectedLawnHeight] = useState<number | null>(3.75);
  const { toast } = useToast();

  useEffect(() => {
    if (customerInfo) {
      fetchCustomerJobs();
    }
  }, [customerInfo]);

  const fetchCustomerJobs = async () => {
    if (!customerInfo) return;
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          status,
          scheduled_date,
          suggested_price,
          actual_price,
          description
        `)
        .eq('customer_id', customerInfo.id)
        .order('scheduled_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCustomerJobs(data || []);
    } catch (error: any) {
      console.error("Error fetching customer jobs:", error);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = serviceOptions.find(s => s.id === serviceId);
      return total + (service?.basePrice || 0);
    }, 0);
  };

  const submitServiceRequest = async () => {
    if (!customerInfo || selectedServices.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select at least one service.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const selectedServiceDetails = selectedServices.map(id => 
        serviceOptions.find(s => s.id === id)
      ).filter(Boolean);

      const jobTitle = selectedServiceDetails.map(s => s!.name).join(", ");
      const totalPrice = calculateTotal();

      // Build description with all details
      let description = `Services: ${jobTitle}`;
      
      if (selectedServices.includes('lawn-cut') && selectedLawnHeight) {
        description += `\n\nLawn Cutting Height: ${selectedLawnHeight}"`;
      }
      
      if (specialNotes) {
        description += `\n\nSpecial Notes: ${specialNotes}`;
      }
      
      if (uploadedImages.length > 0) {
        description += `\n\nAttached Photos: ${uploadedImages.length} image(s)`;
      }

      const { error } = await supabase
        .from('jobs')
        .insert({
          customer_id: customerInfo.id,
          title: jobTitle,
          description,
          address: customerInfo.address,
          suggested_price: totalPrice,
          status: 'scheduled',
          scheduled_date: preferredDate || null,
          auto_populated_confidence: 80 // High confidence for customer-requested services
        });

      if (error) throw error;

      toast({
        title: "Service Requested",
        description: "Your service request has been submitted successfully.",
      });

      // Reset form
      setSelectedServices([]);
      setSpecialNotes("");
      setPreferredDate("");
      setUploadedImages([]);
      setSelectedLawnHeight(null);
      fetchCustomerJobs();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-info text-info-foreground';
      case 'in_progress': return 'bg-warning text-warning-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!customerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-success/5">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Customer Access</h2>
            <p className="text-muted-foreground">
              Please contact us to set up your customer account and access the portal.
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
            <CardTitle>Welcome, {customerInfo.name}</CardTitle>
            <p className="text-muted-foreground">{customerInfo.address}</p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Request */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Request Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Select Services:</h4>
                <div className="space-y-2">
                  {serviceOptions.map((service) => {
                    const Icon = service.icon;
                    const isSelected = selectedServices.includes(service.id);
                    
                    return (
                      <Card 
                        key={service.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => toggleService(service.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div>
                                <p className="font-medium">{service.name}</p>
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                              </div>
                            </div>
                            <p className="font-semibold">${service.basePrice}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Lawn Height Selector - Show when lawn cutting is selected */}
              {selectedServices.includes('lawn-cut') && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <LawnHeightSelector
                    selectedHeight={selectedLawnHeight}
                    onHeightSelect={setSelectedLawnHeight}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Special Notes & Photos:</label>
                <Textarea
                  placeholder="Any special instructions or requirements..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="mt-1 mb-3"
                />
                <ImageUpload
                  uploadedImages={uploadedImages}
                  onImageUpload={setUploadedImages}
                  maxImages={5}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Preferred Date:</label>
                <Input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              {selectedServices.length > 0 && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Estimate:</span>
                    <span className="text-xl font-bold text-primary">${calculateTotal()}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={submitServiceRequest}
                disabled={isLoading || selectedServices.length === 0}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Request Service
              </Button>
            </CardContent>
          </Card>

          {/* Job History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Service History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerJobs.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No service history</p>
                  <p className="text-muted-foreground">Your completed services will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerJobs.map((job) => (
                    <Card key={job.id} className="border-muted">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{job.title}</h4>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {job.description && (
                          <p className="text-sm text-muted-foreground mb-2">{job.description}</p>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'No date set'}
                          </span>
                          <span className="font-medium">
                            ${job.actual_price || job.suggested_price || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <CreditCard className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Make Payment</h3>
              <p className="text-sm text-muted-foreground">Pay for completed services</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">Contact Team</h3>
              <p className="text-sm text-muted-foreground">Chat with your service team</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
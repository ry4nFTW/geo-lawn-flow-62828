import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "./ImageUpload";
import { LawnHeightSelector } from "./LawnHeightSelector";
import CustomerEditor from "@/components/customer/CustomerEditor";
import JobEditor from "@/components/job/JobEditor";

interface CustomerPortalProps {
  customerInfo?: {
    id: string;
    name: string;
    email: string;
    address: string;
  } | null;
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
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (customerInfo) {
      fetchCustomerJobs();
    } else {
      setCustomerJobs([]);
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
        .limit(50);

      if (error) throw error;
      setCustomerJobs(data || []);
    } catch (error: any) {
      console.error("Error fetching customer jobs:", error);
      toast({ title: "Error", description: "Failed to fetch jobs." });
    }
  };

    const handleCreateOrEditJob = async () => {
      // Guard: ensure customer exists
      if (!customerInfo) {
        toast({ title: "Error", description: "No customer selected." });
        return;
      }

      setIsLoading(true);
      try {
        const jobTitle = selectedServices.length
          ? `Service: ${selectedServices.join(", ")}`
          : "Requested Service";

        // 🧮 Calculate total price
        const priceMap: Record<string, number> = {
          "lawn-cut": 45,
          "tree-trim": 85,
          "garden-care": 65,
        };
        const totalPrice = selectedServices.reduce(
          (sum, service) => sum + (priceMap[service] || 0),
          0
        );

        // 🧾 Construct description
        let description = "";
        if (selectedServices.includes("lawn-cut")) {
          description += `Lawn Cutting Height: 3.75"`;
        }
        if (specialNotes) description += `\n\nSpecial Notes: ${specialNotes}`;
        if (uploadedImages.length > 0) {
          description += `\n\nAttached Photos: ${uploadedImages.length} image(s)`;
        }

        // 🧠 Insert job record into Supabase
        const { error } = await supabase
          .from("jobs")
          .insert({
            customer_id: customerInfo.id,
            title: jobTitle,
            description,
            address: customerInfo.address,
            suggested_price: totalPrice,
            status: "scheduled",
            scheduled_date: preferredDate || null,
            auto_populated_confidence: 80,
          })
          .single();

        if (error) throw error;

        toast({
          title: "✅ Service Requested",
          description: "Your service request was submitted successfully.",
        });

        // 🔄 Reset state and refresh jobs
        setSelectedServices([]);
        setSpecialNotes("");
        setUploadedImages([]);
        await fetchCustomerJobs();
      } catch (err: any) {
        console.error("Job creation failed:", err);
        toast({
          title: "Error",
          description: "Unable to submit service request. Try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

  if (!customerInfo) {
    return <Card><CardContent>Please sign in or select a customer.</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle>{customerInfo.name}</CardTitle>
          <div className="text-sm text-muted-foreground">{customerInfo.email}</div>
          <div className="text-sm text-muted-foreground">{customerInfo.address}</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditingCustomer(true)}>Edit Customer</Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* existing form controls (service selectors, notes, uploads) */}
        <div className="space-y-2">
          {/* simplified UI area for brevity; keep existing service UI as-is in the repo */}
          <Button onClick={handleCreateOrEditJob} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Request Service"}
          </Button>
        </div>

        <div className="pt-4">
          <h4 className="font-semibold">Recent Jobs</h4>
          <div className="space-y-2">
            {customerJobs.map((j) => (
              <div key={j.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{j.title}</div>
                  <div className="text-sm text-muted-foreground">{j.scheduled_date ?? "No date"} • {j.status}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditingJobId(j.id)}>Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {editingCustomer && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-xl z-50">
            <div className="flex justify-between items-center p-3 border-b">
              <h4 className="font-semibold">Edit Customer</h4>
              <Button variant="ghost" onClick={() => setEditingCustomer(false)}>Close</Button>
            </div>
            <CustomerEditor customerId={customerInfo.id} onSaved={async () => { setEditingCustomer(false); await fetchCustomerJobs(); }} onCancel={() => setEditingCustomer(false)} />
          </div>
        </div>
      )}

      {editingJobId && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl z-50">
            <div className="flex justify-between items-center p-3 border-b">
              <h4 className="font-semibold">Edit Job</h4>
              <Button variant="ghost" onClick={() => setEditingJobId(null)}>Close</Button>
            </div>
            <JobEditor jobId={editingJobId} onSaved={async () => { setEditingJobId(null); await fetchCustomerJobs(); }} onCancel={() => setEditingJobId(null)} />
          </div>
        </div>
      )}
    </Card>
  );
};

export default CustomerPortal;

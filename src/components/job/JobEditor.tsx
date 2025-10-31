import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  jobId?: string | null; // if present -> edit mode
  customerId?: string | null; // used when creating a new job
  onSaved?: () => void;
  onCancel?: () => void;
}

export const JobEditor = ({ jobId, customerId, onSaved, onCancel }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<"scheduled"|"in_progress"|"completed"|"cancelled">("scheduled");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("title,description,address,scheduled_date,suggested_price,status")
        .eq("id", jobId)
        .single();
      if (error) {
        console.error("Failed loading job", error);
        toast({ title: "Error", description: "Failed to load job for editing." });
        return;
      }
      if (data) {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setAddress(data.address || "");
        setScheduledDate(data.scheduled_date ?? null);
        setSuggestedPrice(data.suggested_price ?? null);
        setStatus((data.status as any) ?? "scheduled");
      }
    })();
  }, [jobId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (jobId) {
        const { error } = await supabase
          .from("jobs")
          .update({
            title,
            description,
            address,
            scheduled_date: scheduledDate || null,
            suggested_price: suggestedPrice,
            status
          })
          .eq("id", jobId);
        if (error) throw error;
        toast({ title: "Updated", description: "Job updated successfully." });
      } else {
        if (!customerId) {
          toast({ title: "Error", description: "No customer specified for new job." });
          setIsSaving(false);
          return;
        }
        const { error } = await supabase.from("jobs").insert({
          customer_id: customerId,
          title,
          description,
          address,
          scheduled_date: scheduledDate || null,
          suggested_price: suggestedPrice,
          status: "scheduled",
          auto_populated_confidence: 0
        });
        if (error) throw error;
        toast({ title: "Created", description: "Job created successfully." });
      }
      onSaved?.();
    } catch (err) {
      console.error("Save job error", err);
      toast({ title: "Error", description: "Failed to save job." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2 p-4">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job title" />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
      <div className="flex gap-2">
        <Input type="date" value={scheduledDate ?? ""} onChange={(e) => setScheduledDate(e.target.value || null)} />
        <Input type="number" step="0.01" value={suggestedPrice ?? ""} onChange={(e) => setSuggestedPrice(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Price" />
      </div>
      <div className="flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="p-2 rounded border">
          <option value="scheduled">scheduled</option>
          <option value="in_progress">in_progress</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} disabled={isSaving}>{jobId ? "Update Job" : "Create Job"}</Button>
        <Button variant="ghost" onClick={() => onCancel?.()}>Cancel</Button>
      </div>
    </div>
  );
};

export default JobEditor;

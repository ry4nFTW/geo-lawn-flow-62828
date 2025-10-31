import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  customerId?: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
}

export const CustomerEditor = ({ customerId, onSaved, onCancel }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

    useEffect(() => {
      if (!customerId) {
        // Clear stale data if customer changes or closes modal
        setName("");
        setEmail(null);
        setPhone(null);
        setAddress("");
        return;
      }

      (async () => {
        const { data, error } = await supabase
          .from("customers")
          .select("name,email,phone,address")
          .eq("id", customerId)
          .single();

        if (error) {
          console.error("Failed loading customer", error);
          toast({ title: "Error", description: "Failed to load customer." });
          return;
        }

        if (data) {
          setName(data.name || "");
          setEmail(data.email ?? null);
          setPhone(data.phone ?? null);
          setAddress(data.address || "");
        }
      })();
  }, [customerId]);

    const handleSave = async () => {
      if (!customerId) {
        toast({ title: "Error", description: "No customer specified." });
        return;
          setName(""); setEmail(null); setPhone(null); setAddress("");
      }

      if (!name.trim() || !email) {
        toast({ title: "Error", description: "Name and email are required." });
        return;
      }

      setIsSaving(true);
      try {
        const { error } = await supabase
          .from("customers")
          .upsert({
            id: customerId,
            name: name.trim(),
            email: email.trim(),
            phone: phone?.trim() || null,
            address: address.trim(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        toast({ title: "✅ Customer Saved", description: "Customer info updated successfully." });
        onSaved?.(); // trigger reload in parent
      } catch (err) {
        console.error("Save customer error", err);
        toast({ title: "Error", description: "Failed to update customer." });
      } finally {
        setIsSaving(false);
      }
    };


  return (
    <div className="space-y-2 p-4">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <Input value={email ?? ""} onChange={(e) => setEmail(e.target.value || null)} placeholder="Email" />
      <Input value={phone ?? ""} onChange={(e) => setPhone(e.target.value || null)} placeholder="Phone" />
      <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
      <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Customer"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setName("");
              setEmail(null);
              setPhone(null);
              setAddress("");
              onCancel?.();
            }}
          >
            Cancel
          </Button>
      </div>
    </div>
  );
};

export default CustomerEditor;

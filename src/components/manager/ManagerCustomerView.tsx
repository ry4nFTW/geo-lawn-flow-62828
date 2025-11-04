// src/components/manager/ManagerCustomerView.tsx
// src/components/manager/ManagerCustomerView.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Type aliases for tables
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type JobRow = Database["public"]["Tables"]["jobs"]["Row"];

// Extend customer type to include jobs
interface CustomerWithJobs extends CustomerRow {
  jobs: JobRow[];
}

const ManagerCustomerView: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerWithJobs[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "in_progress" | "completed" | "cancelled">("all");
  const [loading, setLoading] = useState(true);

  // State for add/edit modal
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithJobs | null>(null);
  const [showCustomerEditor, setShowCustomerEditor] = useState(false);

  // Fetch customers with jobs
  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select(`
        id,
        name,
        email,
        phone,
        address,
        jobs (
          id,
          title,
          status,
          scheduled_date
        )
      `);

    if (error) console.error("Error fetching customers:", error);
    else setCustomers(data as CustomerWithJobs[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers by search & job status
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const hasJobsMatchingFilter =
      statusFilter === "all" ||
      cust.jobs.some((job) => job.status === statusFilter);
    return matchesSearch && hasJobsMatchingFilter;
  });

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading customer data...</div>;
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Customer Management
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage customers and their jobs.
          </p>
        </div>

        {/* Add Customer Button */}
        <Button
          onClick={() => {
            setEditingCustomer(null);
            setShowCustomerEditor(true);
          }}
        >
          Add Customer
        </Button>
      </CardHeader>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 py-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by job status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customer List */}
      <CardContent>
        {filteredCustomers.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No customers found matching your filters.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCustomers.map((cust) => (
              <Card key={cust.id} className="p-4">
                {/* Customer Info */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{cust.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cust.email} • {cust.phone} • {cust.address}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary">{cust.jobs.length} Jobs</Badge>
                    <Button size="sm" variant="outline" onClick={() => { setEditingCustomer(cust); setShowCustomerEditor(true); }}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        if (!confirm("Are you sure you want to delete this customer?")) return;
                        const { error } = await supabase.from("customers").delete().eq("id", cust.id);
                        if (!error) setCustomers(prev => prev.filter(c => c.id !== cust.id));
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Jobs List */}
                <div className="space-y-3 mt-2">
                  {cust.jobs.map((job) => (
                    <div key={job.id} className="flex justify-between items-center border rounded p-3">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Status: {job.status} | Scheduled: {job.scheduled_date || "N/A"}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        View Job
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Customer Modal */}
      {showCustomerEditor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-lg w-full max-w-md z-60">
            <div className="flex justify-between items-center p-3 border-b">
              <h4 className="font-semibold">
                {editingCustomer?.id ? "Edit Customer" : "Add Customer"}
              </h4>
              <Button variant="ghost" onClick={() => setShowCustomerEditor(false)}>Close</Button>
            </div>

            <div className="p-4 space-y-4">
              <Input
                placeholder="Name"
                value={editingCustomer?.name || ""}
                onChange={(e) =>
                  setEditingCustomer((prev) =>
                    prev ? { ...prev, name: e.target.value } : { name: e.target.value } as CustomerWithJobs
                  )
                }
              />
              <Input
                placeholder="Email"
                value={editingCustomer?.email || ""}
                onChange={(e) =>
                  setEditingCustomer((prev) =>
                    prev ? { ...prev, email: e.target.value } : { email: e.target.value } as CustomerWithJobs
                  )
                }
              />
              <Input
                placeholder="Phone"
                value={editingCustomer?.phone || ""}
                onChange={(e) =>
                  setEditingCustomer((prev) =>
                    prev ? { ...prev, phone: e.target.value } : { phone: e.target.value } as CustomerWithJobs
                  )
                }
              />
              <Input
                placeholder="Address"
                value={editingCustomer?.address || ""}
                onChange={(e) =>
                  setEditingCustomer((prev) =>
                    prev ? { ...prev, address: e.target.value } : { address: e.target.value } as CustomerWithJobs
                  )
                }
              />

              <Button
                className="w-full"
                onClick={async () => {
                  if (!editingCustomer) return;

                  const { data, error } = await supabase
                    .from("customers")
                    .upsert({
                      id: editingCustomer.id, // undefined for new customer
                      name: editingCustomer.name,
                      email: editingCustomer.email,
                      phone: editingCustomer.phone,
                      address: editingCustomer.address,
                    })
                    .select();

                  if (error) console.error("Error saving customer:", error);
                  else {
                    // Refresh customers list
                    await fetchCustomers();
                    setShowCustomerEditor(false);
                    setEditingCustomer(null);
                  }
                }}
              >
                {editingCustomer?.id ? "Save Changes" : "Add Customer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ManagerCustomerView;

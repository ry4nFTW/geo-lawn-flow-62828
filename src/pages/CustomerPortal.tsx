import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CustomerPortal } from "@/components/customer/CustomerPortal";
import { useToast } from "@/hooks/use-toast";

const CustomerPortalPage = () => {
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // For demo purposes, we'll use a mock customer
    // In a real app, this would be based on authentication or a customer portal link
    const mockCustomer = {
      id: "demo-customer-id",
      name: "John Smith",
      email: "john.smith@example.com",
      address: "123 Maple Street, Springfield, IL 62701"
    };

    setCustomerInfo(mockCustomer);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-success/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading customer portal...</p>
        </div>
      </div>
    );
  }

  return <CustomerPortal customerInfo={customerInfo} />;
};

export default CustomerPortalPage;
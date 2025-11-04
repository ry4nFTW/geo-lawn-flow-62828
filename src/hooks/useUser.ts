// src/hooks/useUser.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
interface AppUser {
  id: string;
  email: string;
  role: "manager" | "employee" | "customer" | "unknown";
}
export const useUser = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      // Check current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // You can fetch user role from your "profiles" or "users" table
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || "",
          role: data?.role || "unknown",
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    fetchUser();

    // Listen for auth changes (sign in / sign out)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
};


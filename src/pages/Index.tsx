import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ArrowRight } from "lucide-react";
import type { User } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If a Supabase user is already signed in, route based on stored role (if present)
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const savedRole = localStorage.getItem('role');
        if (savedRole === "customer") navigate("/customer");
        else navigate("/dashboard");
      }
    };
    checkUser();

    // Listen for auth changes and respect stored role
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const savedRole = localStorage.getItem('role');
        if (savedRole === "customer") navigate("/customer");
        else navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const goToCustomerPortal = () => {
    // user chose: "I need service"
    localStorage.setItem("role", "customer");
    navigate("/customer");
  };

  const goToManagerFlow = () => {
    // user chose: "I'm running a service"
    // set role to manager and send to the sign-in page (or dashboard if you prefer)
    localStorage.setItem("role", "manager");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-8 rounded-full bg-primary/10">
            <MapPin className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Landscape Job
            <span className="text-primary"> Organizer</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Two simple choices: request a service, or run the service. Pick one to continue.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="text-left p-6">
              <CardHeader>
                <CardTitle className="text-xl">Do you need service?</CardTitle>
                <CardDescription>Customers: request lawn care, attach photos, and choose a date.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Use the customer portal to request services without signing up for the management interface.
                </p>
                <div className="flex justify-end">
                  <Button onClick={goToCustomerPortal} size="lg">Go to Customer Portal</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="text-left p-6">
              <CardHeader>
                <CardTitle className="text-xl">Are you running a service?</CardTitle>
                <CardDescription>Managers: sign in to access the dispatch dashboard and schedule jobs.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  If you're managing the work (dispatch, scheduling, crew check-ins), sign in to continue.
                </p>
                <div className="flex justify-end">
                  <Button onClick={goToManagerFlow} size="lg" variant="outline">Manager Sign In</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            {!user ? (
              <Button asChild size="md" className="text-lg px-6">
                <Link to="/auth">
                  Quick Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

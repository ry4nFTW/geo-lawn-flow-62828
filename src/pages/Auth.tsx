import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";

const Auth = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // If a username is already saved locally, route to the saved role destination
    const savedUsername = localStorage.getItem('username');
    const savedRole = localStorage.getItem('role');
    if (savedUsername) {
      if (savedRole === "customer") navigate("/customer");
      else navigate("/dashboard");
    }
  }, [navigate]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a username",
      });
      return;
    }

    // Persist username locally (demo flow). Role should have been set by the landing page.
    localStorage.setItem('username', username.trim());
    const role = localStorage.getItem('role') || 'manager';

    toast({
      title: "Welcome!",
      description: `Signed in as ${username.trim()} (${role})`,
    });

    // Navigate to manager dashboard after signing in
    if (role === "customer") navigate("/customer");
    else navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Sign In</h1>
          <p className="text-muted-foreground mt-2">Enter a username to continue to the management dashboard.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Provide a display name for the demo session</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name or email" />
              </div>

              <div className="flex justify-end">
                <Button type="submit">Continue</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;

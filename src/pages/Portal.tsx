import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Smartphone } from "lucide-react";

const Portal = () => {
  const navigate = useNavigate();

  const goToCustomerPortal = () => {
    navigate("/customer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Lawn Service Portal</CardTitle>
          <p className="text-muted-foreground">
            Request lawn care services online
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={goToCustomerPortal}
            className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Start Service Request
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Quick access for our customers</p>
            <p className="font-mono text-xs mt-2 p-2 bg-muted rounded">
              Easy link: yoursite.com/portal
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portal;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AccessDenied() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border/50 text-center">
        <CardHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Access Denied</CardTitle>
          <CardDescription className="text-muted-foreground">
            You do not have permission to access this page.
            <br />
            Contact your administrator to request elevated access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => navigate("/")} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

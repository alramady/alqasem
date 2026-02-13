import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Lock, User, Shield, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to change password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }
    changePassword.mutate({ currentPassword, newPassword });
  };

  const roleLabel = user?.role === "admin" ? "Administrator" : user?.role === "user" ? "Analyst" : "Viewer";
  const roleBadgeVariant = user?.role === "admin" ? "default" : user?.role === "user" ? "secondary" : "outline";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and security preferences</p>
      </div>

      {/* Profile Info Card */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Profile Information</CardTitle>
          </div>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <p className="text-sm font-medium mt-1">{user?.displayName || user?.name || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Username</Label>
              <p className="text-sm font-medium mt-1">{user?.username || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm font-medium mt-1">{user?.email || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <div className="mt-1">
                <Badge variant={roleBadgeVariant as any} className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Change Password</CardTitle>
          </div>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="bg-background/50 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  className="bg-background/50 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-destructive">Password must be at least 8 characters</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-background/50"
                required
              />
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
              className="w-full"
            >
              {changePassword.isPending ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Settings, Play, Square, Globe, Shield, Database, Server, CheckCircle2, AlertTriangle,
  Loader2, Users, UserCog, History, Activity, UserX, UserCheck, UserPlus, KeyRound, Eye, EyeOff,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPanel() {
  const { data: summary, isLoading: summaryLoading } = trpc.dashboard.summary.useQuery();
  const { data: neighborhoods } = trpc.neighborhoods.list.useQuery();
  const { data: otaSources } = trpc.otaSources.list.useQuery();
  const { data: scrapeJobs } = trpc.scrapeJobs.list.useQuery({ limit: 10 });
  const { data: schedulerStatus } = trpc.scheduler.status.useQuery();
  const { data: usersList, refetch: refetchUsers } = trpc.admin.users.list.useQuery();
  const { data: auditLogs, refetch: refetchAudit } = trpc.admin.auditLog.useQuery({ limit: 50 });

  const [selectedOtas, setSelectedOtas] = useState<string[]>([]);
  const [scheduleFreq, setScheduleFreq] = useState<"daily" | "weekly" | "biweekly" | "monthly">("weekly");

  // Create user form state
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", name: "", displayName: "", email: "", mobile: "", role: "viewer" as "viewer" | "user" | "admin" });
  const [showNewPw, setShowNewPw] = useState(false);

  // Reset password form state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: number; name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);

  const triggerMutation = trpc.scrapeJobs.trigger.useMutation({
    onSuccess: () => { toast.success("Scrape job started"); refetchAudit(); },
    onError: (e) => toast.error(e.message),
  });
  const startSchedulerMutation = trpc.scheduler.start.useMutation({
    onSuccess: () => { toast.success("Scheduler started"); refetchAudit(); },
    onError: (e) => toast.error(e.message),
  });
  const stopSchedulerMutation = trpc.scheduler.stop.useMutation({
    onSuccess: () => { toast.success("Scheduler stopped"); refetchAudit(); },
    onError: (e) => toast.error(e.message),
  });
  const updateRoleMutation = trpc.admin.users.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); refetchUsers(); refetchAudit(); },
    onError: (e) => toast.error(e.message),
  });
  const deactivateMutation = trpc.admin.users.deactivate.useMutation({
    onSuccess: () => { toast.success("User deactivated"); refetchUsers(); refetchAudit(); },
    onError: (e) => toast.error(e.message),
  });
  const activateMutation = trpc.admin.users.activate.useMutation({
    onSuccess: () => { toast.success("User activated"); refetchUsers(); refetchAudit(); },
    onError: (e) => toast.error(e.message),
  });
  const createUserMutation = trpc.admin.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      refetchUsers();
      refetchAudit();
      setCreateOpen(false);
      setNewUser({ username: "", password: "", name: "", displayName: "", email: "", mobile: "", role: "viewer" });
    },
    onError: (e) => toast.error(e.message),
  });
  const resetPasswordMutation = trpc.admin.users.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password reset successfully");
      refetchAudit();
      setResetOpen(false);
      setResetTarget(null);
      setResetPassword("");
    },
    onError: (e) => toast.error(e.message),
  });

  if (summaryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">CoBNB Market Intelligence — System Administration</p>
      </div>

      <Tabs defaultValue="scraping" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="scraping" className="gap-2"><Activity className="h-3.5 w-3.5" />Scraping</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
          <TabsTrigger value="sources" className="gap-2"><Globe className="h-3.5 w-3.5" />OTA Sources</TabsTrigger>
          <TabsTrigger value="quality" className="gap-2"><Database className="h-3.5 w-3.5" />Data Quality</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><History className="h-3.5 w-3.5" />Audit Log</TabsTrigger>
          <TabsTrigger value="config" className="gap-2"><Settings className="h-3.5 w-3.5" />Config</TabsTrigger>
        </TabsList>

        {/* ─── Scraping Tab ─── */}
        <TabsContent value="scraping" className="space-y-4">
          <h2 className="text-lg font-semibold">Scraping & Scheduling</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/80 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Manual Scrape Trigger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Select OTA Platforms</Label>
                  <div className="flex flex-wrap gap-2">
                    {["airbnb", "gathern", "booking", "agoda"].map(ota => (
                      <Badge
                        key={ota}
                        variant={selectedOtas.includes(ota) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => setSelectedOtas(prev =>
                          prev.includes(ota) ? prev.filter(o => o !== ota) : [...prev, ota]
                        )}
                      >
                        {ota}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => triggerMutation.mutate({
                    otaSlugs: selectedOtas.length > 0 ? selectedOtas : undefined,
                    jobType: "full_scan",
                  })}
                  disabled={triggerMutation.isPending}
                  className="gap-2 w-full"
                >
                  {triggerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Start Scrape
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/80 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scheduler Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Refresh Frequency</Label>
                  <Select value={scheduleFreq} onValueChange={(v: any) => setScheduleFreq(v)}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily (2:00 AM AST)</SelectItem>
                      <SelectItem value="weekly">Weekly (Monday 2:00 AM AST)</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly (1st & 15th, 2:00 AM AST)</SelectItem>
                      <SelectItem value="monthly">Monthly (1st, 2:00 AM AST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => startSchedulerMutation.mutate({ frequency: scheduleFreq })}
                    disabled={startSchedulerMutation.isPending}
                    className="gap-2"
                  >
                    {startSchedulerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {schedulerStatus?.isRunning ? "Update Schedule" : "Start Scheduler"}
                  </Button>
                  {schedulerStatus?.isRunning && (
                    <Button
                      variant="outline"
                      onClick={() => stopSchedulerMutation.mutate()}
                      disabled={stopSchedulerMutation.isPending}
                      className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      {stopSchedulerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                      Stop
                    </Button>
                  )}
                </div>
                {schedulerStatus?.isRunning && (
                  <Badge variant="outline" className="text-xs gap-1 text-emerald-400 border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" /> Running — {schedulerStatus.frequency}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Scrape Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Listings</TableHead>
                    <TableHead className="text-muted-foreground text-right">Errors</TableHead>
                    <TableHead className="text-muted-foreground">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scrapeJobs?.map(job => (
                    <TableRow key={job.id} className="border-border/30">
                      <TableCell className="font-mono text-xs">#{job.id}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{job.jobType?.replace("_", " ")}</Badge></TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${
                          job.status === "completed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                          job.status === "running" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                          job.status === "failed" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }`}>{job.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{job.listingsFound || 0}</TableCell>
                      <TableCell className="text-right">{job.errors || 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{job.createdAt ? new Date(job.createdAt).toLocaleString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {(!scrapeJobs || scrapeJobs.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No scrape jobs yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Users Tab ─── */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">User Management</h2>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new user to the CoBNB Market Intelligence platform.</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  createUserMutation.mutate(newUser);
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cu-username">Username *</Label>
                      <Input id="cu-username" placeholder="john.doe" value={newUser.username}
                        onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cu-password">Password *</Label>
                      <div className="relative">
                        <Input id="cu-password" type={showNewPw ? "text" : "password"} placeholder="Min 8 characters"
                          value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                          required minLength={8} className="pr-10" />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                          {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cu-name">Full Name *</Label>
                      <Input id="cu-name" placeholder="John Doe" value={newUser.name}
                        onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cu-display">Display Name</Label>
                      <Input id="cu-display" placeholder="John" value={newUser.displayName}
                        onChange={e => setNewUser(p => ({ ...p, displayName: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cu-email">Email</Label>
                      <Input id="cu-email" type="email" placeholder="john@cobnb.sa" value={newUser.email}
                        onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cu-mobile">Mobile</Label>
                      <Input id="cu-mobile" placeholder="+966 5XX XXX XXXX" value={newUser.mobile}
                        onChange={e => setNewUser(p => ({ ...p, mobile: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cu-role">Role</Label>
                    <Select value={newUser.role} onValueChange={(v: any) => setNewUser(p => ({ ...p, role: v }))}>
                      <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer — Read-only access</SelectItem>
                        <SelectItem value="user">User — Read + Export access</SelectItem>
                        <SelectItem value="admin">Admin — Full access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createUserMutation.isPending} className="gap-2">
                      {createUserMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Create User
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-card/80 border-border/50">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">Username</TableHead>
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Last Sign-in</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList?.map(u => (
                    <TableRow key={u.id} className="border-border/30">
                      <TableCell className="font-mono text-sm">{(u as any).username || "—"}</TableCell>
                      <TableCell className="font-medium">{(u as any).displayName || u.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(newRole: "viewer" | "user" | "admin") => {
                            updateRoleMutation.mutate({ userId: u.id, role: newRole });
                          }}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {u.isActive ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs gap-1">
                            <UserCheck className="h-3 w-3" /> Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs gap-1">
                            <UserX className="h-3 w-3" /> Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setResetTarget({ id: u.id, name: (u as any).displayName || u.name || (u as any).username || "User" });
                              setResetPassword("");
                              setResetOpen(true);
                            }}
                          >
                            <KeyRound className="h-3 w-3" /> Reset PW
                          </Button>
                          {u.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                              onClick={() => deactivateMutation.mutate({ userId: u.id })}
                              disabled={deactivateMutation.isPending}
                            >
                              <UserX className="h-3 w-3 mr-1" /> Deactivate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => activateMutation.mutate({ userId: u.id })}
                              disabled={activateMutation.isPending}
                            >
                              <UserCheck className="h-3 w-3 mr-1" /> Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!usersList || usersList.length === 0) && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Reset Password Dialog */}
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>Set a new password for <strong>{resetTarget?.name}</strong>.</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (resetTarget) {
                  resetPasswordMutation.mutate({ userId: resetTarget.id, newPassword: resetPassword });
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rp-password">New Password</Label>
                  <div className="relative">
                    <Input id="rp-password" type={showResetPw ? "text" : "password"} placeholder="Min 8 characters"
                      value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                      required minLength={8} className="pr-10" />
                    <button type="button" onClick={() => setShowResetPw(!showResetPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                      {showResetPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={resetPasswordMutation.isPending} className="gap-2">
                    {resetPasswordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Reset Password
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Card className="bg-card/80 border-border/50 border-blue-500/20">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <UserCog className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Role Permissions</h3>
                  <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                    <p><strong className="text-foreground">Viewer:</strong> Read-only access to dashboard, listings, competitors, and seasonal data.</p>
                    <p><strong className="text-foreground">User:</strong> All viewer permissions + CSV/Excel export capabilities.</p>
                    <p><strong className="text-foreground">Admin:</strong> Full access including scrape triggers, scheduler control, user management, and audit logs.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── OTA Sources Tab ─── */}
        <TabsContent value="sources" className="space-y-4">
          <h2 className="text-lg font-semibold">OTA Platform Sources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otaSources?.map(source => (
              <Card key={source.id} className="bg-card/80 border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{source.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{source.baseUrl}</p>
                      <div className="flex gap-2">
                        <Badge variant={source.isActive ? "default" : "secondary"} className="text-xs">
                          {source.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {(source.scraperConfig as any)?.method || 'scraper'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Rate limit: {(source.scraperConfig as any)?.rateLimitPerMin || "—"}/min</p>
                      <p className="mt-1">Added: {source.createdAt ? new Date(source.createdAt).toLocaleDateString() : "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── Data Quality Tab ─── */}
        <TabsContent value="quality" className="space-y-4">
          <h2 className="text-lg font-semibold">Data Quality Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="stat-glow bg-card/80 border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Listings</p>
                    <p className="text-2xl font-bold">{Number(summary?.totalListings || 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="stat-glow bg-card/80 border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Neighborhoods</p>
                    <p className="text-2xl font-bold">{neighborhoods?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="stat-glow bg-card/80 border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Server className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">OTA Sources</p>
                    <p className="text-2xl font-bold">{otaSources?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Neighborhood Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">Neighborhood</TableHead>
                    <TableHead className="text-muted-foreground text-right">Listings</TableHead>
                    <TableHead className="text-muted-foreground text-right">Has Metrics</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neighborhoods?.map(nb => {
                    const nbMetric = summary?.neighborhoodMetrics?.find((m: any) => m.neighborhoodId === nb.id);
                    const hasData = nbMetric && (nbMetric.totalListings ?? 0) > 0;
                    return (
                      <TableRow key={nb.id} className="border-border/30">
                        <TableCell className="font-medium">{nb.name}</TableCell>
                        <TableCell className="text-right">{nbMetric?.totalListings || 0}</TableCell>
                        <TableCell className="text-right">{hasData ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          {hasData ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Good
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" /> Needs Data
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Audit Log Tab ─── */}
        <TabsContent value="audit" className="space-y-4">
          <h2 className="text-lg font-semibold">Audit Log</h2>
          <Card className="bg-card/80 border-border/50">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Action</TableHead>
                    <TableHead className="text-muted-foreground">Target</TableHead>
                    <TableHead className="text-muted-foreground">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs?.map((log: any) => {
                    const logUser = usersList?.find(u => u.id === log.userId);
                    return (
                      <TableRow key={log.id} className="border-border/30">
                        <TableCell className="text-xs text-muted-foreground">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {logUser ? ((logUser as any).displayName || logUser.name || (logUser as any).username) : `ID:${log.userId || "system"}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs capitalize ${
                            log.action?.includes("deactivate") || log.action?.includes("delete") ? "border-red-500/30 text-red-400" :
                            log.action?.includes("create") || log.action?.includes("activate") ? "border-emerald-500/30 text-emerald-400" :
                            log.action?.includes("login") ? "border-blue-500/30 text-blue-400" :
                            ""
                          }`}>
                            {log.action?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{log.target || "—"}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{log.ipAddress || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {(!auditLogs || auditLogs.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No audit log entries yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Config Tab ─── */}
        <TabsContent value="config" className="space-y-4">
          <h2 className="text-lg font-semibold">System Configuration</h2>
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scraping Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Refresh Frequency</span>
                    <span className="font-medium capitalize">{schedulerStatus?.frequency || "Not set"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Rate Limiting</span>
                    <span className="font-medium">2-5 req/sec per OTA</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Proxy Support</span>
                    <Badge variant="outline" className="text-xs">Configured</Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">User-Agent Rotation</span>
                    <Badge variant="outline" className="text-xs">Enabled (6 agents)</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Target Market</span>
                    <span className="font-medium">Riyadh, Saudi Arabia</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Neighborhoods</span>
                    <span className="font-medium">{neighborhoods?.length || 0} configured</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">OTA Platforms</span>
                    <span className="font-medium">{otaSources?.length || 0} active</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/30">
                    <span className="text-muted-foreground">Authentication</span>
                    <span className="font-medium">Local (bcrypt + JWT)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/50 border-yellow-500/20">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Legal & Compliance Notice</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Data collection complies with Saudi Arabia's Personal Data Protection Law (PDPL).
                    Only publicly available listing data is collected. No personal guest data is stored.
                    Rate limiting and respectful scraping practices are enforced to minimize platform impact.
                    All admin actions are logged in the audit trail for compliance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

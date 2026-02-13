import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Database,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Globe,
  Server,
  Shield,
  Play,
  Square,
  Calendar,
  Loader2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const STATUS_ICONS: Record<string, any> = {
  completed: CheckCircle2,
  failed: XCircle,
  running: RefreshCw,
  pending: Clock,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-400",
  failed: "text-red-400",
  running: "text-blue-400",
  pending: "text-yellow-400",
};

export default function AdminPanel() {
  const { data: scrapeJobs, isLoading: jobsLoading, refetch: refetchJobs } = trpc.scrapeJobs.list.useQuery({ limit: 20 });
  const { data: otaSources } = trpc.otaSources.list.useQuery();
  const { data: neighborhoods } = trpc.neighborhoods.list.useQuery();
  const { data: summary } = trpc.dashboard.summary.useQuery();
  const { data: schedulerStatus, refetch: refetchScheduler } = trpc.scheduler.status.useQuery(undefined, {
    retry: false,
    refetchInterval: 10000,
  });

  // Scraper trigger state
  const [selectedOtas, setSelectedOtas] = useState<string[]>([]);
  const [selectedNbs, setSelectedNbs] = useState<string[]>([]);
  const [jobType, setJobType] = useState<"full_scan" | "price_update" | "calendar_check" | "review_scan">("full_scan");
  const [triggering, setTriggering] = useState(false);

  // Scheduler state
  const [scheduleFreq, setScheduleFreq] = useState<"daily" | "weekly" | "biweekly" | "monthly">("weekly");

  const triggerMutation = trpc.scrapeJobs.trigger.useMutation({
    onSuccess: () => {
      toast.success("Scrape job started! Check the jobs list for progress.");
      setTriggering(false);
      setTimeout(() => refetchJobs(), 2000);
    },
    onError: (error) => {
      toast.error(`Failed to start scrape: ${error.message}`);
      setTriggering(false);
    },
  });

  const startSchedulerMutation = trpc.scheduler.start.useMutation({
    onSuccess: (result) => {
      toast.success(`Scheduler started with ${result.frequency} frequency`);
      refetchScheduler();
    },
    onError: (error) => {
      toast.error(`Failed to start scheduler: ${error.message}`);
    },
  });

  const stopSchedulerMutation = trpc.scheduler.stop.useMutation({
    onSuccess: () => {
      toast.success("Scheduler stopped");
      refetchScheduler();
    },
    onError: (error) => {
      toast.error(`Failed to stop scheduler: ${error.message}`);
    },
  });

  const otaMap = useMemo(() => {
    if (!otaSources) return {};
    return Object.fromEntries(otaSources.map(o => [o.id, o.name]));
  }, [otaSources]);

  const toggleOta = (slug: string) => {
    setSelectedOtas(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  const toggleNb = (slug: string) => {
    setSelectedNbs(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  };

  const handleTriggerScrape = () => {
    setTriggering(true);
    triggerMutation.mutate({
      otaSlugs: selectedOtas.length > 0 ? selectedOtas : undefined,
      neighborhoodSlugs: selectedNbs.length > 0 ? selectedNbs : undefined,
      jobType,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage data collection, monitor quality, and configure sources
        </p>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList className="bg-card/80">
          <TabsTrigger value="jobs" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" /> Scrape Jobs
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Scheduler
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" /> OTA Sources
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-1.5">
            <Database className="h-3.5 w-3.5" /> Data Quality
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" /> Configuration
          </TabsTrigger>
        </TabsList>

        {/* Scrape Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          {/* Trigger Controls */}
          <Card className="bg-card/80 border-border/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Trigger Manual Scrape
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* OTA Selection */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">OTA Platforms (empty = all)</Label>
                  <div className="space-y-1.5">
                    {["airbnb", "gathern", "booking", "agoda"].map(slug => (
                      <div key={slug} className="flex items-center gap-2">
                        <Checkbox
                          id={`ota-${slug}`}
                          checked={selectedOtas.includes(slug)}
                          onCheckedChange={() => toggleOta(slug)}
                        />
                        <Label htmlFor={`ota-${slug}`} className="text-sm cursor-pointer capitalize">{slug}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Neighborhood Selection */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Neighborhoods (empty = all)</Label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {neighborhoods?.map(nb => (
                      <div key={nb.slug} className="flex items-center gap-2">
                        <Checkbox
                          id={`nb-${nb.slug}`}
                          checked={selectedNbs.includes(nb.slug)}
                          onCheckedChange={() => toggleNb(nb.slug)}
                        />
                        <Label htmlFor={`nb-${nb.slug}`} className="text-sm cursor-pointer">{nb.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Job Type */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Job Type</Label>
                  <Select value={jobType} onValueChange={(v: any) => setJobType(v)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_scan">Full Scan</SelectItem>
                      <SelectItem value="price_update">Price Update</SelectItem>
                      <SelectItem value="calendar_check">Calendar Check</SelectItem>
                      <SelectItem value="review_scan">Review Scan</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Full scan collects all data. Price/calendar/review scans are faster targeted updates.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleTriggerScrape}
                disabled={triggering}
                className="gap-2"
              >
                {triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {triggering ? "Starting..." : "Start Scrape Job"}
              </Button>
            </CardContent>
          </Card>

          {/* Jobs List */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Scrape Jobs</h2>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => refetchJobs()}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>

          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-0">
              {jobsLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">OTA Source</TableHead>
                      <TableHead className="text-muted-foreground">Type</TableHead>
                      <TableHead className="text-muted-foreground">Started</TableHead>
                      <TableHead className="text-muted-foreground">Completed</TableHead>
                      <TableHead className="text-muted-foreground text-right">Listings</TableHead>
                      <TableHead className="text-muted-foreground text-right">Errors</TableHead>
                      <TableHead className="text-muted-foreground text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scrapeJobs?.map(job => {
                      const Icon = STATUS_ICONS[job.status || "pending"] || Clock;
                      const color = STATUS_COLORS[job.status || "pending"] || "text-muted-foreground";
                      return (
                        <TableRow key={job.id} className="border-border/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${color} ${job.status === 'running' ? 'animate-spin' : ''}`} />
                              <Badge variant="outline" className={`${color} text-xs`}>
                                {job.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{otaMap[job.otaSourceId ?? 0] || `OTA ${job.otaSourceId}`}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="secondary" className="text-xs">{job.jobType || "full_scan"}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {job.startedAt ? new Date(job.startedAt).toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {job.completedAt ? new Date(job.completedAt).toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono">{job.listingsFound || 0}</TableCell>
                          <TableCell className="text-right">
                            {(job.errors || 0) > 0 ? (
                              <span className="text-red-400 font-mono">{job.errors}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {job.duration ? `${(job.duration / 1000).toFixed(1)}s` : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!scrapeJobs || scrapeJobs.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No scrape jobs yet. Trigger one above or start the scheduler.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduler Tab */}
        <TabsContent value="scheduler" className="space-y-4">
          <h2 className="text-lg font-semibold">Automated Refresh Scheduler</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scheduler Status */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scheduler Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${schedulerStatus?.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="font-medium">{schedulerStatus?.isRunning ? "Running" : "Stopped"}</span>
                </div>

                {schedulerStatus?.isRunning && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-border/30">
                      <span className="text-muted-foreground">Frequency</span>
                      <Badge variant="outline" className="capitalize">{schedulerStatus.frequency}</Badge>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/30">
                      <span className="text-muted-foreground">Next Run</span>
                      <span className="font-mono text-xs">
                        {schedulerStatus.nextRunAt ? new Date(schedulerStatus.nextRunAt).toLocaleString() : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/30">
                      <span className="text-muted-foreground">Total Runs</span>
                      <span className="font-mono">{schedulerStatus.totalRuns}</span>
                    </div>
                  </div>
                )}

                {schedulerStatus?.lastRunAt && (
                  <div className="space-y-2 text-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Run</p>
                    <div className="flex justify-between py-1.5 border-b border-border/30">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-mono text-xs">{new Date(schedulerStatus.lastRunAt).toLocaleString()}</span>
                    </div>
                    {schedulerStatus.lastRunResult && (
                      <>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-muted-foreground">Listings</span>
                          <span className="font-mono">{schedulerStatus.lastRunResult.totalListings}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-muted-foreground">Errors</span>
                          <span className={`font-mono ${schedulerStatus.lastRunResult.totalErrors > 0 ? 'text-red-400' : ''}`}>
                            {schedulerStatus.lastRunResult.totalErrors}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-mono text-xs">{(schedulerStatus.lastRunResult.duration / 1000).toFixed(1)}s</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scheduler Controls */}
            <Card className="bg-card/80 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scheduler Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Refresh Frequency</Label>
                  <Select value={scheduleFreq} onValueChange={(v: any) => setScheduleFreq(v)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily (2:00 AM AST)</SelectItem>
                      <SelectItem value="weekly">Weekly (Monday 2:00 AM AST)</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly (1st & 15th, 2:00 AM AST)</SelectItem>
                      <SelectItem value="monthly">Monthly (1st, 2:00 AM AST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The scheduler runs automated full scans across all OTA platforms and neighborhoods
                    at the selected frequency. Jobs run at 2:00 AM Arabia Standard Time to minimize
                    impact on OTA platforms.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => startSchedulerMutation.mutate({ frequency: scheduleFreq })}
                    disabled={startSchedulerMutation.isPending}
                    className="gap-2"
                  >
                    {startSchedulerMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {schedulerStatus?.isRunning ? "Update Schedule" : "Start Scheduler"}
                  </Button>
                  {schedulerStatus?.isRunning && (
                    <Button
                      variant="outline"
                      onClick={() => stopSchedulerMutation.mutate()}
                      disabled={stopSchedulerMutation.isPending}
                      className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      {stopSchedulerMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      Stop
                    </Button>
                  )}
                </div>

                {/* Frequency Explanation */}
                <Card className="bg-background/30 border-border/30">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Recommended:</strong> Weekly or bi-weekly for balanced data freshness
                      and platform compliance. Daily scraping increases detection risk and is only
                      recommended during high-impact events (Riyadh Season, F1).
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* OTA Sources Tab */}
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
                      <p className="mt-1">
                        Last: {source.createdAt ? new Date(source.createdAt).toLocaleDateString() : "Never"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Data Quality Tab */}
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

          {/* Coverage Table */}
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
                    const nbMetric = summary?.neighborhoodMetrics?.find(m => m.neighborhoodId === nb.id);
                    const hasData = nbMetric && (nbMetric.totalListings ?? 0) > 0;
                    return (
                      <TableRow key={nb.id} className="border-border/30">
                        <TableCell className="font-medium">{nb.name}</TableCell>
                        <TableCell className="text-right">{nbMetric?.totalListings || 0}</TableCell>
                        <TableCell className="text-right">{nbMetric ? "Yes" : "No"}</TableCell>
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

        {/* Configuration Tab */}
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
                    <span className="text-muted-foreground">Scrapers</span>
                    <span className="font-medium">Airbnb, Gathern, Booking, Agoda</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Notice */}
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
                    Review the feasibility report for detailed legal analysis.
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

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, MapPin, DollarSign, Percent, TrendingUp, Building2, Star, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } from "recharts";
import { useLocation, useParams } from "wouter";
import { useMemo, useState } from "react";

const CHART_COLORS = ["oklch(0.72 0.15 185)", "oklch(0.65 0.18 250)", "oklch(0.75 0.12 145)", "oklch(0.7 0.15 55)", "oklch(0.65 0.15 310)"];
const PT_LABELS: Record<string, string> = { studio: "Studio", "1br": "1 BR", "2br": "2 BR", "3br": "3 BR", "4br_plus": "4 BR+" };

export default function NeighborhoodDetail() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [selectedPT, setSelectedPT] = useState<string>("all");

  const { data: neighborhoods } = trpc.neighborhoods.list.useQuery();
  const neighborhood = neighborhoods?.find(n => n.slug === params.slug);

  const { data: detail, isLoading } = trpc.neighborhoods.detail.useQuery(
    { id: neighborhood?.id || 0 },
    { enabled: !!neighborhood }
  );

  const { data: metricsData } = trpc.neighborhoods.metrics.useQuery(
    { neighborhoodId: neighborhood?.id || 0, propertyType: selectedPT !== "all" ? selectedPT : undefined },
    { enabled: !!neighborhood }
  );

  const { data: allMetrics } = trpc.neighborhoods.metrics.useQuery(
    { neighborhoodId: neighborhood?.id || 0 },
    { enabled: !!neighborhood }
  );

  const trendData = useMemo(() => {
    if (!metricsData) return [];
    return metricsData.map(m => ({
      date: new Date(m.metricDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      adr: Number(m.adr || 0),
      occupancy: Number(m.occupancyRate || 0),
      revpar: Number(m.revpar || 0),
      listings: m.totalListings || 0,
    }));
  }, [metricsData]);

  // ADR by property type for the latest period
  const ptComparison = useMemo(() => {
    if (!detail?.propertyTypeMetrics) return [];
    return detail.propertyTypeMetrics.map(m => ({
      type: PT_LABELS[m.propertyType || ""] || m.propertyType,
      adr: Number(m.adr || 0),
      occupancy: Number(m.occupancyRate || 0),
      revpar: Number(m.revpar || 0),
    }));
  }, [detail]);

  if (isLoading || !neighborhood) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const m = detail?.latestMetrics;
  const stats = detail?.listingStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{neighborhood.name}</h1>
            {neighborhood.nameAr && (
              <span className="text-muted-foreground text-lg" dir="rtl">{neighborhood.nameAr}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{neighborhood.city} — Detailed Market Analysis</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-glow bg-card/80 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">ADR</span>
            </div>
            <p className="text-xl font-bold">SAR {Number(m?.adr || 0).toLocaleString()}</p>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              <span>30d: SAR {Number(m?.adr30 || 0)}</span>
              <span>90d: SAR {Number(m?.adr90 || 0)}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-glow bg-card/80 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Occupancy</span>
            </div>
            <p className="text-xl font-bold">{Number(m?.occupancyRate || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="stat-glow bg-card/80 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">RevPAR</span>
            </div>
            <p className="text-xl font-bold">SAR {Number(m?.revpar || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="stat-glow bg-card/80 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Listings</span>
            </div>
            <p className="text-xl font-bold">{m?.totalListings || Number(stats?.count || 0)}</p>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              <span>New: {m?.newListings || 0}</span>
              <span>Rating: {Number(stats?.avgRating || 0).toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Property Type:</span>
        <Select value={selectedPT} onValueChange={setSelectedPT}>
          <SelectTrigger className="w-40 bg-card/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="1br">1 Bedroom</SelectItem>
            <SelectItem value="2br">2 Bedrooms</SelectItem>
            <SelectItem value="3br">3 Bedrooms</SelectItem>
            <SelectItem value="4br_plus">4+ Bedrooms</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ADR & RevPAR Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 260)" />
                  <XAxis dataKey="date" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "oklch(0.17 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", borderRadius: "8px", color: "oklch(0.93 0.005 260)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="adr" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.15} strokeWidth={2} name="ADR (SAR)" />
                  <Area type="monotone" dataKey="revpar" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.1} strokeWidth={2} name="RevPAR (SAR)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 260)" />
                  <XAxis dataKey="date" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "oklch(0.17 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", borderRadius: "8px", color: "oklch(0.93 0.005 260)", fontSize: 12 }} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, "Occupancy"]} />
                  <Area type="monotone" dataKey="occupancy" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.15} strokeWidth={2} name="Occupancy %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Type Comparison */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">ADR by Property Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ptComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 260)" />
                <XAxis dataKey="type" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                <YAxis tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "oklch(0.17 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", borderRadius: "8px", color: "oklch(0.93 0.005 260)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="adr" fill={CHART_COLORS[0]} name="ADR (SAR)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revpar" fill={CHART_COLORS[1]} name="RevPAR (SAR)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Hosts Table */}
      {detail?.topHosts && detail.topHosts.length > 0 && (
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Hosts in {neighborhood.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-muted-foreground">Host</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground text-right">Listings</TableHead>
                  <TableHead className="text-muted-foreground text-right">Avg Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.topHosts.map((host, i) => (
                  <TableRow key={i} className="border-border/30">
                    <TableCell className="font-medium">{host.hostName || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant={host.hostType === "property_manager" ? "default" : "secondary"} className="text-xs">
                        {host.hostType === "property_manager" ? "PM" : "Individual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{Number(host.count)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        {Number(host.avgRating || 0).toFixed(1)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

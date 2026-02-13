import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  TrendingUp,
  DollarSign,
  Percent,
  Users,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { useLocation } from "wouter";
import { useMemo } from "react";

const CHART_COLORS = [
  "oklch(0.72 0.15 185)",
  "oklch(0.65 0.18 250)",
  "oklch(0.75 0.12 145)",
  "oklch(0.7 0.15 55)",
  "oklch(0.65 0.15 310)",
  "oklch(0.6 0.12 200)",
];

const PT_LABELS: Record<string, string> = {
  studio: "Studio",
  "1br": "1 BR",
  "2br": "2 BR",
  "3br": "3 BR",
  "4br_plus": "4 BR+",
};

function formatSAR(value: number) {
  return `SAR ${value.toLocaleString()}`;
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: { value: number; label: string };
}) {
  return (
    <Card className="stat-glow bg-card/80 backdrop-blur border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3">
            {trend.value >= 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
            )}
            <span
              className={`text-xs font-medium ${trend.value >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card className="bg-card/80 border-border/50">
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: summary, isLoading } = trpc.dashboard.summary.useQuery();
  const { data: neighborhoods } = trpc.neighborhoods.list.useQuery();
  const { data: adrTrends } = trpc.metrics.adrTrends.useQuery({});
  const { data: otaSources } = trpc.otaSources.list.useQuery();
  const [, setLocation] = useLocation();

  const otaMap = useMemo(() => {
    if (!otaSources) return {};
    return Object.fromEntries(otaSources.map((o) => [o.id, o.name]));
  }, [otaSources]);

  const nbMap = useMemo(() => {
    if (!neighborhoods) return {};
    return Object.fromEntries(neighborhoods.map((n) => [n.id, n.name]));
  }, [neighborhoods]);

  // Prepare chart data
  const ptChartData = useMemo(() => {
    if (!summary?.propertyTypeDistribution) return [];
    return summary.propertyTypeDistribution.map((d) => ({
      name: PT_LABELS[d.propertyType || ""] || d.propertyType,
      value: Number(d.count),
    }));
  }, [summary]);

  const otaChartData = useMemo(() => {
    if (!summary?.otaDistribution) return [];
    return summary.otaDistribution.map((d) => ({
      name: otaMap[d.otaSourceId] || `OTA ${d.otaSourceId}`,
      value: Number(d.count),
    }));
  }, [summary, otaMap]);

  const hostChartData = useMemo(() => {
    if (!summary?.hostTypeDistribution) return [];
    return summary.hostTypeDistribution.map((d) => ({
      name: d.hostType === "property_manager" ? "Property Managers" : "Individual Hosts",
      value: Number(d.count),
    }));
  }, [summary]);

  // Neighborhood comparison data
  const nbCompare = useMemo(() => {
    if (!summary?.neighborhoodMetrics || !neighborhoods) return [];
    return summary.neighborhoodMetrics.map((m) => ({
      name: nbMap[m.neighborhoodId] || `NB ${m.neighborhoodId}`,
      adr: Number(m.adr || 0),
      occupancy: Number(m.occupancyRate || 0),
      revpar: Number(m.revpar || 0),
      listings: m.totalListings || 0,
      neighborhoodId: m.neighborhoodId,
    }));
  }, [summary, nbMap, neighborhoods]);

  // ADR trend line data
  const trendData = useMemo(() => {
    if (!adrTrends || !neighborhoods) return [];
    const grouped: Record<string, any> = {};
    for (const t of adrTrends) {
      const dateKey = new Date(t.metricDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey };
      const nbName = nbMap[t.neighborhoodId] || `NB ${t.neighborhoodId}`;
      grouped[dateKey][nbName] = Number(t.adr || 0);
    }
    return Object.values(grouped);
  }, [adrTrends, nbMap, neighborhoods]);

  const trendNbNames = useMemo(() => {
    if (!neighborhoods) return [];
    return neighborhoods.map((n) => n.name);
  }, [neighborhoods]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Market Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Riyadh Short-Term Rental Market Intelligence
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Market Overview
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Riyadh Short-Term Rental Market Intelligence
          </p>
        </div>
        {summary?.lastScrapeJob && (
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Clock className="h-3 w-3" />
            Last scan:{" "}
            {summary.lastScrapeJob.completedAt
              ? new Date(summary.lastScrapeJob.completedAt).toLocaleDateString()
              : "N/A"}
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Listings"
          value={Number(summary?.totalListings || 0).toLocaleString()}
          subtitle="Active across all OTAs"
          icon={Building2}
          trend={{ value: 3.2, label: "vs last week" }}
        />
        <KpiCard
          title="Avg. Daily Rate"
          value={formatSAR(summary?.avgAdr || 0)}
          subtitle="Across all neighborhoods"
          icon={DollarSign}
          trend={{ value: 5.1, label: "vs 30d ago" }}
        />
        <KpiCard
          title="Avg. Occupancy"
          value={`${summary?.avgOccupancy || 0}%`}
          subtitle="Estimated from calendars"
          icon={Percent}
          trend={{ value: -2.3, label: "vs last week" }}
        />
        <KpiCard
          title="Avg. RevPAR"
          value={formatSAR(summary?.avgRevpar || 0)}
          subtitle="Revenue per available room"
          icon={TrendingUp}
          trend={{ value: 4.7, label: "vs 30d ago" }}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Avg. Rating"
          value={summary?.avgRating || "0"}
          subtitle="Guest review score"
          icon={Star}
        />
        <KpiCard
          title="Competitors Tracked"
          value={Number(summary?.competitorCount || 0)}
          subtitle="Property managers with 3+ listings"
          icon={Users}
        />
        <KpiCard
          title="New This Week"
          value={summary?.newListingsThisWeek || 0}
          subtitle="New listings detected"
          icon={ArrowUpRight}
        />
      </div>

      {/* Charts Row 1: ADR Trends + Neighborhood Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ADR Trend */}
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ADR Trends by Neighborhood (12 weeks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 260)" />
                  <XAxis dataKey="date" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.012 260)",
                      border: "1px solid oklch(0.28 0.012 260)",
                      borderRadius: "8px",
                      color: "oklch(0.93 0.005 260)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {trendNbNames.slice(0, 6).map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Neighborhood ADR Comparison */}
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ADR by Neighborhood (Current)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nbCompare} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 260)" />
                  <XAxis type="number" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.012 260)",
                      border: "1px solid oklch(0.28 0.012 260)",
                      borderRadius: "8px",
                      color: "oklch(0.93 0.005 260)",
                      fontSize: 12,
                    }}
                    formatter={(value: any) => [`SAR ${value}`, "ADR"]}
                  />
                  <Bar dataKey="adr" fill="oklch(0.72 0.15 185)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Property Type + OTA + Host Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Property Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ptChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {ptChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.012 260)",
                      border: "1px solid oklch(0.28 0.012 260)",
                      borderRadius: "8px",
                      color: "oklch(0.93 0.005 260)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              OTA Platform Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={otaChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {otaChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.012 260)",
                      border: "1px solid oklch(0.28 0.012 260)",
                      borderRadius: "8px",
                      color: "oklch(0.93 0.005 260)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Host Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hostChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {hostChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.17 0.012 260)",
                      border: "1px solid oklch(0.28 0.012 260)",
                      borderRadius: "8px",
                      color: "oklch(0.93 0.005 260)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Neighborhood Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Neighborhoods
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {neighborhoods?.map((nb) => {
            const metric = nbCompare.find(
              (m) => m.neighborhoodId === nb.id
            );
            return (
              <Card
                key={nb.id}
                className="bg-card/80 border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => setLocation(`/neighborhood/${nb.slug}`)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {nb.name}
                    </h3>
                  </div>
                  {nb.nameAr && (
                    <p className="text-xs text-muted-foreground" dir="rtl">
                      {nb.nameAr}
                    </p>
                  )}
                  {metric ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">ADR</p>
                        <p className="font-semibold text-foreground">
                          SAR {metric.adr}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Occupancy</p>
                        <p className="font-semibold text-foreground">
                          {metric.occupancy.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">RevPAR</p>
                        <p className="font-semibold text-foreground">
                          SAR {metric.revpar}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Listings</p>
                        <p className="font-semibold text-foreground">
                          {metric.listings}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No data yet
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

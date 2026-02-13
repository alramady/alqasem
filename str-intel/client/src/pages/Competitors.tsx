import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Star, Building2, DollarSign, Award, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { useState, useMemo } from "react";

const CHART_COLORS = ["oklch(0.72 0.15 185)", "oklch(0.65 0.18 250)", "oklch(0.75 0.12 145)", "oklch(0.7 0.15 55)", "oklch(0.65 0.15 310)", "oklch(0.6 0.12 200)"];

export default function Competitors() {
  const [sortBy, setSortBy] = useState("portfolio");
  const { data: competitors, isLoading } = trpc.competitors.list.useQuery({ sortBy });

  const comparisonData = useMemo(() => {
    if (!competitors) return [];
    return competitors.map(c => ({
      name: (c.hostName || "Unknown").length > 18 ? (c.hostName || "Unknown").slice(0, 18) + "…" : (c.hostName || "Unknown"),
      portfolio: c.portfolioSize || 0,
      avgRate: Number(c.avgNightlyRate || 0),
      rating: Number(c.avgRating || 0),
      reviews: c.totalReviews || 0,
    }));
  }, [competitors]);

  const radarData = useMemo(() => {
    if (!competitors || competitors.length === 0) return [];
    const maxP = Math.max(...competitors.map(c => c.portfolioSize || 1));
    const maxR = Math.max(...competitors.map(c => Number(c.avgNightlyRate || 1)));
    const maxRev = Math.max(...competitors.map(c => c.totalReviews || 1));
    return [
      { metric: "Portfolio Size", ...Object.fromEntries(competitors.slice(0, 4).map(c => [c.hostName || "?", ((c.portfolioSize || 0) / maxP) * 100])) },
      { metric: "Avg Rate", ...Object.fromEntries(competitors.slice(0, 4).map(c => [c.hostName || "?", (Number(c.avgNightlyRate || 0) / maxR) * 100])) },
      { metric: "Rating", ...Object.fromEntries(competitors.slice(0, 4).map(c => [c.hostName || "?", (Number(c.avgRating || 0) / 5) * 100])) },
      { metric: "Reviews", ...Object.fromEntries(competitors.slice(0, 4).map(c => [c.hostName || "?", ((c.totalReviews || 0) / maxRev) * 100])) },
      { metric: "Superhost", ...Object.fromEntries(competitors.slice(0, 4).map(c => [c.hostName || "?", c.isSuperhost ? 100 : 30])) },
    ];
  }, [competitors]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Competitor Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">Property managers with 3+ listings in Riyadh</p>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44 bg-card/80">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portfolio">Portfolio Size</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="price">Avg Price</SelectItem>
            <SelectItem value="reviews">Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-glow bg-card/80 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Competitors</p>
                <p className="text-2xl font-bold">{competitors?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-glow bg-card/80 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total PM Listings</p>
                <p className="text-2xl font-bold">{competitors?.reduce((s, c) => s + (c.portfolioSize || 0), 0) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-glow bg-card/80 border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg PM Rate</p>
                <p className="text-2xl font-bold">
                  SAR {competitors && competitors.length > 0
                    ? Math.round(competitors.reduce((s, c) => s + Number(c.avgNightlyRate || 0), 0) / competitors.length)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Size & Avg Rate Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 260)" />
                  <XAxis dataKey="name" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis yAxisId="left" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "oklch(0.17 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", borderRadius: "8px", color: "oklch(0.93 0.005 260)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="portfolio" fill={CHART_COLORS[0]} name="Portfolio Size" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="avgRate" fill={CHART_COLORS[1]} name="Avg Rate (SAR)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Competitor Radar (Top 4)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(0.28 0.012 260)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} />
                  <PolarRadiusAxis tick={false} domain={[0, 100]} />
                  {competitors?.slice(0, 4).map((c, i) => (
                    <Radar key={c.hostId} name={c.hostName || "?"} dataKey={c.hostName || "?"} stroke={CHART_COLORS[i]} fill={CHART_COLORS[i]} fillOpacity={0.15} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: "oklch(0.17 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", borderRadius: "8px", color: "oklch(0.93 0.005 260)", fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">All Competitors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground text-right">Portfolio</TableHead>
                <TableHead className="text-muted-foreground text-right">Avg Rate</TableHead>
                <TableHead className="text-muted-foreground text-right">Rating</TableHead>
                <TableHead className="text-muted-foreground text-right">Reviews</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors?.map(c => (
                <TableRow key={c.id} className="border-border/30">
                  <TableCell className="font-medium">{c.hostName || "Unknown"}</TableCell>
                  <TableCell className="text-right">{c.portfolioSize}</TableCell>
                  <TableCell className="text-right">SAR {Number(c.avgNightlyRate || 0).toFixed(0)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      {Number(c.avgRating || 0).toFixed(1)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{c.totalReviews || 0}</TableCell>
                  <TableCell>
                    {c.isSuperhost ? (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                        <Award className="h-3 w-3 mr-1" /> Superhost
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Regular</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

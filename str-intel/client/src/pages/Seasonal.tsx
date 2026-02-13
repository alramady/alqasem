import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarRange, TrendingUp, TrendingDown, Zap, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";

const SEASON_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  peak: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", bar: "oklch(0.65 0.2 25)" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", bar: "oklch(0.7 0.15 55)" },
  low: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", bar: "oklch(0.65 0.18 250)" },
  event: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30", bar: "oklch(0.65 0.15 310)" },
};

const SEASON_ICONS: Record<string, any> = {
  peak: TrendingUp,
  high: ArrowUpRight,
  low: TrendingDown,
  event: Zap,
};

export default function Seasonal() {
  const { data: patterns, isLoading } = trpc.metrics.seasonal.useQuery();

  const chartData = useMemo(() => {
    if (!patterns) return [];
    return patterns.map(p => ({
      name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name,
      multiplier: Number(p.avgPriceMultiplier || 1),
      type: p.seasonType,
    }));
  }, [patterns]);

  const sortedPatterns = useMemo(() => {
    if (!patterns) return [];
    return [...patterns].sort((a, b) => {
      const da = a.startDate || "";
      const db = b.startDate || "";
      return da.localeCompare(db);
    });
  }, [patterns]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seasonal Patterns</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pricing seasonality, events, and demand patterns for the Riyadh STR market
        </p>
      </div>

      {/* Season Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(SEASON_COLORS).map(([type, colors]) => {
          const Icon = SEASON_ICONS[type];
          return (
            <Badge key={type} variant="outline" className={`${colors.bg} ${colors.text} ${colors.border} gap-1.5`}>
              <Icon className="h-3 w-3" />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          );
        })}
      </div>

      {/* Price Multiplier Chart */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Price Multiplier by Season/Event (1.0 = baseline)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.012 260)" />
                <XAxis dataKey="name" tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fill: "oklch(0.6 0.015 260)", fontSize: 11 }} domain={[0, 3]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "oklch(0.17 0.012 260)", border: "1px solid oklch(0.28 0.012 260)", borderRadius: "8px", color: "oklch(0.93 0.005 260)", fontSize: 12 }}
                  formatter={(v: any) => [`${Number(v).toFixed(2)}x`, "Multiplier"]}
                />
                <Bar dataKey="multiplier" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={SEASON_COLORS[entry.type]?.bar || "oklch(0.72 0.15 185)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedPatterns.map(p => {
          const colors = SEASON_COLORS[p.seasonType] || SEASON_COLORS.event;
          const Icon = SEASON_ICONS[p.seasonType] || Zap;
          const mult = Number(p.avgPriceMultiplier || 1);
          const isUp = mult >= 1;

          return (
            <Card key={p.id} className={`bg-card/80 border-border/50 ${colors.bg}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${colors.text}`} />
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {p.startDate} — {p.endDate}
                      </span>
                      {p.year && <Badge variant="outline" className="text-xs">{p.year}</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`${colors.text} ${colors.border} text-lg font-bold px-3 py-1`}>
                      {mult.toFixed(2)}x
                    </Badge>
                    <p className={`text-xs mt-1 ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                      {isUp ? "+" : ""}{((mult - 1) * 100).toFixed(0)}% vs baseline
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Table */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">All Seasonal Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-muted-foreground">Season/Event</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Start</TableHead>
                <TableHead className="text-muted-foreground">End</TableHead>
                <TableHead className="text-muted-foreground text-right">Multiplier</TableHead>
                <TableHead className="text-muted-foreground text-right">Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPatterns.map(p => {
                const mult = Number(p.avgPriceMultiplier || 1);
                const colors = SEASON_COLORS[p.seasonType] || SEASON_COLORS.event;
                return (
                  <TableRow key={p.id} className="border-border/30">
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border} text-xs`}>
                        {p.seasonType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.startDate}</TableCell>
                    <TableCell className="text-sm">{p.endDate}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{mult.toFixed(2)}x</TableCell>
                    <TableCell className="text-right">
                      <span className={mult >= 1 ? "text-emerald-400" : "text-red-400"}>
                        {mult >= 1 ? "+" : ""}{((mult - 1) * 100).toFixed(0)}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

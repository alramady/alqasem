import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Download, FileSpreadsheet, FileText, Table as TableIcon, CheckCircle2, Loader2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

const PT_LABELS: Record<string, string> = { studio: "Studio", "1br": "1 BR", "2br": "2 BR", "3br": "3 BR", "4br_plus": "4 BR+", all: "All Types" };

export default function ExportPage() {
  const { data: neighborhoods } = trpc.neighborhoods.list.useQuery();
  const [selectedNbs, setSelectedNbs] = useState<number[]>([]);
  const [selectedPTs, setSelectedPTs] = useState<string[]>(["all"]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Excel sheet toggles
  const [includeListings, setIncludeListings] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeCompetitors, setIncludeCompetitors] = useState(true);
  const [includeSeasonalPatterns, setIncludeSeasonalPatterns] = useState(true);
  const [includePriceSnapshots, setIncludePriceSnapshots] = useState(true);

  const queryInput = useMemo(() => ({
    neighborhoodIds: selectedNbs.length > 0 ? selectedNbs : undefined,
    propertyTypes: selectedPTs.length > 0 && !selectedPTs.includes("all") ? selectedPTs : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }), [selectedNbs, selectedPTs, dateFrom, dateTo]);

  const { data: exportData, isLoading } = trpc.export.data.useQuery(queryInput);

  const excelMutation = trpc.export.excel.useMutation({
    onSuccess: (result) => {
      // Decode base64 and download
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel report downloaded successfully");
      setExportingExcel(false);
    },
    onError: (error) => {
      toast.error(`Excel export failed: ${error.message}`);
      setExportingExcel(false);
    },
  });

  const nbMap = useMemo(() => {
    if (!neighborhoods) return {};
    return Object.fromEntries(neighborhoods.map(n => [n.id, n.name]));
  }, [neighborhoods]);

  const toggleNb = (id: number) => {
    setSelectedNbs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const togglePT = (pt: string) => {
    if (pt === "all") {
      setSelectedPTs(["all"]);
      return;
    }
    setSelectedPTs(prev => {
      const next = prev.filter(x => x !== "all");
      return next.includes(pt) ? next.filter(x => x !== pt) : [...next, pt];
    });
  };

  const selectAllNbs = () => {
    if (neighborhoods) {
      if (selectedNbs.length === neighborhoods.length) {
        setSelectedNbs([]);
      } else {
        setSelectedNbs(neighborhoods.map(n => n.id));
      }
    }
  };

  const downloadCSV = useCallback(() => {
    if (!exportData || exportData.length === 0) {
      toast.error("No data to export");
      return;
    }
    setExporting(true);

    try {
      const headers = ["Date", "Neighborhood", "Property Type", "ADR (SAR)", "ADR 30d", "ADR 60d", "ADR 90d", "Occupancy %", "RevPAR (SAR)", "Total Listings", "New Listings", "Avg Rating", "Median Price", "P25 Price", "P75 Price"];
      const rows = exportData.map(m => [
        m.metricDate ? new Date(m.metricDate).toISOString().split("T")[0] : "",
        nbMap[m.neighborhoodId] || m.neighborhoodId,
        PT_LABELS[m.propertyType || ""] || m.propertyType,
        m.adr || "",
        m.adr30 || "",
        m.adr60 || "",
        m.adr90 || "",
        m.occupancyRate || "",
        m.revpar || "",
        m.totalListings || "",
        m.newListings || "",
        m.avgRating || "",
        m.medianPrice || "",
        m.priceP25 || "",
        m.priceP75 || "",
      ]);

      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cobnb-market-intelligence-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }, [exportData, nbMap]);

  const downloadExcel = useCallback(() => {
    setExportingExcel(true);
    excelMutation.mutate({
      neighborhoodIds: selectedNbs.length > 0 ? selectedNbs : undefined,
      propertyTypes: selectedPTs.length > 0 && !selectedPTs.includes("all") ? selectedPTs : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      includeListings,
      includeMetrics,
      includeCompetitors,
      includeSeasonalPatterns,
      includePriceSnapshots,
    });
  }, [selectedNbs, selectedPTs, dateFrom, dateTo, includeListings, includeMetrics, includeCompetitors, includeSeasonalPatterns, includePriceSnapshots, excelMutation]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export Data</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Export market metrics for financial modeling and analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Neighborhoods */}
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Neighborhoods</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAllNbs}>
                  {selectedNbs.length === (neighborhoods?.length || 0) ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {neighborhoods?.map(nb => (
                <div key={nb.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`nb-${nb.id}`}
                    checked={selectedNbs.includes(nb.id)}
                    onCheckedChange={() => toggleNb(nb.id)}
                  />
                  <Label htmlFor={`nb-${nb.id}`} className="text-sm cursor-pointer">{nb.name}</Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Property Types */}
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Property Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["all", "studio", "1br", "2br", "3br", "4br_plus"].map(pt => (
                <div key={pt} className="flex items-center gap-2">
                  <Checkbox
                    id={`pt-${pt}`}
                    checked={selectedPTs.includes(pt)}
                    onCheckedChange={() => togglePT(pt)}
                  />
                  <Label htmlFor={`pt-${pt}`} className="text-sm cursor-pointer">{PT_LABELS[pt]}</Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Date Range</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-background/50 mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-background/50 mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Excel Sheet Options */}
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Excel Sheets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Metrics Data", value: includeMetrics, set: setIncludeMetrics },
                { label: "Listings Data", value: includeListings, set: setIncludeListings },
                { label: "Competitors", value: includeCompetitors, set: setIncludeCompetitors },
                { label: "Price Snapshots", value: includePriceSnapshots, set: setIncludePriceSnapshots },
                { label: "Seasonal Patterns", value: includeSeasonalPatterns, set: setIncludeSeasonalPatterns },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <Label className="text-sm cursor-pointer">{item.label}</Label>
                  <Switch checked={item.value} onCheckedChange={item.set} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preview & Export Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card/80 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Export Preview</CardTitle>
                <Badge variant="outline" className="gap-1">
                  <TableIcon className="h-3 w-3" />
                  {exportData?.length || 0} rows
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : exportData && exportData.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Neighborhood</th>
                        <th className="text-left p-2 text-muted-foreground font-medium">Type</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">ADR</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Occ %</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">RevPAR</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Listings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportData.slice(0, 50).map((m, i) => (
                        <tr key={i} className="border-b border-border/20">
                          <td className="p-2">{m.metricDate ? new Date(m.metricDate).toLocaleDateString() : "—"}</td>
                          <td className="p-2">{nbMap[m.neighborhoodId] || m.neighborhoodId}</td>
                          <td className="p-2">{PT_LABELS[m.propertyType || ""] || m.propertyType}</td>
                          <td className="p-2 text-right font-mono">SAR {Number(m.adr || 0)}</td>
                          <td className="p-2 text-right font-mono">{Number(m.occupancyRate || 0).toFixed(1)}%</td>
                          <td className="p-2 text-right font-mono">SAR {Number(m.revpar || 0)}</td>
                          <td className="p-2 text-right">{m.totalListings || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {exportData.length > 50 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Showing first 50 of {exportData.length} rows. Download for full data.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select filters to preview data</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={downloadCSV}
              disabled={!exportData || exportData.length === 0 || exporting}
              className="gap-2"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={downloadExcel}
              disabled={exportingExcel}
              className="gap-2 border-primary/30 hover:bg-primary/10"
            >
              {exportingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Export Excel (.xlsx)
            </Button>
          </div>

          {/* Export Info */}
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-2">Included in Excel Report</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> Summary with KPIs</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> ADR (current, 30d, 60d, 90d)</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> Occupancy Rate & RevPAR</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> Full Listings with URLs</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> Competitor Analysis</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> Price Percentiles (P25, P50, P75)</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> Seasonal Patterns & Events</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-primary" /> Price History Snapshots</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

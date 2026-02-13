import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, Award, ChevronLeft, ChevronRight, Building2, Filter } from "lucide-react";
import { useState, useMemo } from "react";

const PT_LABELS: Record<string, string> = { studio: "Studio", "1br": "1 BR", "2br": "2 BR", "3br": "3 BR", "4br_plus": "4 BR+" };

export default function Listings() {
  const [search, setSearch] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState<string>("all");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [hostType, setHostType] = useState<string>("all");
  const [sortBy, setSortBy] = useState("lastSeen");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: neighborhoods } = trpc.neighborhoods.list.useQuery();
  const { data: otaSources } = trpc.otaSources.list.useQuery();

  const queryInput = useMemo(() => ({
    search: search || undefined,
    neighborhoodId: neighborhoodId !== "all" ? Number(neighborhoodId) : undefined,
    propertyType: propertyType !== "all" ? propertyType : undefined,
    hostType: hostType !== "all" ? hostType : undefined,
    sortBy,
    sortDir,
    page,
    limit,
  }), [search, neighborhoodId, propertyType, hostType, sortBy, sortDir, page]);

  const { data, isLoading } = trpc.listings.list.useQuery(queryInput);

  const otaMap = useMemo(() => {
    if (!otaSources) return {};
    return Object.fromEntries(otaSources.map(o => [o.id, o.name]));
  }, [otaSources]);

  const nbMap = useMemo(() => {
    if (!neighborhoods) return {};
    return Object.fromEntries(neighborhoods.map(n => [n.id, n.name]));
  }, [neighborhoods]);

  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Listings Explorer</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse and filter all tracked STR listings in Riyadh</p>
      </div>

      {/* Filters */}
      <Card className="bg-card/80 border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>
            <div className="w-40">
              <label className="text-xs text-muted-foreground mb-1 block">Neighborhood</label>
              <Select value={neighborhoodId} onValueChange={v => { setNeighborhoodId(v); setPage(1); }}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {neighborhoods?.map(n => <SelectItem key={n.id} value={String(n.id)}>{n.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <label className="text-xs text-muted-foreground mb-1 block">Property Type</label>
              <Select value={propertyType} onValueChange={v => { setPropertyType(v); setPage(1); }}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="1br">1 BR</SelectItem>
                  <SelectItem value="2br">2 BR</SelectItem>
                  <SelectItem value="3br">3 BR</SelectItem>
                  <SelectItem value="4br_plus">4 BR+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <label className="text-xs text-muted-foreground mb-1 block">Host Type</label>
              <Select value={hostType} onValueChange={v => { setHostType(v); setPage(1); }}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="property_manager">Property Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-36">
              <label className="text-xs text-muted-foreground mb-1 block">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastSeen">Last Seen</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="reviews">Reviews</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {data?.total || 0} listings found
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Page {page} of {totalPages || 1}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="text-muted-foreground min-w-[250px]">Title</TableHead>
                      <TableHead className="text-muted-foreground">Neighborhood</TableHead>
                      <TableHead className="text-muted-foreground">Type</TableHead>
                      <TableHead className="text-muted-foreground">OTA</TableHead>
                      <TableHead className="text-muted-foreground">Host</TableHead>
                      <TableHead className="text-muted-foreground text-right">Rating</TableHead>
                      <TableHead className="text-muted-foreground text-right">Reviews</TableHead>
                      <TableHead className="text-muted-foreground text-right">Photos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map(listing => (
                      <TableRow key={listing.id} className="border-border/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate max-w-[250px]">{listing.title}</span>
                            {listing.isSuperhost && <Award className="h-3.5 w-3.5 text-yellow-400 shrink-0" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{nbMap[listing.neighborhoodId || 0] || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{PT_LABELS[listing.propertyType || ""] || listing.propertyType}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{otaMap[listing.otaSourceId] || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={listing.hostType === "property_manager" ? "default" : "outline"} className="text-xs">
                            {listing.hostType === "property_manager" ? "PM" : "Indiv."}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {listing.rating ? (
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-3 w-3 text-yellow-400" />
                              <span className="text-sm">{Number(listing.rating).toFixed(1)}</span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm">{listing.reviewCount || 0}</TableCell>
                        <TableCell className="text-right text-sm">{listing.photoCount || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data?.total || 0)} of {data?.total || 0}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useCar } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatMileage, formatCost } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Droplets, Wrench, DollarSign, Calendar, Gauge } from "lucide-react";
import { Link } from "wouter";

interface Stats {
  totalRecords: number;
  oilChanges: number;
  totalCost: number | null;
  avgOilInterval: number | null;
  oilIntervalCount: number;
  lastRecord: {
    id: number; date: string; mileage: number; description: string; shop: string | null;
  } | null;
}

interface ServiceRecord {
  id: number; date: string; mileage: number; description: string; shop: string | null; tags: string[];
}

export default function DashboardPage() {
  const { carId } = useCar();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/cars", carId, "stats"],
    queryFn: async () => (await apiRequest("GET", `/api/cars/${carId}/stats`)).json(),
    enabled: carId != null,
  });

  const { data: records = [] } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/cars", carId, "records"],
    queryFn: async () => (await apiRequest("GET", `/api/cars/${carId}/records`)).json(),
    enabled: carId != null,
  });

  const recentRecords = records.slice(0, 5);

  if (!carId) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalRecords ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Droplets className="h-4 w-4" /> Oil Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.oilChanges ?? "—"}</p>
            {stats?.avgOilInterval != null && (
              <p className="text-xs text-muted-foreground mt-1">
                avg {stats.avgOilInterval.toLocaleString()} km interval
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4" /> Last Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.lastRecord ? formatMileage(stats.lastRecord.mileage) : "—"}
            </p>
            {stats?.lastRecord && (
              <p className="text-xs text-muted-foreground mt-1">{formatDate(stats.lastRecord.date)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCost(stats?.totalCost)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Last service */}
      {stats?.lastRecord && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" /> {formatDate(stats.lastRecord.date)}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Gauge className="h-4 w-4" /> {formatMileage(stats.lastRecord.mileage)}
              </span>
              {stats.lastRecord.shop && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Wrench className="h-4 w-4" /> {stats.lastRecord.shop}
                </span>
              )}
            </div>
            <p className="mt-2 font-medium">{stats.lastRecord.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Recent records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Recent Service Records</CardTitle>
          <Link href="/records" className="text-xs text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentRecords.length === 0 ? (
            <p className="text-muted-foreground text-sm px-6 pb-4">No records yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentRecords.map((r) => (
                <div key={r.id} className="px-6 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{r.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(r.date)} · {formatMileage(r.mileage)}{r.shop ? ` · ${r.shop}` : ""}
                    </p>
                    {r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {r.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs py-0">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useCar } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatMileage, formatCost } from "@/lib/utils";
import { Droplets, Paperclip } from "lucide-react";

interface ServiceRecord {
  id: number; date: string; mileage: number; shop: string | null;
  description: string; cost: number | null; notes: string | null; attachment: string | null;
}

export default function OilChangesPage() {
  const { carId } = useCar();

  const { data: records = [], isLoading } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/cars", carId, "oil-changes"],
    queryFn: async () => (await apiRequest("GET", `/api/cars/${carId}/oil-changes`)).json(),
    enabled: carId != null,
  });

  if (!carId) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Oil Changes</h1>
      <p className="text-sm text-muted-foreground">
        All records tagged with "oil change", sorted newest first.
      </p>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Droplets className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No oil changes recorded yet. Tag a service record with "oil change" to see it here.</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="rounded-lg border bg-card p-4 flex gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">Total oil changes</p>
              <p className="text-2xl font-bold mt-0.5">{records.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Most recent</p>
              <p className="text-2xl font-bold mt-0.5">{formatDate(records[0]?.date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last mileage</p>
              <p className="text-2xl font-bold mt-0.5">{formatMileage(records[0]?.mileage)}</p>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mileage</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Shop</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cost</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((r, i) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{records.length - i}</td>
                    <td className="px-4 py-3 font-medium">{formatDate(r.date)}</td>
                    <td className="px-4 py-3">{formatMileage(r.mileage)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.shop ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{r.notes ?? r.description}</td>
                    <td className="px-4 py-3 text-right">{formatCost(r.cost)}</td>
                    <td className="px-4 py-3 text-right">
                      {r.attachment && (
                        <a href={r.attachment} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          <Paperclip className="h-4 w-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

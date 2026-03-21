import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCar } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatMileage } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, Wrench } from "lucide-react";

interface ComponentSummary {
  tag: string;
  last_date: string;
  last_mileage: number;
  times_replaced: number;
  record_ids: number[];
}

export default function ComponentsPage() {
  const { carId } = useCar();
  const [search, setSearch] = useState("");

  const { data: components = [], isLoading } = useQuery<ComponentSummary[]>({
    queryKey: ["/api/cars", carId, "components"],
    queryFn: async () => (await apiRequest("GET", `/api/cars/${carId}/components`)).json(),
    enabled: carId != null,
  });

  const filtered = components.filter(c =>
    search === "" || c.tag.toLowerCase().includes(search.toLowerCase())
  );

  if (!carId) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Components</h1>
      <p className="text-sm text-muted-foreground">
        Parts and components that have been replaced, auto-aggregated from your service records.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search components…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? "No matching components." : "No components tracked yet. Tag parts when adding service records."}</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Component</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Replaced</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Mileage</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Times Replaced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => (
                <tr key={c.tag} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium capitalize">{c.tag}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(c.last_date)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatMileage(c.last_mileage)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {c.times_replaced}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useCar } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatMileage, formatCost } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, Paperclip, Wrench, ArrowUpRight } from "lucide-react";

interface ServiceRecord {
  id: number; car_id: number; date: string; mileage: number; shop: string | null;
  description: string; cost: number | null; notes: string | null;
  attachment: string | null; tags: string[];
}

interface Props {
  params: { tag: string };
}

export default function ComponentDetailPage({ params }: Props) {
  const { carId } = useCar();
  const tag = decodeURIComponent(params.tag);
  const [selected, setSelected] = useState<ServiceRecord | null>(null);

  const { data: records = [], isLoading } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/cars", carId, "records"],
    queryFn: async () => (await apiRequest("GET", `/api/cars/${carId}/records`)).json(),
    enabled: carId != null,
  });

  const filtered = records.filter(r =>
    r.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );

  if (!carId) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {/* Back link */}
      <Link href="/components">
        <a className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Components
        </a>
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold capitalize">{tag}</h1>
        {!isLoading && (
          <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {filtered.length}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        All service records where <span className="font-medium capitalize">{tag}</span> was replaced or serviced.
      </p>

      {/* Records */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No records found for this component.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="w-full text-left rounded-lg border bg-card p-4 hover:border-primary/50 hover:bg-accent/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-1">
                    <span className="font-semibold text-sm text-foreground">{formatDate(r.date)}</span>
                    <span>{formatMileage(r.mileage)}</span>
                    {r.shop && <span>{r.shop}</span>}
                    {r.cost != null && <span>{formatCost(r.cost)}</span>}
                    {r.attachment && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Paperclip className="h-3 w-3" /> attachment
                      </span>
                    )}
                  </div>
                  <p className="font-medium">{r.description}</p>
                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.tags.map(t => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className={`text-xs ${t.toLowerCase() === tag.toLowerCase() ? "bg-primary/10 text-primary border-primary/20" : ""}`}
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Record detail dialog */}
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        {selected && (
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Service Record</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              {/* Date / Mileage / Shop / Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Date</p>
                  <p className="font-medium">{formatDate(selected.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Mileage</p>
                  <p className="font-medium">{formatMileage(selected.mileage)}</p>
                </div>
                {selected.shop && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Shop</p>
                    <p className="font-medium">{selected.shop}</p>
                  </div>
                )}
                {selected.cost != null && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Cost</p>
                    <p className="font-medium">{formatCost(selected.cost)}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Description</p>
                <p className="font-medium">{selected.description}</p>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Notes</p>
                  <p className="text-muted-foreground">{selected.notes}</p>
                </div>
              )}

              {/* Tags */}
              {selected.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Parts / Components</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.tags.map(t => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className={`text-xs ${t.toLowerCase() === tag.toLowerCase() ? "bg-primary/10 text-primary border-primary/20" : ""}`}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachment */}
              {selected.attachment && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Attachment</p>
                  <a
                    href={selected.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" /> View attachment
                  </a>
                </div>
              )}

              {/* Link to full records */}
              <div className="pt-2 border-t border-border">
                <Link href="/records">
                  <a className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => setSelected(null)}>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Open in Service Records to edit
                  </a>
                </Link>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

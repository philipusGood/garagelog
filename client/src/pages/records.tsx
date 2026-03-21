import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCar } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatMileage, formatCost } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Paperclip, X, Search } from "lucide-react";

interface ServiceRecord {
  id: number; car_id: number; date: string; mileage: number; shop: string | null;
  description: string; cost: number | null; notes: string | null;
  attachment: string | null; tags: string[];
}

interface RecordFormData {
  date: string; mileage: string; shop: string; description: string;
  cost: string; notes: string; tags: string; attachment: File | null;
}

const EMPTY_FORM: RecordFormData = {
  date: "", mileage: "", shop: "", description: "", cost: "", notes: "", tags: "", attachment: null,
};

const COMMON_TAGS = [
  "oil change", "oil filter", "air filter", "cabin filter", "spark plugs",
  "brake pads", "brake rotors", "brake fluid", "coolant flush", "transmission fluid",
  "differential fluid", "power steering fluid", "clutch", "water pump", "thermostat",
  "timing belt", "timing chain", "alternator", "battery", "serpentine belt",
  "wheel bearing", "cv axle", "tie rod", "control arm", "struts", "shocks",
  "tires", "alignment", "ims bearing", "rms seal", "inspection",
];

export default function RecordsPage() {
  const { carId } = useCar();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [form, setForm] = useState<RecordFormData>(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [tagInput, setTagInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: records = [], isLoading } = useQuery<ServiceRecord[]>({
    queryKey: ["/api/cars", carId, "records"],
    queryFn: async () => (await apiRequest("GET", `/api/cars/${carId}/records`)).json(),
    enabled: carId != null,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["/api/cars", carId, "records"] });
    qc.invalidateQueries({ queryKey: ["/api/cars", carId, "stats"] });
    qc.invalidateQueries({ queryKey: ["/api/cars", carId, "components"] });
    qc.invalidateQueries({ queryKey: ["/api/cars", carId, "oil-changes"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: RecordFormData) => {
      const fd = new FormData();
      fd.append("date", data.date);
      fd.append("mileage", data.mileage);
      fd.append("description", data.description);
      if (data.shop) fd.append("shop", data.shop);
      if (data.cost) fd.append("cost", data.cost);
      if (data.notes) fd.append("notes", data.notes);
      const tags = data.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
      fd.append("tags", JSON.stringify(tags));
      if (data.attachment) fd.append("attachment", data.attachment);

      if (editing) {
        await apiRequest("PUT", `/api/cars/${carId}/records/${editing.id}`, fd);
      } else {
        await apiRequest("POST", `/api/cars/${carId}/records`, fd);
      }
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      toast({ title: editing ? "Record updated" : "Record added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/cars/${carId}/records/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Record deleted" }); },
  });

  function openNew() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setOpen(true);
  }

  function openEdit(r: ServiceRecord) {
    setEditing(r);
    setForm({
      date: r.date, mileage: String(r.mileage), shop: r.shop ?? "", description: r.description,
      cost: r.cost != null ? String(r.cost) : "", notes: r.notes ?? "",
      tags: r.tags.join(", "), attachment: null,
    });
    setOpen(true);
  }

  function addTag(tag: string) {
    const current = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (!current.includes(tag)) {
      setForm(f => ({ ...f, tags: [...current, tag].join(", ") }));
    }
  }

  const filtered = records.filter(r =>
    search === "" ||
    r.description.toLowerCase().includes(search.toLowerCase()) ||
    r.tags.some(t => t.includes(search.toLowerCase())) ||
    (r.shop ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (!carId) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Service Records</h1>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Record
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search records…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Records list */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">{search ? "No matching records." : "No service records yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-1">
                  <span className="font-semibold text-sm text-foreground">{formatDate(r.date)}</span>
                  <span>{formatMileage(r.mileage)}</span>
                  {r.shop && <span>{r.shop}</span>}
                  {r.cost != null && <span>{formatCost(r.cost)}</span>}
                </div>
                <p className="font-medium">{r.description}</p>
                {r.notes && <p className="text-sm text-muted-foreground mt-1">{r.notes}</p>}
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                )}
                {r.attachment && (
                  <a
                    href={r.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
                  >
                    <Paperclip className="h-3 w-3" /> View attachment
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Delete this record?")) deleteMutation.mutate(r.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Record" : "Add Service Record"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="mileage">Mileage *</Label>
                <Input id="mileage" type="number" placeholder="e.g. 85000" value={form.mileage} onChange={e => setForm(f => ({ ...f, mileage: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Input id="description" placeholder="What was done?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="shop">Shop / Technician</Label>
                <Input id="shop" placeholder="Where was it done?" value={form.shop} onChange={e => setForm(f => ({ ...f, shop: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="cost">Cost ($)</Label>
                <Input id="cost" type="number" step="0.01" placeholder="0.00" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Additional notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" />
            </div>

            {/* Tags */}
            <div>
              <Label>Parts / Components Replaced</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Add a component tag…"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      e.preventDefault();
                      addTag(tagInput.trim());
                      setTagInput("");
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => { if (tagInput.trim()) { addTag(tagInput.trim()); setTagInput(""); } }}>
                  Add
                </Button>
              </div>
              {/* Common tag suggestions */}
              <div className="flex flex-wrap gap-1 mt-2">
                {COMMON_TAGS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTag(t)}
                    className="text-xs px-2 py-0.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
              {/* Selected tags */}
              {form.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                    <Badge key={t} variant="secondary" className="gap-1">
                      {t}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, tags: f.tags.split(",").map(s => s.trim()).filter(s => s && s !== t).join(", ") }))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Attachment */}
            <div>
              <Label>Document Attachment</Label>
              <div className="mt-1">
                {editing?.attachment && !form.attachment && (
                  <p className="text-xs text-muted-foreground mb-1">
                    Current: <a href={editing.attachment} target="_blank" rel="noreferrer" className="text-primary hover:underline">view file</a>
                  </p>
                )}
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                  {form.attachment ? form.attachment.name : "Attach file"}
                </Button>
                <input ref={fileRef} type="file" className="hidden" onChange={e => setForm(f => ({ ...f, attachment: e.target.files?.[0] ?? null }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.date || !form.mileage || !form.description || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : editing ? "Update" : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

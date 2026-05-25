import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCar } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Car } from "lucide-react";

interface CarData {
  id: number; name: string; year: number | null; model: string | null;
  vin: string | null; color: string | null; notes: string | null;
}

interface CarForm {
  name: string; year: string; model: string; vin: string; color: string; notes: string;
}

const EMPTY: CarForm = { name: "", year: "", model: "", vin: "", color: "", notes: "" };

export default function CarsPage() {
  const qc = useQueryClient();
  const { carId, setCarId } = useCar();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CarData | null>(null);
  const [form, setForm] = useState<CarForm>(EMPTY);

  const { data: cars = [] } = useQuery<CarData[]>({
    queryKey: ["/api/cars"],
    queryFn: async () => (await apiRequest("GET", "/api/cars")).json(),
  });

  const saveMutation = useMutation({
    mutationFn: async (f: CarForm) => {
      const body = { name: f.name, year: f.year ? Number(f.year) : null, model: f.model || null, vin: f.vin || null, color: f.color || null, notes: f.notes || null };
      if (editing) {
        await apiRequest("PUT", `/api/cars/${editing.id}`, body);
      } else {
        const res = await apiRequest("POST", "/api/cars", body);
        const newCar = await res.json();
        setCarId(newCar.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cars"] });
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
      toast({ title: editing ? "Car updated" : "Car added" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/cars/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/cars"] }); toast({ title: "Car removed" }); },
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(c: CarData) {
    setEditing(c);
    setForm({ name: c.name, year: c.year ? String(c.year) : "", model: c.model ?? "", vin: c.vin ?? "", color: c.color ?? "", notes: c.notes ?? "" });
    setOpen(true);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Cars</h1>
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Car
        </Button>
      </div>

      {cars.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No cars yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cars.map(c => (
            <div key={c.id} className={`rounded-lg border bg-card p-4 flex items-center justify-between gap-4 ${c.id === carId ? "border-primary" : ""}`}>
              <div className="flex items-start gap-3">
                <Car className={`h-5 w-5 mt-0.5 shrink-0 ${c.id === carId ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[c.year, c.model, c.color].filter(Boolean).join(" · ") || "No details"}
                  </p>
                  {c.vin && <p className="text-xs text-muted-foreground mt-0.5">VIN: {c.vin}</p>}
                  {c.notes && <p className="text-xs text-muted-foreground mt-0.5">{c.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {c.id !== carId && (
                  <Button variant="outline" size="sm" onClick={() => setCarId(c.id)}>Select</Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Remove "${c.name}" and all its records?`)) deleteMutation.mutate(c.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Car" : "Add Car"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="cname">Name *</Label>
              <Input id="cname" placeholder='e.g. "996 Carrera"' value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cyear">Year</Label>
                <Input id="cyear" type="number" placeholder="2001" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="cmodel">Model</Label>
                <Input id="cmodel" placeholder="911 Carrera" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ccolor">Color</Label>
                <Input id="ccolor" placeholder="Arctic Silver" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="cvin">VIN</Label>
                <Input id="cvin" placeholder="WP0AA299…" value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="cnotes">Notes</Label>
              <Textarea id="cnotes" placeholder="Any additional info…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : editing ? "Update" : "Add Car"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

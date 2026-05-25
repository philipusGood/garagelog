import { useCar } from "@/App";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, FileSpreadsheet, ClipboardList, Wrench, Droplets } from "lucide-react";

interface CarData { id: number; name: string; }

export default function ExportPage() {
  const { carId } = useCar();

  const { data: car } = useQuery<CarData>({
    queryKey: ["/api/cars", carId],
    queryFn: async () => (await apiRequest("GET", `/api/cars/${carId}`)).json(),
    enabled: carId != null,
  });

  async function handleExport() {
    const res = await fetch(`/api/cars/${carId}/export`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(car?.name ?? "garagelog").replace(/\s+/g, "_")}_maintenance.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!carId) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Export</h1>
      <p className="text-sm text-muted-foreground">
        Export the complete maintenance history for <strong>{car?.name ?? "this car"}</strong> as an Excel spreadsheet.
        Great for sharing with buyers or keeping an offline backup.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Maintenance History — Excel (.xlsx)
          </CardTitle>
          <CardDescription>The export includes three sheets:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <ClipboardList className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium">All Records</p>
              <p className="text-muted-foreground">Every service record with date, mileage, shop, description, parts replaced, cost, and notes.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Droplets className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium">Oil Changes</p>
              <p className="text-muted-foreground">All oil change records in a dedicated sheet.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Wrench className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium">Components</p>
              <p className="text-muted-foreground">Every tracked part with its last replacement date, mileage, and how many times it's been replaced.</p>
            </div>
          </div>
          <div className="pt-2">
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" /> Download Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

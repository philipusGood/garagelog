import { Switch, Route, Link, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useState, useEffect, createContext, useContext } from "react";
import {
  LayoutDashboard, ClipboardList, Wrench, Droplets,
  Download, Car, Sun, Moon, Menu, X, Plus, ChevronDown
} from "lucide-react";
import DashboardPage from "@/pages/dashboard";
import RecordsPage from "@/pages/records";
import ComponentsPage from "@/pages/components";
import ComponentDetailPage from "@/pages/component-detail";
import OilChangesPage from "@/pages/oil-changes";
import ExportPage from "@/pages/export";
import CarsPage from "@/pages/cars";

// ── Car context ───────────────────────────────────────────────────────────

interface CarCtx {
  carId: number | null;
  setCarId: (id: number) => void;
}
export const CarContext = createContext<CarCtx>({ carId: null, setCarId: () => {} });
export function useCar() { return useContext(CarContext); }

interface CarData { id: number; name: string; year: number | null; model: string | null; }

function AppLayout() {
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [carId, setCarId] = useState<number | null>(null);
  const [carPickerOpen, setCarPickerOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const { data: cars = [] } = useQuery<CarData[]>({
    queryKey: ["/api/cars"],
    queryFn: async () => (await apiRequest("GET", "/api/cars")).json(),
  });

  // Auto-select first car
  useEffect(() => {
    if (cars.length > 0 && carId === null) setCarId(cars[0].id);
  }, [cars, carId]);

  const selectedCar = cars.find((c) => c.id === carId);

  const navItems = [
    { href: "/",          label: "Dashboard",      icon: LayoutDashboard },
    { href: "/records",   label: "Service Records", icon: ClipboardList   },
    { href: "/components",label: "Components",      icon: Wrench          },
    { href: "/oil",       label: "Oil Changes",     icon: Droplets        },
    { href: "/export",    label: "Export",          icon: Download        },
    { href: "/cars",      label: "Manage Cars",     icon: Car             },
  ];

  return (
    <CarContext.Provider value={{ carId, setCarId }}>
      <div className="flex min-h-screen">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform duration-200",
          "md:relative md:translate-x-0 md:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}>
          {/* Logo */}
          <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7 text-primary">
                  <rect x="2" y="10" width="28" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 10V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="9" cy="22" r="2" fill="currentColor"/>
                  <circle cx="23" cy="22" r="2" fill="currentColor"/>
                  <path d="M13 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="font-semibold text-sm tracking-tight">GarageLog</span>
              </div>
              <button className="md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Car picker */}
          {cars.length > 0 && (
            <div className="px-3 pt-3">
              <button
                onClick={() => setCarPickerOpen(!carPickerOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-sidebar-accent/60 text-sidebar-accent-foreground text-sm font-medium hover:bg-sidebar-accent transition-colors"
              >
                <span className="truncate">{selectedCar ? selectedCar.name : "Select car"}</span>
                <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", carPickerOpen && "rotate-180")} />
              </button>
              {carPickerOpen && (
                <div className="mt-1 rounded-md border border-sidebar-border bg-sidebar overflow-hidden">
                  {cars.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCarId(c.id); setCarPickerOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-sidebar-accent transition-colors",
                        c.id === carId ? "text-primary font-medium" : "text-sidebar-foreground/80"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive = item.href === "/"
        ? location === "/"
        : location === item.href || location.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors w-full"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto bg-background min-w-0">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-border bg-background md:hidden">
            <button onClick={() => setMobileOpen(true)} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-semibold text-sm">GarageLog</span>
            {selectedCar && <span className="ml-auto text-xs text-muted-foreground">{selectedCar.name}</span>}
          </div>

          {/* No cars state */}
          {cars.length === 0 && location !== "/cars" ? (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4 text-center px-4">
              <Car className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-semibold text-lg">No cars yet</p>
                <p className="text-muted-foreground text-sm mt-1">Add your first car to get started.</p>
              </div>
              <Link href="/cars" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" /> Add a car
              </Link>
            </div>
          ) : (
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/records" component={RecordsPage} />
              <Route path="/components" component={ComponentsPage} />
              <Route path="/components/:tag" component={ComponentDetailPage} />
              <Route path="/oil" component={OilChangesPage} />
              <Route path="/export" component={ExportPage} />
              <Route path="/cars" component={CarsPage} />
            </Switch>
          )}
        </main>

        <Toaster />
      </div>
    </CarContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <AppLayout />
      </Router>
    </QueryClientProvider>
  );
}

export default App;

/**
 * GarageLog — Additional Records Seed
 * Adds records from individual invoices (2024–2026).
 * Run with: node seed-additions.mjs
 * Requires GarageLog to be running in Docker.
 */

const BASE = `${process.env.GARAGELOG_URL ?? "http://localhost:5002"}/api`;

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Get car ID (assumes car was already created by seed.mjs) ─────────────────

const carsRes = await fetch(`${BASE}/cars`);
const cars = await carsRes.json();
const car = cars[0];
if (!car) throw new Error("No cars found. Run seed.mjs first.");
console.log(`Using car: "${car.name}" (id=${car.id})\n`);

// ── Records ───────────────────────────────────────────────────────────────────

const records = [
  {
    date: "2024-02-02",
    mileage: 77242,
    shop: "Porsche Prestige — Montreal, QC",
    description: "PCCM+ radio retrofit, wiper blades, navigation diagnosis",
    cost: 3778.92,
    notes: "Performed retrofit install of PCCM+ radio (part #99664259100). Ordered and reinstalled radio pocket. Navigation diagnosis performed — unable to determine cause, PRMS ticket #3320049 opened. Wiper blades replaced. Mileage in: 77,242 / out: 77,243.",
    tags: ["pccm radio", "infotainment"],
  },
  {
    date: "2024-08-23",
    mileage: 80000,
    shop: "GTA — St-Hubert, QC",
    description: "Labour — 2 hrs (Invoice #16658)",
    cost: 320.00,
    notes: "Invoice #16658. 2 hours labour at $160/hr. Work description not detailed on invoice. Mileage estimated.",
    tags: [],
  },
  {
    date: "2024-10-07",
    mileage: 85102,
    shop: "GTA — St-Hubert, QC",
    description: "Bumper screens (black) installed, Xenon H6W bulb",
    cost: 1079.00,
    notes: "Invoice #6756. Black bumper screens installed (1.5 hrs labour). Xenon small bulb H6W replaced. Additional unspecified work ($280). Mileage: 85,102 km.",
    tags: ["bumper screens"],
  },
  {
    date: "2025-02-12",
    mileage: 88000,
    shop: "GTA — St-Hubert, QC",
    description: "Blower motor replacement, basic inspection",
    cost: 1017.12,
    notes: "Invoice #16998. Blower motor replaced (part $762.12, 1hr labour). Basic inspection (0.5hr). Mileage estimated.",
    tags: ["blower motor", "inspection"],
  },
  {
    date: "2025-04-14",
    mileage: 90375,
    shop: "GTA — St-Hubert, QC",
    description: "Front brake discs & pads, brake pad sensors, oil change & inspection, water drains cleaned",
    cost: 2002.29,
    notes: "Invoice #17087. 2x front brake discs ($580.10 each), front brake pad set, 2x brake pad sensors. Oil change & inspection. Water drains cleaned (no charge). 1.5hrs labour.",
    tags: ["brake rotors", "brake pads", "oil change", "oil filter", "inspection"],
  },
  {
    date: "2025-07-28",
    mileage: 98712,
    shop: "Porsche New Orleans — Metairie, LA",
    description: "10K interval service — oil & filter, tire pressures, fluids topped, vehicle inspection",
    cost: 684.17,
    notes: "RO #204613. Porsche scheduled 10K maintenance. Oil and filter change (0W40 Low Ash, 10L), adjusted tire pressures, topped off all fluids, full vehicle inspection checklist, reset maintenance indicator, stamped maintenance book. Multi-point inspection performed — all green. Brake pads: fronts 8mm, rears 8mm. Tires: 8/32\" front, 7/32\" rear. Mileage recorded by US dealer in miles: 61,321 mi = 98,712 km.",
    tags: ["oil change", "oil filter", "inspection"],
  },
  {
    date: "2025-08-14",
    mileage: 102000,
    shop: "Vitro Plus — Montreal, QC",
    description: "Windshield replacement (rock damage — insurance claim)",
    cost: 126.47,
    notes: "Windshield replaced after rock strike on 2025-08-13. Insurance claim #3406973 (Desjardins). Customer paid deductible only ($126.47). Full replacement cost: $679.21 windshield + $65.00 urethane. Mileage: ~102,000 km.",
    tags: ["windshield"],
  },
  {
    date: "2025-09-04",
    mileage: 102500,
    shop: "MagnaFin (online) — Richardson, TX",
    description: "Magnetic stone guards purchased and received (Deep Black)",
    cost: 228.90,
    notes: "MagnaFin order #563. Porsche 911/996/C4S/GT3 magnetic stone guards, deep black. $150 USD + $25 USD shipping + $38.90 CAD customs/duties (FedEx, paid Sep 4 2025). Mileage estimated.",
    tags: ["stone guards"],
  },
  {
    date: "2026-01-20",
    mileage: 103663,
    shop: "GTA — St-Hubert, QC",
    description: "Coolant hose replacement, coolant flush (G-13)",
    cost: 278.01,
    notes: "Invoice #17782. Coolant hose replaced, G-13 coolant fluid replaced. Labour $180.",
    tags: ["coolant hose", "coolant flush"],
  },
  {
    date: "2026-03-19",
    mileage: 104000,
    shop: "AGM Performance — Longueuil, QC",
    description: "Both front radiators replaced, left front control arm replaced, cooling system bled, suspension diagnosis",
    cost: 5137.35,
    notes: "Coolant leak/smell diagnosed. Left front suspension squeak diagnosed. Both front radiators replaced (left $1,371.25, right $1,371.25) with new coolant. Cooling system bled. Left front lower control arm replaced ($520.84), wheel alignment performed ($205.00). Mileage estimated (odometer not recorded on invoice).",
    tags: ["radiator", "control arm", "coolant flush", "wheel alignment", "inspection"],
  },
];

for (const r of records) {
  await post(`/cars/${car.id}/records`, r);
  console.log(`  + ${r.date} @ ${r.mileage.toLocaleString()} km — ${r.description}`);
}

console.log(`\n✓ Done. Added ${records.length} records to "${car.name}".`);

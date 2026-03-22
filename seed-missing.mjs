/**
 * GarageLog — Missing Records Seed
 * Adds two previously-skipped GTA invoices (scanned PDFs).
 * Run with: node seed-missing.mjs
 * Requires GarageLog to be running in Docker.
 */

const BASE = `${process.env.GARAGELOG_URL ?? "http://localhost:5002"}/api`;

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  // Get first car
  const cars = await (await fetch(`${BASE}/cars`)).json();
  if (!cars.length) throw new Error("No cars found — is GarageLog running?");
  const carId = cars[0].id;
  console.log(`Using car: ${cars[0].name} (id=${carId})\n`);

  const records = [
    {
      date: "2025-06-20",
      mileage: 92218,
      shop: "GTA Performance Tuning",
      description: "Oil change & filter. Inspection: auto, nud, drain.",
      cost: 758.84,
      notes: "Invoice #17354. Two line items: oil et filtre $320, vérifier auto/nud/drain $340 (subtotal $660 + taxes).",
      tags: ["oil change"],
    },
    {
      date: "2026-01-11",
      mileage: 103034,
      shop: "GTA Performance Tuning",
      description: "Oil change & inspection.",
      cost: 367.92,
      notes: "Invoice #17775 (file dated 2026.01.06, invoice date 2026.01.11). Oil change & inspection, $320 + taxes.",
      tags: ["oil change"],
    },
  ];

  for (const r of records) {
    const { tags, ...fields } = r;
    const record = await post(`/cars/${carId}/records`, { ...fields, tags });
    console.log(`✓ ${r.date} — ${r.description.slice(0, 50)} ($${r.cost})`);
  }

  console.log("\nDone! 2 records added.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });

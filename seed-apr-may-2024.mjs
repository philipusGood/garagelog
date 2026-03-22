/**
 * GarageLog — April & May 2024 GTA Invoices
 * Run with: node seed-apr-may-2024.mjs
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
  const cars = await (await fetch(`${BASE}/cars`)).json();
  if (!cars.length) throw new Error("No cars found — is GarageLog running?");
  const carId = cars[0].id;
  console.log(`Using car: ${cars[0].name} (id=${carId})\n`);

  const records = [
    {
      date: "2024-04-10",
      mileage: 78500,
      shop: "GTA Performance Tuning",
      description: "Inspection.",
      cost: 321.93,
      notes: "Invoice #16241. 1.75 hrs inspection × $160/hr. No mileage on invoice — estimated ~78,500 km.",
      tags: [],
    },
    {
      date: "2024-05-24",
      mileage: 79500,
      shop: "GTA Performance Tuning",
      description: "CV joint flex, sway bar link, 2x engine mounts, 2x rear control arms, right rear trailing arm, cabin filter, front radiator cleaning, wheel alignment. 6.5 hrs labour.",
      cost: 4308.66,
      notes: "Invoice #16416. Parts: flex de joint $157.55, link bar $102.29, 2x engine mont $598.26, 2x control arm rear $1,072.00, trailing arm ar d $348.59, cabine filteur $68.79. Labour: $1,040.00 (6.5 hrs). Radiator cleaning $160, alignment $200. No mileage on invoice — estimated ~79,500 km.",
      tags: ["control arm", "engine mounts", "cabin filter", "alignment", "sway bar link"],
    },
  ];

  for (const r of records) {
    const { tags, ...fields } = r;
    await post(`/cars/${carId}/records`, { ...fields, tags });
    console.log(`✓ ${r.date} — ${r.description.slice(0, 60)} ($${r.cost})`);
  }

  console.log("\nDone! 2 records added.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });

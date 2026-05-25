/**
 * GarageLog — McLaren Montreal PDI Seed (CSI-14645)
 * Pre-delivery inspection when car was purchased. All work N/C (dealer-covered).
 * Run with: node seed-csi.mjs
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

  const record = {
    date: "2024-02-19",
    mileage: 77138,
    shop: "McLaren Montreal",
    description: "Pre-delivery inspection (purchase). Hood & tailgate struts, licence plate & headlight bulbs, horn, shifter cable (cracked insert), all 4 winter tires (Kumho 235/40/18 & 275/35/18 + OEM summer wheels set aside), oil change (9L Mobil 1 0W40), brake fluid flush (Motul RBF 600).",
    cost: 0,
    notes: "Invoice #CSI-14645. All work N/C — covered by dealer at purchase. Mileage in 77,138 / out 77,206 km.",
    tags: ["oil change", "brake fluid", "tires", "shifter cable"],
  };

  const { tags, ...fields } = record;
  await post(`/cars/${carId}/records`, { ...fields, tags });
  console.log(`✓ ${record.date} — McLaren Montreal PDI at ${record.mileage} km ($0 — dealer-covered)`);
  console.log("\nDone! 1 record added.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });

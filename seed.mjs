/**
 * GarageLog Seed Script
 * ----------------------
 * Requires GarageLog to already be running in Docker.
 * Run with: node seed.mjs
 *
 * No npm install needed — uses built-in Node.js fetch.
 */

const BASE = "http://10.0.1.73:5002/api";

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

// ── Car ───────────────────────────────────────────────────────────────────────

const car = await post("/cars", {
  name: "996 Carrera 4S",
  year: 2004,
  model: "911 Carrera 4S",
  vin: "WPOCA29954S651674",
  color: null,
  notes: "Plate: PORSCH7",
});

console.log(`✓ Created car: "${car.name}" (id=${car.id})`);

// ── Records ───────────────────────────────────────────────────────────────────

const records = [
  {
    date: "2006-08-17",
    mileage: 21142,
    shop: "G-Tek Automotive Corp.",
    description: "Machined and replaced front & rear brake rotors",
    cost: 510.15,
    notes: "Invoice #7632",
    tags: ["brake rotors"],
  },
  {
    date: "2007-04-16",
    mileage: 23855,
    shop: "G-Tek Automotive Corp.",
    description: "24,000 km service — oil & filter, brake fluid flush",
    cost: 496.35,
    notes: "Invoice #7990. 10L synthetic oil, new oil filter, drain plug seal, brake fluid flush.",
    tags: ["oil change", "oil filter", "brake fluid"],
  },
  {
    date: "2007-06-27",
    mileage: 26122,
    shop: "G-Tek Automotive Corp.",
    description: "Front & rear brake rotors, front brake pads, key fob battery",
    cost: 1654.87,
    notes: "Invoice #8138. Brake rotors pulsating. 2x front rotors, 2x rear rotors, 1x front pad set.",
    tags: ["brake rotors", "brake pads"],
  },
  {
    date: "2009-04-01",
    mileage: 35686,
    shop: "G-Tek Automotive Corp.",
    description: "40,000 km service — oil & filter, spark plugs, ignition coil #4, drive belt, tire repair, e-test",
    cost: 1181.12,
    notes: "Invoice #9393. Replaced ignition coil #4 (broken tap). 6x spark plugs, oil filter, 10L synthetic oil, drive belt, fuel system cleaner. Left rear tire slow leak — removed, resealed rim bead, balanced.",
    tags: ["oil change", "oil filter", "spark plugs", "ignition coil", "serpentine belt", "tires"],
  },
  {
    date: "2010-04-05",
    mileage: 39948,
    shop: "G-Tek Automotive Corp.",
    description: "Maintenance service — oil & filter, wiper blades",
    cost: 339.97,
    notes: "Invoice #10279. 10L synthetic oil, oil filter, drain plug seal, wiper blade set.",
    tags: ["oil change", "oil filter"],
  },
  {
    date: "2010-05-26",
    mileage: 40517,
    shop: "G-Tek Automotive Corp.",
    description: "Clutch kit replacement (OE)",
    cost: 1971.50,
    notes: "Invoice #10449. OE clutch kit part #99611691102.",
    tags: ["clutch"],
  },
  {
    date: "2010-08-11",
    mileage: 42420,
    shop: "G-Tek Automotive Corp.",
    description: "Water pump replacement, coolant flush",
    cost: 1033.51,
    notes: "Invoice #8185. Coolant leak. Replaced water pump, gasket, 6L coolant.",
    tags: ["water pump", "coolant flush"],
  },
  {
    date: "2010-10-07",
    mileage: 43620,
    shop: "G-Tek Automotive Corp.",
    description: "Convertible roof right-side flap motor replacement",
    cost: 757.10,
    notes: "Invoice #10790. Roof not operating properly. Removed panels, diagnosed, replaced right-side flap motor.",
    tags: ["roof motor"],
  },
  {
    date: "2011-04-05",
    mileage: 44010,
    shop: "G-Tek Automotive Corp.",
    description: "Battery replacement, oil & filter, e-test, rear park light bulb",
    cost: 580.74,
    notes: "Invoice #11130. Battery MT91, 10L synthetic oil, oil filter, drain plug seal, rear park light bulb.",
    tags: ["oil change", "oil filter", "battery"],
  },
  {
    date: "2011-07-06",
    mileage: 45717,
    shop: "G-Tek Automotive Corp.",
    description: "Left front HID headlight bulb replacement",
    cost: 388.38,
    notes: "Invoice #11390.",
    tags: ["headlight bulb"],
  },
  {
    date: "2011-11-05",
    mileage: 47545,
    shop: "G-Tek Automotive Corp.",
    description: "Winter prep — fuel stabilizer, tire pressure check",
    cost: 17.97,
    notes: "Invoice #11709. Fuel stabilizer added, tire pressure inflated for storage.",
    tags: [],
  },
  {
    date: "2012-03-26",
    mileage: 47608,
    shop: "G-Tek Automotive Corp.",
    description: "Oil & filter, brake fluid flush, tire repair, left park bulb",
    cost: 544.99,
    notes: "Invoice #11971. Mobil 1 oil, oil filter, brake fluid flush, rear tire pressure was low and replug, left headlight park bulb.",
    tags: ["oil change", "oil filter", "brake fluid"],
  },
  {
    date: "2012-05-03",
    mileage: 48238,
    shop: "G-Tek Automotive Corp.",
    description: "911 / C4S / Carrera / 4 badges installed",
    cost: 133.64,
    notes: "Invoice #12084.",
    tags: [],
  },
  {
    date: "2012-11-14",
    mileage: 49924,
    shop: "G-Tek Automotive Corp.",
    description: "Safety inspection, e-test, oil pressure switch, fuel additive",
    cost: 484.54,
    notes: "Invoice #12668. Oil pressure switch defective — replaced. Tire pressure inflated for storage. 2x fuel additive.",
    tags: ["oil pressure switch", "inspection"],
  },
  {
    date: "2013-09-18",
    mileage: 52475,
    shop: "G-Tek Automotive Corp.",
    description: "Convertible top cable (driver side), hood shocks",
    cost: 789.67,
    notes: "Invoice #13519. Driver side convertible top cable broken — partially removed top, replaced cable. 2x hood shocks installed.",
    tags: ["convertible top cable", "hood shocks"],
  },
  {
    date: "2014-04-24",
    mileage: 52946,
    shop: "G-Tek Automotive Corp.",
    description: "Driver seat heater element, oil & filter, brake fluid flush, fuel system service",
    cost: 997.70,
    notes: "Invoice #14117. Seat heater element replaced. 10L synthetic oil, oil filter. Brake fluid exchange.",
    tags: ["oil change", "oil filter", "brake fluid", "seat heater"],
  },
  {
    date: "2014-06-03",
    mileage: 52946,
    shop: "G-Tek Automotive Corp.",
    description: "Spare key fob — programmed",
    cost: 292.03,
    notes: "Invoice #14262. Spare key fob purchased and programmed to vehicle.",
    tags: [],
  },
  {
    date: "2015-03-25",
    mileage: 55452,
    shop: "G-Tek Automotive Corp.",
    description: "Major annual service — oil & filter, spark plugs, ignition coils, drive belts, emissions test, spare key fob",
    cost: 4430.88,
    notes: "Invoice #15134. Full AYR maintenance: oil & filter, spark plugs, ignition coils (all replaced, in bad shape), drive belts, undercarriage checked. Emissions test. Spare key fob programmed.",
    tags: ["oil change", "oil filter", "spark plugs", "ignition coil", "serpentine belt", "inspection"],
  },
  {
    date: "2016-06-02",
    mileage: 57692,
    shop: "G-Tek Automotive Corp.",
    description: "Alarm control unit replacement & reprogramming",
    cost: 519.80,
    notes: "Invoice #16504.",
    tags: ["alarm"],
  },
  {
    date: "2017-04-10",
    mileage: 57692,
    shop: "G-Tek Automotive Corp.",
    description: "Oil & filter, coolant expansion tank replacement, park lights",
    cost: 1545.98,
    notes: "Invoice #17444. Oil & filter change, 9L engine oil. Coolant expansion tank and cap replaced, coolant drained and refilled, air bled. Left front park light and right front running light replaced.",
    tags: ["oil change", "oil filter", "coolant expansion tank", "coolant flush"],
  },
  {
    date: "2021-12-21",
    mileage: 75702,
    shop: "EK Performance — Montreal, QC",
    description: "LN Engineering IMS bearing upgrade, clutch kit, flywheel, oil & filter",
    cost: 5724.61,
    notes: "Invoice #26464. LN Upgrade IMS bearing including labour. New clutch kit, flywheel, oil and filter.",
    tags: ["ims bearing", "clutch", "flywheel", "oil change", "oil filter"],
  },
];

for (const r of records) {
  await post(`/cars/${car.id}/records`, r);
  console.log(`  + ${r.date} @ ${r.mileage.toLocaleString()} km — ${r.description}`);
}

console.log(`\n✓ Done. Imported ${records.length} records for "${car.name}".`);

/**
 * GarageLog Seed Script
 * ---------------------
 * Use this to bulk-import historical service records from AI-parsed data.
 *
 * Usage:
 *   npm run seed
 *
 * Edit the RECORDS array below with your actual service history.
 * Each record supports: date, mileage, shop, description, cost, notes, tags[]
 *
 * Tags are used to populate the Components tab. Common tags:
 *   oil change, water pump, clutch, ims bearing, spark plugs, etc.
 *
 * Run once after creating your car via the UI (to get the car ID),
 * or set CREATE_CAR to true to create the car as well.
 */

import "./db";
import { createCar, createRecord } from "./storage";

const CREATE_CAR = true; // set false if car already exists in DB

const CAR = {
  name: "996 Carrera",
  year: 2001,
  model: "911 Carrera",
  vin: null,
  color: null,
  notes: null,
};

// ──────────────────────────────────────────────────────────────────────────────
// Edit this array with your historical service records
// ──────────────────────────────────────────────────────────────────────────────
const RECORDS: {
  date: string;        // YYYY-MM-DD
  mileage: number;
  shop?: string;
  description: string;
  cost?: number;
  notes?: string;
  tags?: string[];
}[] = [
  // Example — delete and replace with your actual records:
  {
    date: "2017-03-21",
    mileage: 65000,
    shop: "Porsche Centre",
    description: "Major service — water pump, thermostat, coolant flush, spark plugs",
    cost: 2800,
    notes: "LN Engineering IMS retrofit also performed",
    tags: ["water pump", "thermostat", "coolant flush", "spark plugs", "ims bearing"],
  },
  {
    date: "2018-06-15",
    mileage: 71200,
    shop: "Independent Porsche",
    description: "Oil service",
    cost: 320,
    tags: ["oil change", "oil filter"],
  },
];
// ──────────────────────────────────────────────────────────────────────────────

async function seed() {
  let carId: number;

  if (CREATE_CAR) {
    const car = createCar(CAR);
    carId = car.id;
    console.log(`✓ Created car: "${car.name}" (id=${carId})`);
  } else {
    // Replace this with your actual car id
    carId = 1;
    console.log(`Using existing car id=${carId}`);
  }

  for (const r of RECORDS) {
    createRecord({ car_id: carId, ...r });
    console.log(`  + ${r.date} — ${r.description}`);
  }

  console.log(`\nDone. Imported ${RECORDS.length} record(s).`);
}

seed().catch(console.error);

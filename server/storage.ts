import { db } from "./db";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Car {
  id: number;
  name: string;
  year: number | null;
  model: string | null;
  vin: string | null;
  color: string | null;
  notes: string | null;
  created_at: string;
}

export interface ServiceRecord {
  id: number;
  car_id: number;
  date: string;
  mileage: number;
  shop: string | null;
  description: string;
  cost: number | null;
  notes: string | null;
  attachment: string | null;
  created_at: string;
  tags: string[];
}

export interface ComponentSummary {
  tag: string;
  last_date: string;
  last_mileage: number;
  times_replaced: number;
  record_ids: number[];
}

// ── Cars ──────────────────────────────────────────────────────────────────

export function getCars(): Car[] {
  return db.prepare("SELECT * FROM cars ORDER BY name").all() as Car[];
}

export function getCar(id: number): Car | undefined {
  return db.prepare("SELECT * FROM cars WHERE id = ?").get(id) as Car | undefined;
}

export function createCar(data: Omit<Car, "id" | "created_at">): Car {
  const result = db
    .prepare(
      `INSERT INTO cars (name, year, model, vin, color, notes)
       VALUES (@name, @year, @model, @vin, @color, @notes)`
    )
    .run(data);
  return getCar(result.lastInsertRowid as number)!;
}

export function updateCar(id: number, data: Partial<Omit<Car, "id" | "created_at">>): Car | undefined {
  const car = getCar(id);
  if (!car) return undefined;
  const merged = { ...car, ...data };
  db.prepare(
    `UPDATE cars SET name=@name, year=@year, model=@model, vin=@vin, color=@color, notes=@notes WHERE id=@id`
  ).run({ ...merged, id });
  return getCar(id);
}

export function deleteCar(id: number): void {
  db.prepare("DELETE FROM cars WHERE id = ?").run(id);
}

// ── Service Records ────────────────────────────────────────────────────────

function attachTags(records: Omit<ServiceRecord, "tags">[]): ServiceRecord[] {
  const ids = records.map((r) => r.id);
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const tagRows = db
    .prepare(`SELECT record_id, tag FROM record_tags WHERE record_id IN (${placeholders}) ORDER BY tag`)
    .all(...ids) as { record_id: number; tag: string }[];
  const tagMap = new Map<number, string[]>();
  for (const row of tagRows) {
    if (!tagMap.has(row.record_id)) tagMap.set(row.record_id, []);
    tagMap.get(row.record_id)!.push(row.tag);
  }
  return records.map((r) => ({ ...r, tags: tagMap.get(r.id) ?? [] }));
}

export function getRecords(carId: number): ServiceRecord[] {
  const rows = db
    .prepare("SELECT * FROM service_records WHERE car_id = ? ORDER BY date DESC, id DESC")
    .all(carId) as Omit<ServiceRecord, "tags">[];
  return attachTags(rows);
}

export function getRecord(id: number): ServiceRecord | undefined {
  const row = db
    .prepare("SELECT * FROM service_records WHERE id = ?")
    .get(id) as Omit<ServiceRecord, "tags"> | undefined;
  if (!row) return undefined;
  return attachTags([row])[0];
}

export interface CreateRecordInput {
  car_id: number;
  date: string;
  mileage: number;
  shop?: string;
  description: string;
  cost?: number;
  notes?: string;
  attachment?: string;
  tags?: string[];
}

export function createRecord(data: CreateRecordInput): ServiceRecord {
  const result = db
    .prepare(
      `INSERT INTO service_records (car_id, date, mileage, shop, description, cost, notes, attachment)
       VALUES (@car_id, @date, @mileage, @shop, @description, @cost, @notes, @attachment)`
    )
    .run({ ...data, shop: data.shop ?? null, cost: data.cost ?? null, notes: data.notes ?? null, attachment: data.attachment ?? null });
  const id = result.lastInsertRowid as number;
  if (data.tags && data.tags.length > 0) {
    const insertTag = db.prepare("INSERT INTO record_tags (record_id, tag) VALUES (?, ?)");
    for (const tag of data.tags) {
      insertTag.run(id, tag.trim().toLowerCase());
    }
  }
  return getRecord(id)!;
}

export interface UpdateRecordInput extends Partial<CreateRecordInput> {
  tags?: string[];
}

export function updateRecord(id: number, data: UpdateRecordInput): ServiceRecord | undefined {
  const existing = getRecord(id);
  if (!existing) return undefined;
  const merged = {
    car_id: existing.car_id,
    date: existing.date,
    mileage: existing.mileage,
    shop: existing.shop,
    description: existing.description,
    cost: existing.cost,
    notes: existing.notes,
    attachment: existing.attachment,
    ...data,
  };
  db.prepare(
    `UPDATE service_records SET date=@date, mileage=@mileage, shop=@shop, description=@description,
     cost=@cost, notes=@notes, attachment=@attachment WHERE id=@id`
  ).run({ ...merged, id });
  // replace tags
  if (data.tags !== undefined) {
    db.prepare("DELETE FROM record_tags WHERE record_id = ?").run(id);
    const insertTag = db.prepare("INSERT INTO record_tags (record_id, tag) VALUES (?, ?)");
    for (const tag of data.tags) {
      insertTag.run(id, tag.trim().toLowerCase());
    }
  }
  return getRecord(id);
}

export function deleteRecord(id: number): void {
  db.prepare("DELETE FROM service_records WHERE id = ?").run(id);
}

// ── Oil changes ────────────────────────────────────────────────────────────

export function getOilChanges(carId: number): ServiceRecord[] {
  const rows = db
    .prepare(
      `SELECT sr.* FROM service_records sr
       JOIN record_tags rt ON rt.record_id = sr.id
       WHERE sr.car_id = ? AND rt.tag = 'oil change'
       ORDER BY sr.date DESC, sr.id DESC`
    )
    .all(carId) as Omit<ServiceRecord, "tags">[];
  return attachTags(rows);
}

// ── Components ─────────────────────────────────────────────────────────────

export function getComponents(carId: number): ComponentSummary[] {
  const rows = db
    .prepare(
      `SELECT rt.tag,
              MAX(sr.date)    AS last_date,
              MAX(sr.mileage) AS last_mileage,
              COUNT(*)        AS times_replaced,
              GROUP_CONCAT(sr.id) AS record_ids
       FROM record_tags rt
       JOIN service_records sr ON sr.id = rt.record_id
       WHERE sr.car_id = ? AND rt.tag != 'oil change'
       GROUP BY rt.tag
       ORDER BY rt.tag`
    )
    .all(carId) as (Omit<ComponentSummary, "record_ids"> & { record_ids: string })[];
  return rows.map((r) => ({
    ...r,
    record_ids: r.record_ids.split(",").map(Number),
  }));
}

// ── Stats ──────────────────────────────────────────────────────────────────

export function getCarStats(carId: number) {
  const totalRecords = (
    db.prepare("SELECT COUNT(*) as c FROM service_records WHERE car_id = ?").get(carId) as { c: number }
  ).c;
  const lastRecord = db
    .prepare("SELECT * FROM service_records WHERE car_id = ? ORDER BY date DESC, id DESC LIMIT 1")
    .get(carId) as Omit<ServiceRecord, "tags"> | undefined;
  const oilChanges = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM service_records sr
         JOIN record_tags rt ON rt.record_id = sr.id
         WHERE sr.car_id = ? AND rt.tag = 'oil change'`
      )
      .get(carId) as { c: number }
  ).c;
  const totalCost = (
    db.prepare("SELECT SUM(cost) as s FROM service_records WHERE car_id = ?").get(carId) as { s: number | null }
  ).s;

  // Average oil change interval (km between consecutive oil changes)
  const oilMileages = (
    db.prepare(
      `SELECT sr.mileage FROM service_records sr
       JOIN record_tags rt ON rt.record_id = sr.id
       WHERE sr.car_id = ? AND rt.tag = 'oil change'
       ORDER BY sr.mileage ASC`
    ).all(carId) as { mileage: number }[]
  ).map((r) => r.mileage);

  let avgOilInterval: number | null = null;
  let oilIntervalCount = 0;
  if (oilMileages.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < oilMileages.length; i++) {
      const gap = oilMileages[i] - oilMileages[i - 1];
      if (gap > 0) intervals.push(gap);
    }
    if (intervals.length > 0) {
      avgOilInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
      oilIntervalCount = intervals.length;
    }
  }

  return { totalRecords, lastRecord, oilChanges, totalCost, avgOilInterval, oilIntervalCount };
}

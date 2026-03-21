import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import {
  getCars, getCar, createCar, updateCar, deleteCar,
  getRecords, getRecord, createRecord, updateRecord, deleteRecord,
  getOilChanges, getComponents, getCarStats,
} from "./storage";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

export const router = Router();

// ── Cars ──────────────────────────────────────────────────────────────────

router.get("/cars", (_req, res) => {
  res.json(getCars());
});

router.post("/cars", (req, res) => {
  const { name, year, model, vin, color, notes } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  res.status(201).json(createCar({ name, year: year ?? null, model: model ?? null, vin: vin ?? null, color: color ?? null, notes: notes ?? null }));
});

router.get("/cars/:id", (req, res) => {
  const car = getCar(Number(req.params.id));
  if (!car) return res.status(404).json({ error: "not found" });
  res.json(car);
});

router.put("/cars/:id", (req, res) => {
  const car = updateCar(Number(req.params.id), req.body);
  if (!car) return res.status(404).json({ error: "not found" });
  res.json(car);
});

router.delete("/cars/:id", (req, res) => {
  deleteCar(Number(req.params.id));
  res.status(204).end();
});

router.get("/cars/:id/stats", (req, res) => {
  res.json(getCarStats(Number(req.params.id)));
});

// ── Records ───────────────────────────────────────────────────────────────

router.get("/cars/:carId/records", (req, res) => {
  res.json(getRecords(Number(req.params.carId)));
});

router.post("/cars/:carId/records", upload.single("attachment"), (req, res) => {
  const { date, mileage, shop, description, cost, notes, tags } = req.body;
  if (!date || !mileage || !description) {
    return res.status(400).json({ error: "date, mileage, description are required" });
  }
  const attachment = req.file ? `/uploads/${req.file.filename}` : undefined;
  const parsedTags: string[] = tags
    ? (Array.isArray(tags) ? tags : JSON.parse(tags))
    : [];
  const record = createRecord({
    car_id: Number(req.params.carId),
    date,
    mileage: Number(mileage),
    shop: shop || undefined,
    description,
    cost: cost ? Number(cost) : undefined,
    notes: notes || undefined,
    attachment,
    tags: parsedTags,
  });
  res.status(201).json(record);
});

router.get("/cars/:carId/records/:id", (req, res) => {
  const record = getRecord(Number(req.params.id));
  if (!record) return res.status(404).json({ error: "not found" });
  res.json(record);
});

router.put("/cars/:carId/records/:id", upload.single("attachment"), (req, res) => {
  const { date, mileage, shop, description, cost, notes, tags } = req.body;
  const attachment = req.file ? `/uploads/${req.file.filename}` : undefined;
  const parsedTags: string[] | undefined = tags
    ? (Array.isArray(tags) ? tags : JSON.parse(tags))
    : undefined;
  const record = updateRecord(Number(req.params.id), {
    date,
    mileage: mileage ? Number(mileage) : undefined,
    shop: shop || undefined,
    description,
    cost: cost ? Number(cost) : undefined,
    notes: notes || undefined,
    ...(attachment ? { attachment } : {}),
    tags: parsedTags,
  });
  if (!record) return res.status(404).json({ error: "not found" });
  res.json(record);
});

router.delete("/cars/:carId/records/:id", (req, res) => {
  deleteRecord(Number(req.params.id));
  res.status(204).end();
});

// ── Oil changes ────────────────────────────────────────────────────────────

router.get("/cars/:carId/oil-changes", (req, res) => {
  res.json(getOilChanges(Number(req.params.carId)));
});

// ── Components ─────────────────────────────────────────────────────────────

router.get("/cars/:carId/components", (req, res) => {
  res.json(getComponents(Number(req.params.carId)));
});

// ── Export ─────────────────────────────────────────────────────────────────

router.get("/cars/:carId/export", (req, res) => {
  const carId = Number(req.params.carId);
  const car = getCar(carId);
  if (!car) return res.status(404).json({ error: "not found" });

  const records = getRecords(carId);

  const wb = XLSX.utils.book_new();

  // Sheet 1: All Records
  const recordRows = records.map((r) => ({
    Date: r.date,
    Mileage: r.mileage,
    Shop: r.shop ?? "",
    Description: r.description,
    "Parts / Components": r.tags.join(", "),
    Cost: r.cost ?? "",
    Notes: r.notes ?? "",
    Attachment: r.attachment ?? "",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recordRows), "All Records");

  // Sheet 2: Oil Changes
  const oilRows = records
    .filter((r) => r.tags.includes("oil change"))
    .map((r) => ({
      Date: r.date,
      Mileage: r.mileage,
      Shop: r.shop ?? "",
      Notes: r.notes ?? "",
      Cost: r.cost ?? "",
    }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(oilRows), "Oil Changes");

  // Sheet 3: Components
  const components = getComponents(carId);
  const compRows = components.map((c) => ({
    Component: c.tag,
    "Last Replaced": c.last_date,
    "Last Mileage": c.last_mileage,
    "Times Replaced": c.times_replaced,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compRows), "Components");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `${car.name.replace(/\s+/g, "_")}_maintenance.xlsx`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buf);
});

// ── File serving ───────────────────────────────────────────────────────────

export function serveUploads(app: any) {
  app.use("/uploads", (req: Request, res: Response) => {
    const filePath = path.join(UPLOADS_DIR, path.basename(req.url));
    if (!fs.existsSync(filePath)) return res.status(404).end();
    res.sendFile(filePath);
  });
}

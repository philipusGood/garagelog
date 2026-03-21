import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { router, serveUploads } from "./routes";
import "./db"; // initialise DB

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const ms = Date.now() - start;
      const t = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
      console.log(`${t} [express] ${req.method} ${req.path} ${res.statusCode} in ${ms}ms`);
    }
  });
  next();
});

// API
app.use("/api", router);

// Uploaded files
serveUploads(app);

// Static frontend (production)
const distPath = path.resolve(__dirname, "public");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use("/{*path}", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
}

const PORT = Number(process.env.PORT ?? 5002);
httpServer.listen(PORT, () => {
  const t = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${t} [express] GarageLog listening on port ${PORT}`);
});

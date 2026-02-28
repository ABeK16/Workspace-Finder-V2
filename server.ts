import * as dotenv from 'dotenv';
dotenv.config();

// A quick console log to verify it actually loaded the .env file
console.log("Maps API Key Loaded:", process.env.GOOGLE_MAPS_API_KEY ? "Yes" : "No");


import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("workspaces.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS saved_places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_place_id TEXT UNIQUE NOT NULL,
    work_rating INTEGER DEFAULT 0,
    wifi_speed_rating INTEGER DEFAULT 0,
    wifi_speed_mbps TEXT,
    has_outlets BOOLEAN DEFAULT 0,
    outlet_rating INTEGER DEFAULT 0,
    noise_level INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_place_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Ensure columns added in later versions exist
const tableInfo = db.prepare("PRAGMA table_info(saved_places)").all() as any[];
const columns = tableInfo.map(c => c.name);

if (!columns.includes('wifi_speed_mbps')) {
  try {
    db.exec("ALTER TABLE saved_places ADD COLUMN wifi_speed_mbps TEXT;");
    console.log("Added wifi_speed_mbps column to saved_places");
  } catch (e) {
    console.error("Failed to add wifi_speed_mbps column:", e);
  }
}

if (!columns.includes('noise_level')) {
  try {
    db.exec("ALTER TABLE saved_places ADD COLUMN noise_level INTEGER DEFAULT 0;");
    console.log("Added noise_level column to saved_places");
  } catch (e) {
    console.error("Failed to add noise_level column:", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/places", (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM saved_places ORDER BY created_at DESC");
      const places = stmt.all();
      res.json(places);
    } catch (error) {
      console.error("Error fetching places:", error);
      res.status(500).json({ error: "Failed to fetch places" });
    }
  });

  app.get("/api/reviews", (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM reviews ORDER BY created_at DESC LIMIT 20");
      const reviews = stmt.all();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching all reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/:placeId", (req, res) => {
    const { placeId } = req.params;
    try {
      const stmt = db.prepare("SELECT * FROM reviews WHERE google_place_id = ? ORDER BY created_at DESC");
      const reviews = stmt.all(placeId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", (req, res) => {
    const { google_place_id, rating, comment } = req.body;
    
    if (!google_place_id || !rating) {
      return res.status(400).json({ error: "google_place_id and rating are required" });
    }

    try {
      const stmt = db.prepare("INSERT INTO reviews (google_place_id, rating, comment) VALUES (?, ?, ?)");
      const info = stmt.run(google_place_id, rating, comment || "");
      
      const getStmt = db.prepare("SELECT * FROM reviews WHERE id = ?");
      const review = getStmt.get(info.lastInsertRowid);
      
      res.json(review);
    } catch (error) {
      console.error("Error saving review:", error);
      res.status(500).json({ error: "Failed to save review" });
    }
  });

  app.post("/api/places", (req, res) => {
    const { 
      google_place_id, 
      work_rating, 
      wifi_speed_rating, 
      wifi_speed_mbps,
      has_outlets, 
      outlet_rating,
      noise_level,
      notes 
    } = req.body;
    
    if (!google_place_id) {
      return res.status(400).json({ error: "google_place_id is required" });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO saved_places (
          google_place_id, 
          work_rating, 
          wifi_speed_rating, 
          wifi_speed_mbps,
          has_outlets, 
          outlet_rating,
          noise_level,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(google_place_id) DO UPDATE SET
          work_rating = excluded.work_rating,
          wifi_speed_rating = excluded.wifi_speed_rating,
          wifi_speed_mbps = excluded.wifi_speed_mbps,
          has_outlets = excluded.has_outlets,
          outlet_rating = excluded.outlet_rating,
          noise_level = excluded.noise_level,
          notes = excluded.notes
      `);
      
        const info = stmt.run(
        google_place_id, 
        work_rating || 0, 
        wifi_speed_rating || 0, 
        wifi_speed_mbps || "",
        has_outlets ? 1 : 0, 
        outlet_rating || 0,
        noise_level || 0,
        notes || ""
      );
      
      // Fetch the updated/inserted record
      const getStmt = db.prepare("SELECT * FROM saved_places WHERE google_place_id = ?");
      const place = getStmt.get(google_place_id);
      
      res.json(place);
    } catch (error) {
      console.error("Error saving place:", error);
      res.status(500).json({ error: "Failed to save place" });
    }
  });

  app.delete("/api/places/:id", (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare("DELETE FROM saved_places WHERE id = ?");
      const info = stmt.run(id);
      if (info.changes > 0) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Place not found" });
      }
    } catch (error) {
      console.error("Error deleting place:", error);
      res.status(500).json({ error: "Failed to delete place" });
    }
  });
  
  // Endpoint to get Google Maps API Key safely (if needed by client, though usually injected via env)
  app.get("/api/config", (req, res) => {
    res.json({
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ""
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

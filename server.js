const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/**
 * 🔥 DATABASE (Render + Local uyumlu)
 */
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/miniroute",
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,
});

/**
 * ✅ HEALTH CHECK
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "MiniRoute Backend",
  });
});

/**
 * 📍 LOCATION INSERT (STABLE)
 */
app.post("/api/location", async (req, res) => {
  const { driver_id, latitude, longitude, speed } = req.body;

  if (driver_id == null || latitude == null || longitude == null) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    console.log("📡 LOCATION:", {
      driver_id,
      latitude,
      longitude,
      speed,
    });

    await pool.query(
      "INSERT INTO locations(driver_id, latitude, longitude, speed) VALUES($1,$2,$3,$4)",
      [driver_id, latitude, longitude, speed || 0]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ DB ERROR:", err);

    res.status(500).json({
      error: "Database error",
    });
  }
});

/**
 * 🚗 VEHICLES ENDPOINT (ANDROID CRASH FIX)
 */
app.get("/api/vehicles", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        driver_id AS id,
        latitude AS lat,
        longitude AS lng,
        speed,
        created_at
      FROM locations
      ORDER BY created_at DESC
      LIMIT 50
    `);

    // 🔥 ANDROID UYUMLU FORMAT
    res.json({
      vehicles: result.rows
    });

  } catch (err) {
    console.error("VEHICLES ERROR:", err);

    // 🔥 fallback da aynı format
    res.json({
      vehicles: []
    });
  }
});

/**
 * 🚀 ROOT TEST
 */
app.get("/", (req, res) => {
  res.send("MiniRoute Backend is running 🚀");
});

/**
 * 🔥 PORT
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 MiniRoute server running on port " + PORT);
});
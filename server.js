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
 * 🔥 DB INIT (AUTO TABLE CREATE)
 */
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        speed DOUBLE PRECISION,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Database ready");
  } catch (err) {
    console.error("❌ DB INIT ERROR:", err);
  }
}

initDatabase();

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
 * 🔐 DRIVER REGISTER / VERIFY (AUTO FIX)
 */
app.post("/api/driver-login", async (req, res) => {
  const { driver_id } = req.body;

  if (!driver_id) {
    return res.status(400).json({
      error: "driver_id required",
    });
  }

  try {
    // 🔥 yoksa oluştur
    await pool.query(
      "INSERT INTO drivers (id) VALUES ($1) ON CONFLICT DO NOTHING",
      [driver_id]
    );

    res.json({
      success: true,
      driver_id,
    });
  } catch (err) {
    console.error("❌ DRIVER LOGIN ERROR:", err);

    res.status(500).json({
      error: "Database error",
    });
  }
});

/**
 * 📍 LOCATION INSERT (AUTO DRIVER FIX)
 */
app.post("/api/location", async (req, res) => {
  const { driver_id, latitude, longitude, speed } = req.body;

  if (driver_id == null || latitude == null || longitude == null) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    // 🔥 DRIVER AUTO CREATE
    await pool.query(
      "INSERT INTO drivers (id) VALUES ($1) ON CONFLICT DO NOTHING",
      [driver_id]
    );

    console.log("📡 LOCATION:", {
      driver_id,
      latitude,
      longitude,
      speed,
    });

    await pool.query(
      `INSERT INTO locations(driver_id, latitude, longitude, speed)
       VALUES($1,$2,$3,$4)`,
      [driver_id, latitude, longitude, speed || 0]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ LOCATION ERROR:", err);

    res.status(500).json({
      error: "Database error",
    });
  }
});

/**
 * 🚗 VEHICLES ENDPOINT (ANDROID FULL COMPATIBLE)
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

    res.json({
      vehicles: result.rows,
    });
  } catch (err) {
    console.error("❌ VEHICLES ERROR:", err);

    res.json({
      vehicles: [],
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

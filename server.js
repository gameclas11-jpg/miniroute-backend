const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/miniroute",
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,
});

/**
 * 🔥 DB INIT
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
 * HEALTH
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "MiniRoute Backend",
  });
});

/**
 * 🔐 DRIVER LOGIN (DOUBLE ENDPOINT FIX)
 */
const driverLoginHandler = async (req, res) => {
  const { driver_id } = req.body;

  if (!driver_id) {
    return res.status(400).json({
      success: false,
      message: "driver_id required",
    });
  }

  try {
    await pool.query(
      "INSERT INTO drivers (id) VALUES ($1) ON CONFLICT DO NOTHING",
      [driver_id]
    );

    return res.json({
      success: true,
      driver_id,
    });
  } catch (err) {
    console.error("❌ DRIVER LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Database error",
    });
  }
};

// 🔥 HER İKİSİ DE ÇALIŞIR
app.post("/api/driver-login", driverLoginHandler);
app.post("/api/driver/login", driverLoginHandler);

/**
 * 📍 LOCATION
 */
app.post("/api/location", async (req, res) => {
  const { driver_id, latitude, longitude, speed } = req.body;

  if (driver_id == null || latitude == null || longitude == null) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    await pool.query(
      "INSERT INTO drivers (id) VALUES ($1) ON CONFLICT DO NOTHING",
      [driver_id]
    );

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
 * 🚗 VEHICLES
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
 * ROOT
 */
app.get("/", (req, res) => {
  res.send("MiniRoute Backend is running 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on " + PORT);
});

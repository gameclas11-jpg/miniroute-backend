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
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/miniroute",
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,
});

/**
 * ✅ HEALTH CHECK (STANDARD)
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "MiniRoute Backend",
  });
});

/**
 * 📍 LOCATION INSERT
 */
app.post("/api/location", async (req, res) => {
  const { driver_id, latitude, longitude, speed } = req.body;

  if (!driver_id || !latitude || !longitude) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    await pool.query(
      "INSERT INTO locations(driver_id, latitude, longitude, speed) VALUES($1,$2,$3,$4)",
      [driver_id, latitude, longitude, speed || 0]
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({
      error: "Database error",
    });
  }
});

/**
 * 🚀 ROOT TEST (opsiyonel ama çok faydalı)
 */
app.get("/", (req, res) => {
  res.send("MiniRoute Backend is running 🚀");
});

/**
 * 🔥 PORT (Render zorunlu)
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("MiniRoute server running on port " + PORT);
});
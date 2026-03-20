const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "miniroute",
  password: "postgres",
  port: 5432,
});

app.get("/health", async (req, res) => {
  res.json({ status: "MiniRoute API running" });
});

app.post("/location", async (req, res) => {
  const { driver_id, latitude, longitude, speed } = req.body;

  try {
    await pool.query(
      "INSERT INTO locations(driver_id, latitude, longitude, speed) VALUES($1,$2,$3,$4)",
      [driver_id, latitude, longitude, speed]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

/**
 * 🔥 VPS / Render uyumlu PORT yönetimi
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("MiniRoute server running on port " + PORT);
});
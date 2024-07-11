// app.mjs
import express from "express";
import Database from "better-sqlite3"; // Import better-sqlite3
import moment from "moment-timezone";
import cors from "cors";

console.log('Initializing server...')

const app = express();
const port = 5001;
const serverTimeZone = "Europe/Brussels"; // Replace with your desired time zone
moment.tz.setDefault(serverTimeZone);

// Open SQLite database (create one if it doesn't exist)
const db = new Database("mydatabase.db");

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS climate_sensor_1 (
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature INT,
    humidity INT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS climate_sensor_2 (
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature INT,
    humidity INT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS climate_sensor_3 (
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature INT,
    humidity INT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS aggregated_data (
    date TEXT PRIMARY KEY,
    temperature REAL,
    humidity REAL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS ejaculation_data (
    date DATE PRIMARY KEY,
    count INT DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS masturbation_data (
    date DATE PRIMARY KEY,
    count INT DEFAULT 0
  )
`);

app.use(cors());
app.get("/", (req, res) => {
  res.send("Hello, this is your Express app using ESM!");
});

// Express endpoint to delete all records from the 'ejaculation_data' table
app.get("/delete", (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM ejaculation_data");
    stmt.run();
    console.log("All records deleted from the 'ejaculation_data' table.");
    res.status(200).json({
      success: true,
      message: "All records deleted from the 'ejaculation_data' table.",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error deleting records from the database.",
    });
  }
});

// GET endpoint to add a record to 'climate_sensor_1' and update 'aggregated_data'
app.get("/climate/:temperature/:humidity", (req, res) => {
  const { temperature, humidity } = req.params;
  const timestamp = new Date().toISOString();
  console.log(
    "Datapoint received: Temperature: " + temperature + " Humidity: " + humidity
  );

  try {
    // Insert data into 'climate_sensor_1' table
    const insertStmt = db.prepare(
      "INSERT INTO climate_sensor_1 (temperature, humidity, timestamp) VALUES (?, ?, ?)"
    );
    insertStmt.run(temperature, humidity, timestamp);
    console.log("Data inserted into 'climate_sensor_1' table.");

    const dateOnly = timestamp.split("T")[0];

    // Calculate the daily average temperature and humidity
    const avgRow = db.prepare(
      "SELECT AVG(temperature) AS avg_temperature, AVG(humidity) AS avg_humidity FROM climate_sensor_1 WHERE date(timestamp) = ?"
    ).get(dateOnly);

    const avgTemperature = avgRow.avg_temperature || 0;
    const avgHumidity = avgRow.avg_humidity || 0;

    // Update or insert into 'aggregated_data' table
    const replaceStmt = db.prepare(
      "REPLACE INTO aggregated_data (temperature, humidity, date) VALUES (?, ?, ?)"
    );
    replaceStmt.run(avgTemperature, avgHumidity, dateOnly);
    console.log("Aggregated data updated in 'aggregated_data' table.");

    res.status(200).json({
      success: true,
      message: "Data written to the database.",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error writing to the database.",
    });
  }
});

// Express endpoint to add a record to 'climate_sensor_2'
app.get("/climate_sensor_2/:temperature/:humidity", (req, res) => {
  const { temperature, humidity } = req.params;
  const timestamp = new Date().toISOString();
  console.log(
    "Datapoint received (2): Temperature: " + temperature + " Humidity: " + humidity
  );

  try {
    // Insert data into 'climate_sensor_2' table
    const insertStmt = db.prepare(
      "INSERT INTO climate_sensor_2 (temperature, humidity, timestamp) VALUES (?, ?, ?)"
    );
    insertStmt.run(temperature, humidity, timestamp);
    console.log("Data inserted into 'climate_sensor_2' table.");

    res.status(200).json({ success: true, message: 'Datapoint received' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error writing to the database.",
    });
  }
});

// Express endpoint to add a record to 'climate_sensor_3'
app.get("/climate_sensor_3_pico/:temperature/:humidity", (req, res) => {
  const { temperature, humidity } = req.params;
  const timestamp = new Date().toISOString();
  console.log(
    "Datapoint received (3 <pico>): Temperature: " + temperature + " Humidity: " + humidity
  );

  try {
    // Insert data into 'climate_sensor_3' table
    const insertStmt = db.prepare(
      "INSERT INTO climate_sensor_3 (temperature, humidity, timestamp) VALUES (?, ?, ?)"
    );
    insertStmt.run(temperature, humidity, timestamp);
    console.log("Data inserted into 'climate_sensor_3' table.");

    res.status(200).json({ success: true, message: 'Datapoint received' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error writing to the database.",
    });
  }
});

// GET endpoint to retrieve all entries from 'climate_sensor_1' filtered by conditions
app.get("/all", (req, res) => {
  console.log("Fetching all entries from 'climate_sensor_1' table.");

  db.transaction(() => {
    const rows = db.prepare("SELECT * FROM climate_sensor_1 ORDER BY timestamp DESC").all();
    const filtered = rows.filter((row) => row.temperature > 0 && row.humidity < 150);
    res.status(200).json({ success: true, data: filtered });
  })();
});

// GET endpoint to retrieve aggregated data for all days
app.get("/aggregated/all", (req, res) => {
  console.log("Fetching aggregated data for all days.");

  db.transaction(() => {
    const rows = db.prepare(
      "SELECT date(timestamp) AS date, AVG(temperature) AS avg_temperature, AVG(humidity) AS avg_humidity FROM climate_sensor_1 GROUP BY date"
    ).all();
    const formattedData = rows.map((row) => ({
      temperature: row.avg_temperature || 0,
      humidity: row.avg_humidity || 0,
      timestamp: `${row.date}T00:00:00.000Z`,
    }));
    res.status(200).json({ success: true, data: formattedData });
  })();
});

// GET endpoint to update the count of ejaculations for the current day
app.get("/updateEjaculationCount", (req, res) => {
  console.log("Updating ejaculation count for the current day.");
  const currentDate = new Date().toISOString().split("T")[0]; // Get the current date without the time component

  try {
    db.transaction(() => {
      // Check if a record exists for the current date in 'ejaculation_data'
      const row = db.prepare("SELECT * FROM ejaculation_data WHERE date = ?").get(currentDate);

      if (row) {
        // If a record exists for the day, update the count
        const newCount = row.count + 1;
        db.prepare("UPDATE ejaculation_data SET count = ? WHERE date = ?").run(newCount, currentDate);
      } else {
        // If no record exists for the day, insert a new record
        db.prepare("INSERT INTO ejaculation_data (date, count) VALUES (?, 1)").run(currentDate);
      }

      res.status(200).json({ success: true, message: "Ejaculation count updated." });
    })();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error updating ejaculation count.",
    });
  }
});

// GET endpoint to retrieve all ejaculation data
app.get("/allEjaculationData", (req, res) => {
  console.log("Fetching all ejaculation data.");

  try {
    const rows = db.prepare("SELECT * FROM ejaculation_data ORDER BY date DESC").all();
    const formattedData = rows.map((row) => ({
      date: new Date(row.date).toString(),
      count: row.count,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.status(200).json({ success: true, data: formattedData });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
     message: "Error fetching ejaculation data.",
    });
  }
});

// GET endpoint to update the count of masturbation for the current day
app.get("/updateMasturbationCount", (req, res) => {
  console.log("Updating masturbation count for the current day.");
  const currentDate = new Date().toISOString().split("T")[0]; // Get the current date without the time component

  try {
    db.transaction(() => {
      // Check if a record exists for the current date in 'masturbation_data'
      const row = db.prepare("SELECT * FROM masturbation_data WHERE date = ?").get(currentDate);

      if (row) {
        // If a record exists for the day, update the count
        const newCount = row.count + 1;
        db.prepare("UPDATE masturbation_data SET count = ? WHERE date = ?").run(newCount, currentDate);
      } else {
        // If no record exists for the day, insert a new record
        db.prepare("INSERT INTO masturbation_data (date, count) VALUES (?, 1)").run(currentDate);
      }

      res.status(200).json({ success: true, message: "Masturbation count updated." });
    })();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error updating masturbation count.",
    });
  }
});

// GET endpoint to retrieve all masturbation data
app.get("/allMasturbationData", (req, res) => {
  console.log("Fetching all masturbation data.");

  try {
    const rows = db.prepare("SELECT * FROM masturbation_data ORDER BY date DESC").all();
    const formattedData = rows.map((row) => ({
      date: new Date(row.date).toString(),
      count: row.count,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.status(200).json({ success: true, data: formattedData });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error fetching masturbation data.",
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

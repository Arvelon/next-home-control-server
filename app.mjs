// app.mjs
import express from "express";
import sqlite3 from "better-sqlite3"; // Using better-sqlite3 for improved SQLite handling
import moment from "moment-timezone";
import cors from "cors";
import { subMinutes } from "date-fns";

console.log("Initializing server...");

const app = express();
const port = 5001;
const serverTimeZone = "Europe/Brussels"; // Replace with your desired time zone
moment.tz.setDefault(serverTimeZone);

// Open SQLite database (create one if it doesn't exist)
const db = sqlite3("/usr/src/app/backups/sqlite/v2.db", {
  verbose: console.log,
});

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS climate_sensor_1 (
    timestamp BIGINT,
    temperature INT,
    humidity INT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS climate_sensor_2 (
    timestamp BIGINT,
    temperature INT,
    humidity INT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS climate_sensor_3 (
    timestamp BIGINT,
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

// Express endpoint to delete all records from the 'ejaculation_data' table
app.get("/delete", (req, res) => {
  try {
    db.exec("DELETE FROM ejaculation_data");
    res.status(200).json({
      success: true,
      message: "All records deleted from the database.",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error deleting records from the database.",
    });
  }
});

// Express endpoint to add a record to 'climate_sensor_1' and update 'aggregated_data'
app.get("/climate/:temperature/:humidity", (req, res) => {
  const { temperature, humidity } = req.params;
  const timestamp = new Date().getTime();
  console.log(
    `Datapoint received: Temperature: ${temperature}, Humidity: ${humidity}`
  );

  try {
    db.prepare(
      "INSERT INTO climate_sensor_1 (temperature, humidity, timestamp) VALUES (?, ?, ?)"
    ).run(temperature, humidity, timestamp);

    const dateOnly = new Date(timestamp).split("T")[0];

    // Calculate the daily average temperature and humidity
    const { avg_temperature, avg_humidity } = db
      .prepare(
        "SELECT AVG(temperature) AS avg_temperature, AVG(humidity) AS avg_humidity FROM climate_sensor_1 WHERE date(timestamp) = ?"
      )
      .get(dateOnly);

    const avgTemperature = avg_temperature || 0;
    const avgHumidity = avg_humidity || 0;

    // Update or insert into 'aggregated_data' table
    db.prepare(
      "REPLACE INTO aggregated_data (temperature, humidity, date) VALUES (?, ?, ?)"
    ).run(avgTemperature, avgHumidity, dateOnly);

    res
      .status(200)
      .json({ success: true, message: "Data written to the database." });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ success: false, message: "Error writing to the database." });
  }
});

// Express endpoint to add a record to 'climate_sensor_2'
app.get("/climate_sensor_2/:temperature/:humidity", (req, res) => {
  const { temperature, humidity } = req.params;
  const timestamp = new Date().getTime();
  console.log(
    `Datapoint received (2): Temperature: ${temperature}, Humidity: ${humidity}`
  );

  try {
    db.prepare(
      "INSERT INTO climate_sensor_2 (temperature, humidity, timestamp) VALUES (?, ?, ?)"
    ).run(temperature, humidity, timestamp);

    res.status(200).json({ success: true, message: "Datapoint received" });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ success: false, message: "Error writing to the database." });
  }
});

// Express endpoint to add a record to 'climate_sensor_3'
app.get("/climate_sensor_3_pico/:temperature/:humidity", (req, res) => {
  const { temperature, humidity } = req.params;
  const timestamp = new Date().getTime();
  console.log(
    `Datapoint received (3 <pico>): Temperature: ${temperature}, Humidity: ${humidity}`
  );

  try {
    db.prepare(
      "INSERT INTO climate_sensor_3 (temperature, humidity, timestamp) VALUES (?, ?, ?)"
    ).run(temperature, humidity, timestamp);

    res.status(200).json({ success: true, message: "Datapoint received" });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ success: false, message: "Error writing to the database." });
  }
});

// Dynamic injection endpoint
app.get("/dynamic-injection/:device/:temperature/:humidity", (req, res) => {
  const { temperature, humidity, device } = req.params;
  const timestamp = new Date().getTime();
  console.log(
    `Datapoint received (${device}): Temperature: ${temperature}, Humidity: ${humidity}`
  );

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${device} (
        timestamp BIGINT,
        temperature INT,
        humidity INT
      )
    `);
    db.prepare(
      "INSERT INTO " +
        device +
        " (temperature, humidity, timestamp) VALUES (?, ?, ?)"
    ).run(temperature, humidity, timestamp);

    res.status(200).json({ success: true, message: "Datapoint received" });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ success: false, message: "Error writing to the database." });
  }
});

// Express endpoint to retrieve all entries from 'climate_sensor_1'
app.get("/allSensor1Entries", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM climate_sensor_1 ORDER BY timestamp DESC")
      .all();
    const filtered = rows.filter(
      (row) => row.temperature > 0 && row.humidity < 150
    );
    res.status(200).json({ success: true, data: filtered });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error reading from the database (sensor 1).",
    });
  }
});

// Express endpoint to retrieve all entries from 'climate_sensor_2'
app.get("/allSensor2Entries", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM climate_sensor_2 ORDER BY timestamp DESC")
      .all();
    const filtered = rows.filter(
      (row) => row.temperature > 0 && row.humidity < 150
    );
    res.status(200).json({ success: true, data: filtered });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error reading from the database (sensor 2).",
    });
  }
});

// Express endpoint to retrieve all entries from 'climate_sensor_3'
app.get("/allSensor3Entries", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM climate_sensor_3 ORDER BY timestamp DESC")
      .all();
    const filtered = rows.filter(
      (row) => row.temperature > 0 && row.humidity < 150
    );
    res.status(200).json({ success: true, data: filtered });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Error reading from the database (sensor 3).",
    });
  }
});

// Express endpoint to retrieve aggregated data for all days
app.get("/aggregated/all", (req, res) => {
  try {
    const rows = db
      .prepare(
        "SELECT date(timestamp) AS date, AVG(temperature) AS avg_temperature, AVG(humidity) AS avg_humidity FROM climate_sensor_1 GROUP BY date"
      )
      .all();
    const formattedData = rows.map((row) => ({
      temperature: row.avg_temperature || 0,
      humidity: row.avg_humidity || 0,
      timestamp: `${row.date}T00:00:00.000Z`,
    }));
    res.status(200).json({ success: true, data: formattedData });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ success: false, message: "Error reading from the database." });
  }
});

// Express endpoint to update the count of ejaculations for the current day
app.get("/updateEjaculationCount", (req, res) => {
  const currentDate = new Date().toISOString().split("T")[0]; // Get the current date without the time component

  try {
    const row = db
      .prepare("SELECT * FROM ejaculation_data WHERE date = ?")
      .get(currentDate);

    if (row) {
      const newCount = row.count + 1;
      db.prepare("UPDATE ejaculation_data SET count = ? WHERE date = ?").run(
        newCount,
        currentDate
      );
    } else {
      db.prepare(
        "INSERT INTO ejaculation_data (date, count) VALUES (?, 1)"
      ).run(currentDate);
    }

    res
      .status(200)
      .json({ success: true, message: "Ejaculation count updated." });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ success: false, message: "Error updating ejaculation count." });
  }
});

// Express endpoint to retrieve all ejaculation data
app.get("/allEjaculationData", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM ejaculation_data ORDER BY date DESC")
      .all();
    const formattedData = rows.map((row) => ({
      date: new Date(row.date).toString(),
      count: row.count,
    }));
    formattedData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    res
      .status(200)
      .json({ success: true, data: fillMissingDays(formattedData) });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ success: false, message: "Error reading from the database." });
  }
});

// Express endpoint to retrieve custom-sized entries from all sensors
app.get("/n/:stackSize", (req, res) => {
  const { stackSize } = req.params;

  if (isNaN(stackSize) || stackSize <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid :stackSize parameter." });
  }

  try {
    const sensor1Entries = db
      .prepare(
        `SELECT * FROM climate_sensor_1 ORDER BY timestamp DESC LIMIT ${stackSize}`
      )
      .all();
    const sensor2Entries = db
      .prepare(
        `SELECT * FROM climate_sensor_2 ORDER BY timestamp DESC LIMIT ${stackSize}`
      )
      .all();
    const sensor3Entries = db
      .prepare(
        `SELECT * FROM climate_sensor_3 ORDER BY timestamp DESC LIMIT ${stackSize}`
      )
      .all();

    const filteredSensor1 = filterAndProcessData(sensor1Entries);
    const filteredSensor2 = filterAndProcessData(sensor2Entries);
    const filteredSensor3 = filterAndProcessData(sensor3Entries);

    res.status(200).json({
      success: true,
      data: {
        sensor1: filteredSensor1,
        sensor2: filteredSensor2,
        sensor3: filteredSensor3,
      },
    });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ success: false, message: "Error reading from the database." });
  }
});

// Express endpoint to retrieve records since a provided UNIX timestamp from all sensors
// Express endpoint to retrieve records since a provided UNIX timestamp from all sensors
app.get("/ago/:minutesAgo", (req, res) => {
  const { minutesAgo } = req.params;

  // Validate sinceTimestamp as a valid UNIX timestamp (assuming it's in seconds)
  if (isNaN(minutesAgo) || minutesAgo <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid :minutesAgo parameter." });
  }

  try {
    const sinceDate = subMinutes(new Date(), parseInt(minutesAgo)).getTime();
    console.log(new Date().getTime());
    console.log(sinceDate);
    // Query to fetch records since the provided timestamp for each sensor table
    const sensor1Entries = db
      .prepare(
        `SELECT * FROM climate_sensor_1 WHERE timestamp >= ? ORDER BY timestamp DESC`
      )
      .all(sinceDate);
    const sensor2Entries = db
      .prepare(
        `SELECT * FROM climate_sensor_2 WHERE timestamp >= ? ORDER BY timestamp DESC`
      )
      .all(sinceDate);
    const sensor3Entries = db
      .prepare(
        `SELECT * FROM climate_sensor_3 WHERE timestamp >= ? ORDER BY timestamp DESC`
      )
      .all(sinceDate);

    // Process and filter data
    const filteredSensor1 = filterAndProcessData(sensor1Entries);
    const filteredSensor2 = filterAndProcessData(sensor2Entries);
    const filteredSensor3 = filterAndProcessData(sensor3Entries);
    console.log(
      sensor1Entries.length,
      sensor2Entries.length,
      sensor3Entries.length
    );

    console.log(
      filteredSensor1.length,
      filteredSensor2.length,
      filteredSensor3.length
    );
    // Paginate results if necessary
    const maxResults = 1440; // Define a max number of results to return
    const resultData = {
      sensor1: filteredSensor1.slice(0, maxResults),
      sensor2: filteredSensor2.slice(0, maxResults),
      sensor3: filteredSensor3.slice(0, maxResults),
    };

    // Respond with the filtered data
    res.status(200).json({
      success: true,
      data: resultData,
    });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ success: false, message: "Error reading from the database." });
  }
});

app.get("/stream/:namespace/:minutesAgo", (req, res) => {
  const { minutesAgo, namespace } = req.params;

  // Validate sinceTimestamp as a valid UNIX timestamp (assuming it's in seconds)
  if (isNaN(minutesAgo) || minutesAgo <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid :minutesAgo parameter." });
  }

  try {
    const sinceDate = subMinutes(new Date(), parseInt(minutesAgo)).getTime();
    // Query to fetch records since the provided timestamp for each sensor table
    const entries = db
      .prepare(
        `SELECT * FROM ${namespace} WHERE timestamp >= ? ORDER BY timestamp DESC`
      )
      .all(sinceDate);

    // Process and filter data
    const filteredEntries = filterAndProcessData(entries);
    console.log(entries.length);

    // Paginate results if necessary
    const maxResults = 1440; // Define a max number of results to return
    const resultData = filteredEntries.slice(0, maxResults);

    // Respond with the filtered data
    res.status(200).json({
      success: true,
      data: resultData,
    });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ success: false, message: "Error reading from the database." });
  }
});

// Function to filter and process data (assumed to be defined elsewhere)
function filterAndProcessData(data) {
  return data.filter((entry, index, array) => {
    if (index === 0) {
      // Keep the first entry
      return true;
    } else {
      // Check temperature deviation from the previous entry
      const prevTemperature = array[index - 1].temperature;
      const temperatureDeviation = Math.abs(
        entry.temperature - prevTemperature
      );

      // Check humidity deviation from the previous entry
      const prevHumidity = array[index - 1].humidity;
      const humidityDeviation = Math.abs(entry.humidity - prevHumidity);

      // Check if temperature deviation OR humidity deviation exceeds the thresholds
      return temperatureDeviation <= 6 && humidityDeviation <= 60;
    }
  });
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

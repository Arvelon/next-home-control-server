// app.mjs
import express from "express";
import sqlite3 from "sqlite3";
import moment from "moment-timezone";
import cors from "cors";

const app = express();
const port = 5001;
const serverTimeZone = "Europe/Brussels"; // Replace with your desired time zone
moment.tz.setDefault(serverTimeZone);

// Open SQLite database (create one if it doesn't exist)
const db = new sqlite3.Database("mydatabase.db");

// Create tables if they don't exist
db.serialize(() => {
  // Create 'climate' table
  db.run(`
      CREATE TABLE IF NOT EXISTS climate (
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        temperature INT,
        humidity INT
      )
    `);

  // Create 'aggregated_data' table
  db.run(`
  CREATE TABLE IF NOT EXISTS aggregated_data (
    date TEXT PRIMARY KEY,
    temperature REAL,
    humidity REAL
  )
    `);

  // Create 'ejaculation_data' table
db.run(`
CREATE TABLE IF NOT EXISTS ejaculation_data (
  date DATE PRIMARY KEY,
  count INT DEFAULT 0
)
`);
// Create 'ejaculation_data' table
db.run(`
CREATE TABLE IF NOT EXISTS masturbation_data (
  date DATE PRIMARY KEY,
  count INT DEFAULT 0
)
`);

});

app.use(cors());
app.get("/", (req, res) => {
  res.send("Hello, this is your Express app using ESM!");
});

// Express endpoint to delete all records from the 'climate' table
app.get("/delete", (req, res) => {
  db.run("DELETE FROM ejaculation_data", function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({
        success: false,
        message: "Error deleting records from the database.",
      });
    } else {
      res.status(200).json({
        success: true,
        message: "All records deleted from the database.",
      });
    }
  });
});

// GET endpoint to add a record to 'climate' and update 'aggregated_data'
app.get("/climate/:temperature/:humidity", (req, res) => {
    const { temperature, humidity } = req.params;
    const timestamp = new Date().toISOString();
    console.log("Datapoint received: Temperature: " + temperature + " Humidity: " + humidity);
  
    // Insert data into 'climate' table
    db.run(
      "INSERT INTO climate (temperature, humidity, timestamp) VALUES (?, ?, ?)",
      [temperature, humidity, timestamp],
      (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ success: false, message: "Error writing to the database." });
        }
  
        const dateOnly = timestamp.split("T")[0];
  
        // Calculate the daily average temperature and humidity
        db.get(
          "SELECT AVG(temperature) AS avg_temperature, AVG(humidity) AS avg_humidity FROM climate WHERE date(timestamp) = ?",
          [dateOnly],
          (err, row) => {
            if (err) {
              console.error(err.message);
              return res.status(500).json({ success: false, message: "Error calculating daily averages." });
            }
  
            const avgTemperature = row.avg_temperature || 0;
            const avgHumidity = row.avg_humidity || 0;
  
            // Update or insert into 'aggregated_data' table
            db.run(
              "REPLACE INTO aggregated_data (temperature, humidity, date) VALUES (?, ?, ?)",
              [avgTemperature, avgHumidity, dateOnly],
              (err) => {
                if (err) {
                  console.error(err.message);
                  return res.status(500).json({ success: false, message: "Error writing to aggregated data." });
                }
  
                res.status(200).json({ success: true, message: "Data written to the database." });
              }
            );
          }
        );
      }
    );
  });
  
  

// GET endpoint to retrieve all entries
app.get("/all", (req, res) => {
  db.all("SELECT * FROM climate ORDER BY timestamp DESC", (err, rows) => {
    if (err) {
      console.error(err.message);
      res
        .status(500)
        .json({ success: false, message: "Error reading from the database." });
    } else {
      const filtered = rows.filter(
        (row) => row.temperature > 0 && row.humidity < 150
      );
      res.status(200).json({ success: true, data: filtered });
    }
  });
});

// GET endpoint to retrieve aggregated data
app.get("/aggregated/all", (req, res) => {
  console.log("Aggregated data fetched");
  db.all("SELECT * FROM aggregated_data ORDER BY date DESC", (err, rows) => {
    if (err) {
      console.error(err.message);
      res
        .status(500)
        .json({ success: false, message: "Error reading from the database." });
    } else {
      const formattedData = rows.map((row) => ({
        temperature: row.temperature,
        humidity: row.humidity,
        timestamp: `${row.date}T00:00:00.000Z`, // Assuming date is in the format 'YYYY-MM-DD'
      }));

      res.status(200).json({ success: true, data: formattedData });
    }
  });
});
// GET endpoint to update the count of ejaculations for the current day
app.get("/updateEjaculationCount", (req, res) => {
    console.log('added c')
  const currentDate = new Date().toISOString().split("T")[0]; // Get the current date without the time component

  // Check if a record exists for the current date in 'ejaculation_data'
  db.get(
    "SELECT * FROM ejaculation_data WHERE date = ?",
    [currentDate],
    (err, row) => {
      if (err) {
        console.error(err.message);
        return res
          .status(500)
          .json({ success: false, message: "Error querying the database." });
      }

      if (row) {
        console.log(row);
        // If a record exists for the day, update the count
        const newCount = row.count + 1;
        db.run(
          "UPDATE ejaculation_data SET count = ? WHERE date = ?",
          [newCount, currentDate],
          (err) => {
            if (err) {
              console.error(err.message);
              return res.status(500).json({
                success: false,
                message: "Error updating ejaculation count.",
              });
            }

            res
              .status(200)
              .json({ success: true, message: "Ejaculation count updated." });
          }
        );
      } else {
        // If no record exists for the day, insert a new record
        db.run(
          "INSERT INTO ejaculation_data (date, count) VALUES (?, 1)",
          [currentDate],
          (err) => {
            if (err) {
              console.error(err.message);
              return res.status(500).json({
                success: false,
                message: "Error inserting ejaculation data.",
              });
            }

            res
              .status(200)
              .json({ success: true, message: "Ejaculation count updated." });
          }
        );
      }
    }
  );
});
// GET endpoint to retrieve all ejaculation data
app.get("/allEjaculationData", (req, res) => {
  db.all("SELECT * FROM ejaculation_data ORDER BY date DESC", (err, rows) => {
    if (err) {
      console.error(err.message);
      res
        .status(500)
        .json({ success: false, message: "Error reading from the database." });
    } else {
        rows.map((row) => console.log(new Date(row.date)))
      const formattedData = rows.map((row) => ({
        date: new Date(row.date).toString(),
        count: row.count,
      }));
      console.log(formattedData)

      res.status(200).json({ success: true, data: formattedData });
    }
  });
});


app.get("/n/:stackSize", (req, res) => {
  console.log("Custom size fetched: ", req.params.stackSize);
  const stackSize = parseInt(req.params.stackSize, 10); // Parse the stackSize as an integer

  if (isNaN(stackSize) || stackSize <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid :stackSize parameter." });
  }

  db.all(
    `SELECT * FROM climate ORDER BY timestamp DESC LIMIT ${stackSize}`,
    (err, rows) => {
      if (err) {
        console.error(err.message);
        res.status(500).json({
          success: false,
          message: "Error reading from the database.",
        });
      } else {
        const filtered = rows.filter(
          (row) => row.temperature > 0 && row.humidity < 150
        );
        res.status(200).json({ success: true, data: filtered });
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

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

    // Create 'climate_sensor_2' table
  db.run(`
  CREATE TABLE IF NOT EXISTS climate_sensor_2 (
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
  console.log(
    "Datapoint received: Temperature: " + temperature + " Humidity: " + humidity
  );

  // Insert data into 'climate' table
  db.run(
    "INSERT INTO climate (temperature, humidity, timestamp) VALUES (?, ?, ?)",
    [temperature, humidity, timestamp],
    (err) => {
      if (err) {
        console.error(err.message);
        return res
          .status(500)
          .json({ success: false, message: "Error writing to the database." });
      }

      const dateOnly = timestamp.split("T")[0];

      // Calculate the daily average temperature and humidity
      db.get(
        "SELECT AVG(temperature) AS avg_temperature, AVG(humidity) AS avg_humidity FROM climate WHERE date(timestamp) = ?",
        [dateOnly],
        (err, row) => {
          if (err) {
            console.error(err.message);
            return res
              .status(500)
              .json({
                success: false,
                message: "Error calculating daily averages.",
              });
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
                return res
                  .status(500)
                  .json({
                    success: false,
                    message: "Error writing to aggregated data.",
                  });
              }

              res
                .status(200)
                .json({
                  success: true,
                  message: "Data written to the database.",
                });
            }
          );
        }
      );
    }
  );
});


// GET endpoint to add a record to 'climate' and update 'aggregated_data'
app.get("/climate_sensor_2/:temperature/:humidity", (req, res) => {
    const { temperature, humidity } = req.params;
    const timestamp = new Date().toISOString();
    console.log(
      "Datapoint received (2): Temperature: " + temperature + " Humidity: " + humidity
    );
  
    // Insert data into 'climate' table
    db.run(
      "INSERT INTO climate_sensor_2 (temperature, humidity, timestamp) VALUES (?, ?, ?)",
      [temperature, humidity, timestamp],
      (err) => {
        if (err) {
          console.error(err.message);
          return res
            .status(500)
            .json({ success: false, message: "Error writing to the database." });
        }
      }
    );

    res.status(200).json({ success: true, message: 'Datapoint received'})
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

// GET endpoint to retrieve all entries from both sensors separately
app.get("/all", (req, res) => {
  console.log("All entries from both sensors fetched separately");

  // Fetch entries from 'climate_sensor_1'
  db.all("SELECT * FROM climate_sensor_1 ORDER BY timestamp DESC", (err, rowsSensor1) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ success: false, message: "Error reading from the database (sensor 1)." });
    }

    // Fetch entries from 'climate_sensor_2'
    db.all("SELECT * FROM climate_sensor_2 ORDER BY timestamp DESC", (err, rowsSensor2) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ success: false, message: "Error reading from the database (sensor 2)." });
      }

      const filteredSensor1 = rowsSensor1.filter((row) => row.temperature > 0 && row.humidity < 150);
      const filteredSensor2 = rowsSensor2.filter((row) => row.temperature > 0 && row.humidity < 150);

      res.status(200).json({
        success: true,
        data: {
          sensor1: filteredSensor1,
          sensor2: filteredSensor2
        }
      });
    });
  });
});


// GET endpoint to retrieve aggregated data for all days
app.get("/aggregated/all", (req, res) => {
  console.log("Aggregated data for all days fetched");

  // Retrieve the average temperature and humidity for all days from 'climate' table
  db.all(
    "SELECT date(timestamp) AS date, AVG(temperature) AS avg_temperature, AVG(humidity) AS avg_humidity FROM climate GROUP BY date",
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return res
          .status(500)
          .json({
            success: false,
            message: "Error reading from the database.",
          });
      }

      // Format the data and respond
      const formattedData = rows.map((row) => ({
        temperature: row.avg_temperature || 0,
        humidity: row.avg_humidity || 0,
        timestamp: `${row.date}T00:00:00.000Z`,
      }));

      res.status(200).json({ success: true, data: formattedData });
    }
  );
});

// GET endpoint to update the count of ejaculations for the current day
app.get("/updateEjaculationCount", (req, res) => {
  console.log("added c");
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
      rows.map((row) => console.log(new Date(row.date)));
      const formattedData = rows.map((row) => ({
        date: new Date(row.date).toString(),
        count: row.count,
      }));
      formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())     
      res.status(200).json({ success: true, data: fillMissingDays(formattedData) });
    }
  });
});

function fillMissingDays(data) {
  const filledData = [...data]; // Copy the existing data
  const lastDate = new Date(data[data.length - 1].date);
  let currentDate = new Date(lastDate);

  // Increment currentDate by one day to start from the day after the last date in the array
  currentDate.setDate(currentDate.getDate() + 1);

  const today = new Date(); // Get today's date

  // Iterate over each day between the last day in the array and today
  while (currentDate <= today) {
    const dateString = currentDate.toString(); // Convert date to string in the original format

    // Check if there's an existing entry for the current date
    const existingEntry = filledData.find(entry => entry.date === dateString);

    // If no entry exists for the current date, add a new entry with count 0
    if (!existingEntry) {
      filledData.push({ date: dateString, count: 0 });
    }

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return filledData;
}




app.get("/n/:stackSize", (req, res) => {
  console.log("Custom size fetched: ", req.params.stackSize);
  const stackSize = parseInt(req.params.stackSize, 10); // Parse the stackSize as an integer

  if (isNaN(stackSize) || stackSize <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid :stackSize parameter." });
  }

  // Fetch entries from 'climate_sensor_1'
  db.all(
    `SELECT * FROM climate ORDER BY timestamp DESC LIMIT ${stackSize}`,
    (err, rowsSensor1) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({
          success: false,
          message: "Error reading from the database (sensor 1).",
        });
      }

      // Fetch entries from 'climate_sensor_2'
      db.all(
        `SELECT * FROM climate_sensor_2 ORDER BY timestamp DESC LIMIT ${stackSize}`,
        (err, rowsSensor2) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({
              success: false,
              message: "Error reading from the database (sensor 2).",
            });
          }

          const filteredSensor1 = rowsSensor1.filter((entry, index, array) => {
            if (index === 0) {
              // Keep the first entry
              return true;
            } else {
              // Check temperature deviation from the previous entry
              const prevTemperature = array[index - 1].temperature;
              const temperatureDeviation = Math.abs(entry.temperature - prevTemperature);
          
              // Check humidity deviation from the previous entry
              const prevHumidity = array[index - 1].humidity;
              const humidityDeviation = Math.abs(entry.humidity - prevHumidity);
          
              // Check if temperature deviation OR humidity deviation exceeds the thresholds
              return temperatureDeviation <= 6 && humidityDeviation <= 60;
            }
          });
          const filteredSensor2 = rowsSensor2.filter((entry, index, array) => {
            if (index === 0) {
              // Keep the first entry
              return true;
            } else {
              // Check temperature deviation from the previous entry
              const prevTemperature = array[index - 1].temperature;
              const temperatureDeviation = Math.abs(entry.temperature - prevTemperature);
          
              // Check humidity deviation from the previous entry
              const prevHumidity = array[index - 1].humidity;
              const humidityDeviation = Math.abs(entry.humidity - prevHumidity);
          
              // Check if temperature deviation OR humidity deviation exceeds the thresholds
              return temperatureDeviation <= 6 && humidityDeviation <= 60;
            }
          });

          res.status(200).json({
            success: true,
            data: {
              sensor1: filteredSensor1,
              sensor2: filteredSensor2
            }
          });
        }
      );
    }
  );
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

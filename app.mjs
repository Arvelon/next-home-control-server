// app.mjs
import express from 'express';
import sqlite3 from 'sqlite3';

const app = express();
const port = 5001;

// Open SQLite database (create one if it doesn't exist)
const db = new sqlite3.Database('mydatabase.db');

// Create a table for climate data if it doesn't exist
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS climate (timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, temperature INT, humidity INT)');
});

app.get('/', (req, res) => {
  res.send('Hello, this is your Express app using ESM!');
});

// GET endpoint for climate with temperature and humidity parameters
app.get('/climate/:temperature/:humidity', (req, res) => {
  const { temperature, humidity } = req.params;

  // Insert data into the climate table (timestamp is auto-generated)
  db.run('INSERT INTO climate (temperature, humidity) VALUES (?, ?)', [temperature, humidity], (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Error writing to the database.' });
    } else {
      res.status(200).json({ success: true, message: 'Data written to the database.' });
    }
  });
});

// GET endpoint to retrieve all entries
app.get('/all', (req, res) => {
    db.all('SELECT * FROM climate ORDER BY timestamp DESC', (err, rows) => {
      if (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Error reading from the database.' });
      } else {
        const filtered = rows.filter(row => row.temperature > 0 && row.humidity < 150)
        res.status(200).json({ success: true, data: filtered });
      }
    });
  });

// GET endpoint to retrieve the last n-entries
app.get('/latest', (req, res) => {
  db.all('SELECT * FROM climate ORDER BY timestamp DESC LIMIT 1440', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Error reading from the database.' });
    } else {
        const filtered = rows.filter(row => row.temperature > 0 && row.humidity < 150)
      res.status(200).json({ success: true, data: filtered });
    }
  });
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


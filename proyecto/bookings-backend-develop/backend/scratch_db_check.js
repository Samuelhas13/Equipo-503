const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

db.serialize(() => {
  console.log('--- ALL BUSINESSES ---');
  db.all("SELECT * FROM business", [], (err, rows) => {
    if (err) console.error(err);
    console.log(rows);
  });

  console.log('--- APPOINTMENT COUNT FOR BUSINESS 501 ---');
  db.all("SELECT COUNT(*) as count FROM appointments WHERE businessId = 501", [], (err, rows) => {
    if (err) console.error(err);
    console.log(rows);
  });

  console.log('--- APPOINTMENTS FOR BUSINESS 501 ---');
  db.all("SELECT * FROM appointments WHERE businessId = 501", [], (err, rows) => {
    if (err) console.error(err);
    console.log(rows);
  });
});

db.close();

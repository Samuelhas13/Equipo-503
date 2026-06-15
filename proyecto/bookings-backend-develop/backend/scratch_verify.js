const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

db.serialize(() => {
  console.log('--- DISTINCT BUSINESS IDS IN APPOINTMENTS ---');
  db.all("SELECT businessId, COUNT(*) as count FROM appointments GROUP BY businessId LIMIT 10", [], (err, rows) => {
    if (err) return console.error(err);
    console.log(rows);
  });

  console.log('--- APPOINTMENTS FOR ONE REAL BUSINESS ---');
  db.get("SELECT businessId FROM appointments LIMIT 1", [], (err, row) => {
    if (err || !row) {
      console.error(err || 'No appointments found');
      return;
    }
    const realBizId = row.businessId;
    console.log(`Checking stats for real business ID: ${realBizId}`);

    db.get("SELECT COUNT(*) as count FROM appointments WHERE businessId = ?", [realBizId], (err, countRow) => {
      if (err) return console.error(err);
      console.log(`Total appointments: ${countRow ? countRow.count : 0}`);
    });

    db.all("SELECT DISTINCT date(hora_reserva) as date, COUNT(*) as count FROM appointments WHERE businessId = ? GROUP BY date(hora_reserva)", [realBizId], (err, dateRows) => {
      if (err) return console.error(err);
      console.log('Distinct appointment dates and counts:');
      console.log(dateRows);
      console.log(`Total distinct days: ${dateRows.length}`);
    });

    db.all("SELECT s.nombre, COUNT(a.id) as count FROM appointments a JOIN services s ON a.serviceId = s.id WHERE a.businessId = ? GROUP BY s.id", [realBizId], (err, svcRows) => {
      if (err) return console.error(err);
      console.log('Booking counts per service:');
      console.log(svcRows);
    });
  });
});

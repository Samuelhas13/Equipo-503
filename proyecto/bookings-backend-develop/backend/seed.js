const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.sqlite');
console.log('Abriendo base de datos en:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err);
    process.exit(1);
  }
});

const saltRounds = 10;

function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function seed() {
  try {
    // 1. Limpiar datos existentes por seguridad
    console.log('Limpiando tablas...');
    await runQuery('DELETE FROM "payments";');
    await runQuery('DELETE FROM "appointments";');
    await runQuery('DELETE FROM "users";');
    await runQuery('DELETE FROM "customers";');
    await runQuery('DELETE FROM "business";');
    await runQuery('DELETE FROM "services";');
    await runQuery('DELETE FROM sqlite_sequence WHERE name IN ("payments", "appointments", "users", "customers", "business", "services");');

    // 2. Insertar Admin
    console.log('Insertando admin...');
    const adminPasswordHash = await bcrypt.hash('Admin123!', saltRounds);
    await runQuery(
      'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['Admin', 'Bookings', 'admin@bookings.com', '600111222', adminPasswordHash, 'admin', null]
    );

    // Bucle para crear 5 de cada entidad
    const businessPasswordHash = await bcrypt.hash('Business123!', saltRounds);
    const customerPasswordHash = await bcrypt.hash('Customer123!', saltRounds);

    console.log('Insertando 5 empresas, clientes, reservas y pagos...');

    for (let i = 1; i <= 5; i++) {
      // 3. Crear Empresa
      await runQuery('INSERT INTO "business" (nombre, direccion) VALUES (?, ?);', [`Empresa Prueba ${i}`, `Calle Principal ${i}`]);

      // 4. Crear Dueño de la Empresa
      await runQuery(
        'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [`Dueño ${i}`, `Empresa ${i}`, `business${i}@bookings.com`, `60020030${i}`, businessPasswordHash, 'business', i]
      );

      // 5. Crear Customer (en users y customers)
      const customerNombre = `Cliente${i}`;
      const customerApellido = `Prueba`;
      const customerEmail = `customer${i}@bookings.com`;
      const customerPhone = `60040050${i}`;

      const userInsert = await runQuery(
        'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [customerNombre, customerApellido, customerEmail, customerPhone, customerPasswordHash, 'customer', i]
      );
      const userId = userInsert.lastID;

      await runQuery(
        'INSERT INTO "customers" (nombre, apellido, email, numero, businessId) VALUES (?, ?, ?, ?, ?);',
        [customerNombre, customerApellido, customerEmail, customerPhone, i]
      );

      // 6. Crear un Servicio para esa empresa
      await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', [`Servicio Prueba ${i}`, 10.0 * i, i]);

      // 7. Crear una Reserva (Appointment)
      // Hora formato AAAA-MM-DD HH:MM
      const horaReserva = `2026-06-0${i} 10:00`;
      await runQuery(
        'INSERT INTO "appointments" (hora_reserva, serviceId, businessId, customerId, userId) VALUES (?, ?, ?, ?, ?);',
        [horaReserva, i, i, i, userId]
      );

      // 8. Crear un Pago (Payment) para la reserva anterior
      const estado = i % 2 === 0 ? 'pagado' : 'por cobrar';
      const metodo = i % 2 === 0 ? 'tarjeta' : 'efectivo';
      await runQuery(
        'INSERT INTO "payments" (metodo_pago, estado, hora_pago, customerId, servicioId, appointmentId) VALUES (?, ?, ?, ?, ?, ?);',
        [metodo, estado, horaReserva, i, i, i]
      );
    }

    console.log('¡Seeding completado con éxito!');
  } catch (error) {
    console.error('Error durante el seeding:', error);
  } finally {
    db.close();
  }
}

seed();

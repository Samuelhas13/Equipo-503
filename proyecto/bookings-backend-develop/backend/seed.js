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
    await runQuery('DELETE FROM "users";');
    await runQuery('DELETE FROM "customers";');
    await runQuery('DELETE FROM "business";');
    await runQuery('DELETE FROM "services";');
    await runQuery('DELETE FROM sqlite_sequence WHERE name IN ("users", "customers", "business", "services");');

    // 2. Insertar Empresas
    console.log('Insertando empresas...');
    await runQuery('INSERT INTO "business" (nombre, direccion) VALUES (?, ?);', ['Empresa Alfa', 'Calle de la Ciencia 123']);
    await runQuery('INSERT INTO "business" (nombre, direccion) VALUES (?, ?);', ['Empresa Beta', 'Avenida de la Tecnología 456']);

    // 3. Insertar Admin
    console.log('Insertando admin...');
    const adminPasswordHash = await bcrypt.hash('Admin123!', saltRounds);
    await runQuery(
      'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['Admin', 'Bookings', 'admin@bookings.com', '600111222', adminPasswordHash, 'admin', null]
    );

    // 4. Insertar Business Users
    console.log('Insertando dueños de empresas...');
    const businessPasswordHash = await bcrypt.hash('Business123!', saltRounds);
    await runQuery(
      'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['Dueño', 'Alfa', 'business1@bookings.com', '600222333', businessPasswordHash, 'business', 1]
    );
    await runQuery(
      'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['Dueño', 'Beta', 'business2@bookings.com', '600444555', businessPasswordHash, 'business', 2]
    );

    // 5. Insertar 10 Customers en la tabla users y la tabla customers
    console.log('Insertando 10 clientes...');
    const customerPasswordHash = await bcrypt.hash('Customer123!', saltRounds);

    for (let i = 1; i <= 10; i++) {
      const nombre = `Cliente${i}`;
      const apellido = `DePrueba`;
      const email = `customer${i}@bookings.com`;
      const numero = `60000000${i}`;
      const businessId = i <= 5 ? 1 : 2; // Primeros 5 a Alfa, últimos 5 a Beta

      // Insertar en la tabla "users"
      await runQuery(
        'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [nombre, apellido, email, numero, customerPasswordHash, 'customer', businessId]
      );

      // Insertar en la tabla "customers"
      await runQuery(
        'INSERT INTO "customers" (nombre, apellido, email, numero, businessId) VALUES (?, ?, ?, ?, ?);',
        [nombre, apellido, email, numero, businessId]
      );
    }

    // 6. Insertar Servicios de prueba
    console.log('Insertando servicios...');
    await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', ['Corte de pelo moderno', 25.0, 1]);
    await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', ['Masaje relajante', 50.0, 1]);
    await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', ['Cena gourmet', 120.0, 2]);

    console.log('¡Seeding completado con éxito!');
  } catch (error) {
    console.error('Error durante el seeding:', error);
  } finally {
    db.close();
  }
}

seed();

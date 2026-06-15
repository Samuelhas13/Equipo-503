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
    await runQuery('DELETE FROM "contacts";');
    await runQuery('DELETE FROM "rewards";');
    await runQuery('DELETE FROM "reward_redemptions";');
    await runQuery('DELETE FROM sqlite_sequence WHERE name IN ("users", "customers", "business", "services", "contacts", "rewards", "reward_redemptions");');

    // 2. Insertar Empresas
    console.log('Insertando empresas...');
    await runQuery('INSERT INTO "business" (nombre, direccion) VALUES (?, ?);', ['Empresa Alfa', 'Calle de la Ciencia 123']);
    await runQuery('INSERT INTO "business" (nombre, direccion) VALUES (?, ?);', ['Empresa Beta', 'Avenida de la Tecnología 456']);

    // 3. Insertar Admin
    console.log('Insertando admin...');
    const passwordHash = await bcrypt.hash('Password123!', saltRounds);
    await runQuery(
      'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['Admin', 'Bookings', 'admin@bookings.com', '600111222', passwordHash, 'admin', null]
    );

    // 4. Insertar Business Users
    console.log('Insertando dueños de empresas...');
    await runQuery(
      'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['Dueño', 'Alfa', 'business1@empresa.com', '600222333', passwordHash, 'business', 1]
    );
    await runQuery(
      'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['Dueño', 'Beta', 'business2@empresa.com', '600444555', passwordHash, 'business', 2]
    );

    // 5. Insertar 10 Customers en la tabla users y la tabla customers
    console.log('Insertando 10 clientes...');

    for (let i = 1; i <= 10; i++) {
      const nombre = `Cliente${i}`;
      const apellido = `DePrueba`;
      const email = `cliente${i}@masivo.com`;
      const numero = `60000000${i}`;
      const businessId = i <= 5 ? 1 : 2; // Primeros 5 a Alfa, últimos 5 a Beta

      // Insertar en la tabla "users"
      await runQuery(
        'INSERT INTO "users" (nombre, apellido, email, numero, password, role, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
        [nombre, apellido, email, numero, passwordHash, 'customer', businessId]
      );

      // Insertar en la tabla "customers"
      await runQuery(
        'INSERT INTO "customers" (nombre, apellido, email, numero, businessId) VALUES (?, ?, ?, ?, ?);',
        [nombre, apellido, email, numero, businessId]
      );
    }

    // 6. Insertar Servicios de prueba
    console.log('Insertando servicios...');
    // Business 1 (Alfa) - Belleza / Estética / Spa
    await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', ['Corte de pelo moderno', 25.0, 1]);
    await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', ['Masaje relajante', 50.0, 1]);
    await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', ['Manicura express', 20.0, 1]);
    await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', ['Afeitado tradicional', 15.0, 1]);
    // Business 2 (Beta) - Restaurante / Gastronomía
    await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', ['Cena gourmet', 120.0, 2]);
    await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', ['Menú del día', 15.0, 2]);
    await runQuery('INSERT INTO "services" (nombre, precio, businessId) VALUES (?, ?, ?);', ['Desayuno especial', 10.0, 2]);

    // 7. Insertar Mensajes de contacto
    console.log('Insertando mensajes de contacto...');
    await runQuery(
      'INSERT INTO "contacts" (name, email, subject, message, isRead, customerId, businessId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);',
      ['Cliente1 DePrueba', 'customer1@bookings.com', 'support', 'Hola, tengo dudas con mi reserva.', 0, 1, null]
    );
    await runQuery(
      'INSERT INTO "contacts" (name, email, subject, message, isRead, replyMessage, customerId, businessId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);',
      ['Dueño Alfa', 'business1@bookings.com', 'billing', 'Duda sobre la factura.', 1, 'Respondido y verificado.', null, 1]
    );

    // 8. Insertar Premios (Rewards)
    console.log('Insertando premios...');
    // Empresa 1 (Alfa)
    await runQuery(
      'INSERT INTO "rewards" (title, description, type, discountValue, requiredPoints, isActive, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['10% de Descuento', 'Obtén 10% en servicios.', 'discount', 10.0, 100, 1, 1]
    );
    await runQuery(
      'INSERT INTO "rewards" (title, description, type, discountValue, requiredPoints, isActive, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['Afeitado de Regalo', 'Afeitado tradicional gratis.', 'gift', null, 200, 1, 1]
    );
    // Empresa 2 (Beta)
    await runQuery(
      'INSERT INTO "rewards" (title, description, type, discountValue, requiredPoints, isActive, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['20% de Descuento', 'Obtén 20% en tu cena.', 'discount', 20.0, 150, 1, 2]
    );
    await runQuery(
      'INSERT INTO "rewards" (title, description, type, discountValue, requiredPoints, isActive, businessId) VALUES (?, ?, ?, ?, ?, ?, ?);',
      ['Postre de Regalo', 'Un postre gratis con tu menú.', 'gift', null, 80, 1, 2]
    );

    // Actualizar puntos de clientes para que tengan saldo para canjes
    console.log('Dando puntos a clientes de prueba...');
    await runQuery('UPDATE "customers" SET puntos = 150 WHERE id = 1;');
    await runQuery('UPDATE "customers" SET puntos = 300 WHERE id = 2;');
    await runQuery('UPDATE "customers" SET puntos = 50 WHERE id = 3;');

    // 9. Insertar Canjes (RewardRedemptions)
    console.log('Insertando canjes de premios...');
    // Cliente 1 (id: 1) canjea en Empresa 1 (Alfa) premio 1 (10% descuento) - Estado pending (activo)
    await runQuery(
      'INSERT INTO "reward_redemptions" (status, code, customerId, rewardId, redeemedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);',
      ['pending', 'ALFA-1001', 1, 1]
    );
    // Cliente 2 (id: 2) canjea en Empresa 1 (Alfa) premio 2 (Afeitado) - Estado used (usado)
    await runQuery(
      'INSERT INTO "reward_redemptions" (status, code, customerId, rewardId, redeemedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);',
      ['used', 'ALFA-1002', 2, 2]
    );
    // Cliente 2 (id: 2) canjea en Empresa 2 (Beta) premio 4 (Postre) - Estado pending (activo)
    await runQuery(
      'INSERT INTO "reward_redemptions" (status, code, customerId, rewardId, redeemedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);',
      ['pending', 'BETA-2001', 2, 4]
    );

    console.log('¡Seeding completado con éxito!');
  } catch (error) {
    console.error('Error durante el seeding:', error);
  } finally {
    db.close();
  }
}

seed();

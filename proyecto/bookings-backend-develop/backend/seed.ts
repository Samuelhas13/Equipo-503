import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Business } from './src/business/business.entity';
import { User, UserRole } from './src/users/user.entity';
import { Customer } from './src/customers/customer.entity';
import { Service } from './src/services/service.entity';
import { Appointment } from './src/appointments/appointment.entity';
import { Payment, PaymentMethod, PaymentStatus } from './src/payments/payment.entity';
import { Reward } from './src/rewards/reward.entity';
import { RewardRedemption } from './src/rewards/reward-redemption.entity';
import { Notification } from './src/notifications/notification.entity';
import { ContactMessage } from './src/contact/contact.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'data/database.sqlite',
  entities: [
    Business,
    User,
    Customer,
    Service,
    Appointment,
    Payment,
    Reward,
    RewardRedemption,
    Notification,
    ContactMessage,
  ],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('✓ Conectado a la base de datos');

  await AppDataSource.query('PRAGMA foreign_keys = OFF;');
  await AppDataSource.query('DELETE FROM "payments"');
  await AppDataSource.query('DELETE FROM "appointments"');
  await AppDataSource.query('DELETE FROM "services"');
  await AppDataSource.query('DELETE FROM "customers"');
  await AppDataSource.query('DELETE FROM "users"');
  await AppDataSource.query('DELETE FROM "business"');
  await AppDataSource.query('DELETE FROM "rewards"');
  await AppDataSource.query('DELETE FROM "reward_redemptions"');
  await AppDataSource.query('DELETE FROM "notifications"');
  await AppDataSource.query('DELETE FROM "contacts"');
  await AppDataSource.query('PRAGMA foreign_keys = ON;');
  console.log('✓ Tablas limpiadas');

  const businessRepo = AppDataSource.getRepository(Business);
  const userRepo = AppDataSource.getRepository(User);
  const serviceRepo = AppDataSource.getRepository(Service);
  const customerRepo = AppDataSource.getRepository(Customer);
  const appointmentRepo = AppDataSource.getRepository(Appointment);
  const paymentRepo = AppDataSource.getRepository(Payment);

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Admin
  await userRepo.save({
    nombre: 'Carlos', apellido: 'Administrador',
    email: 'admin@bookings.com', numero: '600000001',
    password: passwordHash, role: UserRole.ADMIN,
  });

  // 2. 500 Businesses & 1 Owner per Business & 40 Services per Business
  const TOTAL_BUSINESSES = 500;
  const SERVICES_PER_BUSINESS = 4;
  console.log(`⏳ Generando ${TOTAL_BUSINESSES} empresas y ${TOTAL_BUSINESSES * SERVICES_PER_BUSINESS} servicios...`);
  
  const savedBusinesses: Business[] = [];
  const savedServices: Service[] = []; // Para usar en las reservas

  for (let i = 0; i < TOTAL_BUSINESSES; i += 100) {
    const bChunk: Business[] = [];
    for (let j = 0; j < 100; j++) {
      bChunk.push(businessRepo.create({
        nombre: `Empresa ${i+j+1}`, direccion: `Calle Principal ${i+j+1}, Ciudad`,
      }));
    }
    const savedB = await businessRepo.save(bChunk);
    savedBusinesses.push(...savedB);

    // Dueños de empresas
    const uChunk: User[] = [];
    for (let j = 0; j < 100; j++) {
      uChunk.push(userRepo.create({
        nombre: `Dueño${i+j+1}`, apellido: `Empresa`,
        email: `business${i+j+1}@empresa.com`, numero: `600${String(i+j+1).padStart(6, '0')}`,
        password: passwordHash, role: UserRole.BUSINESS,
        business: savedB[j],
      }));
    }
    await userRepo.save(uChunk);

    // Servicios
    for (let j = 0; j < 100; j++) {
      const sChunk: Service[] = [];
      for (let k = 0; k < SERVICES_PER_BUSINESS; k++) {
        sChunk.push(serviceRepo.create({
          nombre: `Servicio ${k+1} - Emp ${i+j+1}`,
          precio: 10 + k,
          business: savedB[j],
        }));
      }
      const savedS = await serviceRepo.save(sChunk);
      savedServices.push(...savedS);
    }
    process.stdout.write(`  Procesadas ${i+100} empresas\r`);
  }
  console.log(`\n✓ ${TOTAL_BUSINESSES} empresas, ${TOTAL_BUSINESSES} dueños, y ${TOTAL_BUSINESSES * SERVICES_PER_BUSINESS} servicios creados`);

  // 3. 10,000 Customers + Users, Appointments, Payments
  console.log('⏳ Generando 10,000 clientes, reservas y pagos...');
  const TOTAL_EXTRA = 10000;
  const CHUNK_SIZE = 500;

  for (let i = 0; i < TOTAL_EXTRA; i += CHUNK_SIZE) {
    const userChunk: any[] = [];
    const customerChunk: any[] = [];
    
    for (let j = 0; j < CHUNK_SIZE; j++) {
      const idx = i + j + 1;
      const bIndex = idx % TOTAL_BUSINESSES;
      
      userChunk.push(userRepo.create({
        nombre: `Cliente${idx}`, apellido: `Masivo`,
        email: `cliente${idx}@masivo.com`, numero: `700${String(idx).padStart(6, '0')}`,
        password: passwordHash, role: UserRole.CUSTOMER,
        business: savedBusinesses[bIndex],
      }));

      customerChunk.push(customerRepo.create({
        nombre: `Cliente${idx}`, apellido: `Masivo`,
        email: `cliente${idx}@masivo.com`, numero: `700${String(idx).padStart(6, '0')}`,
        business: savedBusinesses[bIndex],
      }));
    }

    const savedUsers = await userRepo.save(userChunk);
    const savedCustomers = await customerRepo.save(customerChunk);

    const appointmentChunk: any[] = [];
    const baseDate = new Date('2026-06-09T12:00:00');

    for (let j = 0; j < CHUNK_SIZE; j++) {
      const idx = i + j + 1;
      const bIndex = idx % TOTAL_BUSINESSES;
      const serviceIdx = (bIndex * SERVICES_PER_BUSINESS); 
      
      // Calculate realistic date and time (spread across 60 days)
      const dayOffset = (idx % 60) - 30; // -30 to +29 days
      const hour = 8 + (idx % 12); // Hours from 8:00 to 19:00
      const minutes = (idx % 4) * 15; // 00, 15, 30, 45 minutes
      
      const appDate = new Date(baseDate);
      appDate.setDate(baseDate.getDate() + dayOffset);
      
      const yyyy = appDate.getFullYear();
      const mm = String(appDate.getMonth() + 1).padStart(2, '0');
      const dd = String(appDate.getDate()).padStart(2, '0');
      const hh = String(hour).padStart(2, '0');
      const min = String(minutes).padStart(2, '0');
      
      const hora_reserva = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
      
      // Calculate realistic status based on timeframe
      let status = 'pending';
      if (dayOffset < 0) {
        if (idx % 10 < 7) {
          status = 'completed';
        } else if (idx % 10 < 9) {
          status = 'paid';
        } else {
          status = 'canceled';
        }
      } else {
        if (idx % 10 < 5) {
          status = 'pending';
        } else if (idx % 10 < 9) {
          status = 'confirmed';
        } else {
          status = 'canceled';
        }
      }

      appointmentChunk.push(appointmentRepo.create({
        user: savedUsers[j],
        customer: savedCustomers[j],
        business: savedBusinesses[bIndex],
        service: savedServices[serviceIdx],
        hora_reserva,
        status,
      }));
    }
    const savedAppointments = await appointmentRepo.save(appointmentChunk);

    const paymentChunk: any[] = [];
    for (let j = 0; j < CHUNK_SIZE; j++) {
      const idx = i + j + 1;
      const bIndex = idx % TOTAL_BUSINESSES;
      const serviceIdx = (bIndex * SERVICES_PER_BUSINESS); 
      const appointment = savedAppointments[j];
      
      // Set payment status based on reservation status
      let estado = PaymentStatus.POR_COBRAR;
      if (appointment.status === 'completed' || appointment.status === 'paid') {
        estado = PaymentStatus.PAGADO;
      } else if (appointment.status === 'canceled') {
        estado = PaymentStatus.CANCELADO;
      }
      
      // Calculate realistic payment time (15 minutes after appointment start time)
      const rawTime = appointment.hora_reserva;
      const dateParts = rawTime.split(' ');
      const dateStr = dateParts[0];
      const timeStr = dateParts[1] || '10:00';
      const [hStr, mStr] = timeStr.split(':');
      let hour = parseInt(hStr, 10);
      let minute = parseInt(mStr, 10) + 15;
      if (minute >= 60) {
        hour += 1;
        minute -= 60;
      }
      const hora_pago = `${dateStr} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      paymentChunk.push(paymentRepo.create({
        customer: savedCustomers[j],
        metodo_pago: idx % 2 === 0 ? PaymentMethod.TARJETA : PaymentMethod.EFECTIVO,
        estado,
        servicio: savedServices[serviceIdx],
        hora_pago,
        appointment,
      }));
    }
    await paymentRepo.save(paymentChunk);
    
    process.stdout.write(`  Procesados: ${i + CHUNK_SIZE} / ${TOTAL_EXTRA}\r`);
  }

  console.log('\n\n🎉 Seed masivo completado con éxito');
  console.log('─────────────────────────────');
  console.log(`  Empresas:          ${TOTAL_BUSINESSES}`);
  console.log(`  Dueños de Empresa: ${TOTAL_BUSINESSES}`);
  console.log(`  Servicios:         ${TOTAL_BUSINESSES * SERVICES_PER_BUSINESS}`);
  console.log(`  Clientes (Users):  ${TOTAL_EXTRA}`);
  console.log(`  Reservas y Pagos:  ${TOTAL_EXTRA}`);
  console.log('─────────────────────────────');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});
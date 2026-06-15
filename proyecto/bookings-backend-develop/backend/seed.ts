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
import { ContactMessage, ContactSubject } from './src/contact/contact.entity';

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
  const contactRepo = AppDataSource.getRepository(ContactMessage);

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

  // 2b. Premios de Empresas (Rewards)
  console.log('⏳ Generando premios de empresas...');
  const rewardRepo = AppDataSource.getRepository(Reward);
  const rewardRedemptionRepo = AppDataSource.getRepository(RewardRedemption);
  const savedRewards: Reward[] = [];

  for (let i = 0; i < savedBusinesses.length; i++) {
    const biz = savedBusinesses[i];
    savedRewards.push(
      rewardRepo.create({
        business: biz,
        title: '10% Descuento',
        description: 'Obtén un 10% de descuento en tu próximo servicio.',
        type: 'discount',
        discountValue: 10,
        requiredPoints: 100,
        isActive: true,
      }),
      rewardRepo.create({
        business: biz,
        title: 'Servicio Básico Gratis',
        description: 'Canjea por un servicio gratis.',
        type: 'gift',
        requiredPoints: 200,
        isActive: true,
      })
    );
  }
  const allRewards = await rewardRepo.save(savedRewards);
  console.log(`✓ ${allRewards.length} premios creados`);

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

    // Seed customer points and redemptions
    const redemptionChunk: RewardRedemption[] = [];
    const updatedCustomers: Customer[] = [];

    for (let j = 0; j < CHUNK_SIZE; j++) {
      const customer = savedCustomers[j];
      const idx = i + j + 1;

      // Assign random points
      const points = (idx % 4) * 100; // 0, 100, 200, 300 points
      if (points > 0) {
        customer.puntos = points;
        updatedCustomers.push(customer);
      }

      // If client has enough points, claim a reward
      if (points >= 100 && idx % 3 === 0) {
        const bIndex = idx % TOTAL_BUSINESSES;
        const bizRewards = allRewards.filter(
          (r) => r.business.id === savedBusinesses[bIndex].id,
        );
        if (bizRewards.length > 0) {
          const reward =
            points >= 200 && bizRewards.length > 1
              ? bizRewards[1]
              : bizRewards[0];
          redemptionChunk.push(
            rewardRedemptionRepo.create({
              customer,
              reward,
              status: idx % 2 === 0 ? 'pending' : 'used',
              code: `CANJE-${idx}`,
              redeemedAt: new Date(),
            }),
          );
        }
      }
    }

    if (updatedCustomers.length > 0) {
      await customerRepo.save(updatedCustomers);
    }
    if (redemptionChunk.length > 0) {
      await rewardRedemptionRepo.save(redemptionChunk);
    }

    const appointmentChunk: any[] = [];
    const baseDate = new Date('2026-06-09T12:00:00');

    for (let j = 0; j < CHUNK_SIZE; j++) {
      const idx = i + j + 1;
      const bIndex = idx % TOTAL_BUSINESSES;
      
      // Select a varied service for the business (randomly among the 4 available services)
      const serviceOffset = Math.floor(Math.random() * SERVICES_PER_BUSINESS);
      const serviceIdx = (bIndex * SERVICES_PER_BUSINESS) + serviceOffset; 
      
      // Calculate realistic date and time (spread across 60 days using random offset for uniform distribution)
      const dayOffset = Math.floor(Math.random() * 60) - 30; // -30 to +29 days
      const hour = 8 + Math.floor(Math.random() * 11); // Hours from 8:00 to 18:00
      const minutes = Math.floor(Math.random() * 4) * 15; // 00, 15, 30, 45 minutes
      
      const appDate = new Date(baseDate);
      appDate.setDate(baseDate.getDate() + dayOffset);
      
      const yyyy = appDate.getFullYear();
      const mm = String(appDate.getMonth() + 1).padStart(2, '0');
      const dd = String(appDate.getDate()).padStart(2, '0');
      const hh = String(hour).padStart(2, '0');
      const min = String(minutes).padStart(2, '0');
      
      const hora_reserva = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
      
      // Calculate realistic status based on timeframe with randomized weights
      let status = 'pending';
      if (dayOffset < 0) {
        const rand = Math.random();
        if (rand < 0.7) {
          status = 'completed';
        } else if (rand < 0.9) {
          status = 'paid';
        } else {
          status = 'canceled';
        }
      } else {
        const rand = Math.random();
        if (rand < 0.5) {
          status = 'pending';
        } else if (rand < 0.9) {
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
        servicio: appointment.service,
        hora_pago,
        appointment,
      }));
    }
    await paymentRepo.save(paymentChunk);
    
    process.stdout.write(`  Procesados: ${i + CHUNK_SIZE} / ${TOTAL_EXTRA}\r`);
  }

  // 4. Mensajes de contacto (ContactMessage)
  console.log('⏳ Generando mensajes de contacto de prueba...');
  const testContacts = [
    contactRepo.create({
      name: 'Cliente1 Masivo',
      email: 'cliente1@masivo.com',
      subject: ContactSubject.SUPPORT,
      message: 'Hola, tengo una pregunta sobre mis puntos acumulados.',
      customerId: 1,
      isRead: false,
    }),
    contactRepo.create({
      name: 'Dueño1 Empresa',
      email: 'business1@empresa.com',
      subject: ContactSubject.BILLING,
      message: 'Hola, tengo un problema con la facturación de este mes.',
      businessId: 1,
      isRead: true,
      replyMessage: 'Hemos revisado su factura y todo está correcto. Saludos.',
    }),
    contactRepo.create({
      name: 'Cliente2 Masivo',
      email: 'cliente2@masivo.com',
      subject: ContactSubject.OTHER,
      message: 'Sugerencia: sería genial tener un tema oscuro en el móvil.',
      customerId: 2,
      isRead: false,
    }),
  ];
  await contactRepo.save(testContacts);
  console.log('✓ Mensajes de contacto creados');

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
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Business } from './businesses/business.entity';
import { Customer } from './customers/customer.entity';
import { Appointment, AppointmentStatus } from './appointments/appointment.entity';
import { Payment, PaymentStatus, PaymentMethod } from './payments/payment.entity';
import { faker } from '@faker-js/faker';

const CATEGORIES_WITH_SERVICES = [
  {
    name: 'Peluquería & Estética',
    services: ['Corte de pelo caballero', 'Tinte y peinado', 'Manicura completa', 'Tratamiento facial hidratante', 'Afeitado de barba'],
  },
  {
    name: 'Fisioterapia & Salud',
    services: ['Fisioterapia deportiva', 'Masaje descontracturante', 'Consulta osteopatía', 'Rehabilitación física', 'Drenaje linfático'],
  },
  {
    name: 'Fitness & Entrenamiento',
    services: ['Entrenamiento personal', 'Clase de Yoga privada', 'Evaluación nutricional', 'Pilates en máquinas', 'Prueba de esfuerzo'],
  },
  {
    name: 'Educación & Mentoría',
    services: ['Clase particular de Matemáticas', 'Tutoría de Inglés C1', 'Taller de Programación web', 'Asesoría de carrera'],
  },
  {
    name: 'Veterinaria & Mascotas',
    services: ['Consulta veterinaria general', 'Vacunación anual', 'Peluquería canina', 'Limpieza dental para mascotas'],
  },
  {
    name: 'Gastronomía & Restauración',
    services: ['Cena menú degustación', 'Almuerzo ejecutivo', 'Reserva de mesa', 'Brunch especial'],
  },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30'
];

async function bootstrap() {
  console.log('🌱 Iniciando la base de datos con datos de prueba...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const businessRepo = dataSource.getRepository(Business);
  const customerRepo = dataSource.getRepository(Customer);
  const appointmentRepo = dataSource.getRepository(Appointment);
  const paymentRepo = dataSource.getRepository(Payment);

  // 1. Limpieza de base de datos
  console.log('🧹 Limpiando tablas existentes...');
  await paymentRepo.clear();
  await appointmentRepo.clear();
  await customerRepo.clear();
  await businessRepo.clear();
  console.log('✅ Base de datos limpia.');

  // 2. Crear Empresas (Businesses)
  console.log('🏢 Generando empresas...');
  const businesses: Business[] = [];

  const specificBusinesses = [
    {
      name: 'Peluquería Nova',
      category: 'Peluquería & Estética',
      email: 'nova@bookflow.com',
      phone: '+34 600 123 456',
      description: 'Cortes, peinados y tratamientos capilares de vanguardia.',
    },
    {
      name: 'Restaurante Marea',
      category: 'Gastronomía & Restauración',
      email: 'marea@bookflow.com',
      phone: '+34 600 987 654',
      description: 'Gastronomía marina y de autor frente al mar.',
    },
  ];

  for (const spec of specificBusinesses) {
    const business = new Business();
    business.name = spec.name;
    business.category = spec.category;
    business.email = spec.email;
    business.phone = spec.phone;
    business.description = spec.description;
    business.password = '123456';
    const saved = await businessRepo.save(business);
    businesses.push(saved);
    console.log(`   - Creada empresa específica: ${saved.name} [${saved.category}]`);
  }
  
  for (let i = 0; i < CATEGORIES_WITH_SERVICES.length; i++) {
    const catInfo = CATEGORIES_WITH_SERVICES[i];
    const business = new Business();
    business.name = faker.company.name();
    business.category = catInfo.name;
    business.email = `contacto@${business.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    business.phone = `+34 6${faker.string.numeric(8)}`;
    business.description = faker.company.catchPhrase();
    business.password = '123456';
    
    const savedBusiness = await businessRepo.save(business);
    businesses.push(savedBusiness);
    console.log(`   - Creada empresa aleatoria: ${savedBusiness.name} [${savedBusiness.category}]`);
  }

  // 3. Crear Clientes (Customers)
  console.log('👥 Generando clientes...');
  const customers: Customer[] = [];

  const specificCustomers = [
    { name: 'Juan Pérez', email: 'juan@bookflow.com', phone: '+34 600 111 222' },
    { name: 'María López', email: 'maria@bookflow.com', phone: '+34 600 333 444' },
  ];

  for (const spec of specificCustomers) {
    const customer = new Customer();
    customer.name = spec.name;
    customer.email = spec.email;
    customer.phone = spec.phone;
    customer.business = null as any;
    customer.nextBooking = null as any;
    customer.password = '123456';
    const saved = await customerRepo.save(customer);
    customers.push(saved);
    console.log(`   - Creado cliente específico: ${saved.name}`);
  }
  
  for (let i = 0; i < 18; i++) {
    const customer = new Customer();
    customer.name = faker.person.fullName();
    customer.email = `cliente_${i}_${faker.string.alphanumeric(4).toLowerCase()}@example.com`;
    customer.phone = `+34 6${faker.string.numeric(8)}`;
    customer.business = faker.helpers.arrayElement([faker.company.name(), null]) as any;
    customer.nextBooking = null as any; // Se calculará después o se mantendrá como opcional
    customer.password = '123456';

    const savedCustomer = await customerRepo.save(customer);
    customers.push(savedCustomer);
  }
  console.log(`✅ Creados ${customers.length} clientes.`);

  // 4. Crear Reservas (Appointments)
  console.log('📅 Generando reservas...');
  const appointments: Appointment[] = [];
  const usedSlots = new Set<string>();

  // Generamos un rango de fechas para las reservas: últimos 15 días hasta próximos 15 días
  const dates: string[] = [];
  for (let d = -15; d <= 15; d++) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + d);
    dates.push(dateObj.toISOString().split('T')[0]);
  }

  for (let i = 0; i < 40; i++) {
    const randomCustomer = faker.helpers.arrayElement(customers);
    const randomBusiness = faker.helpers.arrayElement(businesses);
    
    // Buscar los servicios del negocio según su categoría
    const catInfo = CATEGORIES_WITH_SERVICES.find(c => c.name === randomBusiness.category);
    const serviceName = catInfo ? faker.helpers.arrayElement(catInfo.services) : 'Servicio general';

    // Asegurarse de que no haya solapamiento de horario para el mismo negocio
    let dateStr = '';
    let timeStr = '';
    let attempt = 0;
    let slotKey = '';

    do {
      dateStr = faker.helpers.arrayElement(dates);
      timeStr = faker.helpers.arrayElement(TIME_SLOTS);
      slotKey = `${randomBusiness.id}-${dateStr}-${timeStr}`;
      attempt++;
    } while (usedSlots.has(slotKey) && attempt < 100);

    if (attempt >= 100) {
      // Si no pudimos encontrar un slot libre después de 100 intentos, nos saltamos esta reserva
      continue;
    }

    usedSlots.add(slotKey);

    const appointment = new Appointment();
    appointment.date = dateStr;
    appointment.time = timeStr;
    appointment.customerId = randomCustomer.id;
    appointment.businessId = randomBusiness.id;
    appointment.serviceName = serviceName;
    
    // Asignar estado aleatorio pero lógico según la fecha
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr < todayStr) {
      // Reservas pasadas: completadas, pagadas, o canceladas
      appointment.status = faker.helpers.arrayElement([
        AppointmentStatus.COMPLETED,
        AppointmentStatus.PAID,
        AppointmentStatus.CANCELED
      ]);
    } else {
      // Reservas futuras: confirmadas, pendientes, o canceladas
      appointment.status = faker.helpers.arrayElement([
        AppointmentStatus.PENDING,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELED
      ]);
    }

    const savedAppointment = await appointmentRepo.save(appointment);
    appointments.push(savedAppointment);
  }
  console.log(`✅ Creadas ${appointments.length} reservas.`);

  // Actualizar nextBooking para clientes que tengan reservas futuras confirmadas o pendientes
  console.log('🔄 Actualizando "Próxima Reserva" para los clientes...');
  const todayStr = new Date().toISOString().split('T')[0];
  
  for (const customer of customers) {
    // Buscar reservas futuras de este cliente que estén pendientes o confirmadas
    const futureBookings = appointments.filter(
      app => app.customerId === customer.id && 
             app.date >= todayStr && 
             (app.status === AppointmentStatus.PENDING || app.status === AppointmentStatus.CONFIRMED)
    );

    if (futureBookings.length > 0) {
      // Ordenar por fecha y hora
      futureBookings.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });

      const nextApp = futureBookings[0];
      // Formatear como "Fecha · Hora", ej. "2026-05-30 · 10:30"
      customer.nextBooking = `${nextApp.date} · ${nextApp.time}`;
      await customerRepo.save(customer);
    }
  }
  console.log('✅ Clientes actualizados con sus próximas reservas.');

  // 5. Crear Pagos (Payments)
  console.log('💳 Generando cobros y pagos...');
  let paymentsCount = 0;

  for (const app of appointments) {
    // No todas las reservas tienen que estar pagadas o facturadas (ej. canceladas o pendientes)
    // Pero si el estado de la reserva es PAID o COMPLETED, debe tener un pago completado
    let shouldCreatePayment = false;
    let paymentStatus = PaymentStatus.PENDING;
    let paymentMethod = PaymentMethod.PENDING;

    if (app.status === AppointmentStatus.PAID || app.status === AppointmentStatus.COMPLETED) {
      shouldCreatePayment = true;
      paymentStatus = PaymentStatus.PAID;
      paymentMethod = faker.helpers.arrayElement([PaymentMethod.CARD, PaymentMethod.CASH, PaymentMethod.BIZUM]);
    } else if (app.status === AppointmentStatus.CONFIRMED) {
      // Algunas reservas confirmadas pueden tener pago ya realizado o pendiente
      shouldCreatePayment = faker.datatype.boolean(0.5); // 50% de probabilidad
      if (shouldCreatePayment) {
        paymentStatus = faker.helpers.arrayElement([PaymentStatus.PAID, PaymentStatus.PENDING]);
        paymentMethod = paymentStatus === PaymentStatus.PAID 
          ? faker.helpers.arrayElement([PaymentMethod.CARD, PaymentMethod.CASH, PaymentMethod.BIZUM])
          : PaymentMethod.PENDING;
      }
    } else if (app.status === AppointmentStatus.CANCELED) {
      // Algunas reservas canceladas pueden tener pagos fallidos o reembolsados
      shouldCreatePayment = faker.datatype.boolean(0.3); // 30% de probabilidad
      if (shouldCreatePayment) {
        paymentStatus = faker.helpers.arrayElement([PaymentStatus.FAILED, PaymentStatus.REFUNDED]);
        paymentMethod = faker.helpers.arrayElement([PaymentMethod.CARD, PaymentMethod.BIZUM]);
      }
    } else if (app.status === AppointmentStatus.PENDING) {
      // Reservas pendientes: 20% de probabilidad de tener un pago pendiente
      shouldCreatePayment = faker.datatype.boolean(0.2);
      if (shouldCreatePayment) {
        paymentStatus = PaymentStatus.PENDING;
        paymentMethod = PaymentMethod.PENDING;
      }
    }

    if (shouldCreatePayment) {
      const payment = new Payment();
      payment.amount = parseFloat(faker.commerce.price({ min: 15, max: 95, dec: 2 }));
      payment.date = app.date; // Generalmente se cobra el día de la cita
      payment.status = paymentStatus;
      payment.paymentMethod = paymentMethod;
      payment.appointmentId = app.id;
      payment.customerId = app.customerId;

      await paymentRepo.save(payment);
      paymentsCount++;
    }
  }

  console.log(`✅ Creados ${paymentsCount} pagos y cobros.`);
  console.log('🎉 Seeding finalizado con éxito.');

  await app.close();
}

bootstrap().catch((err) => {
  console.error('❌ Error al ejecutar el seeding:', err);
  process.exit(1);
});
